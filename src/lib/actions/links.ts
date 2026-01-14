'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type ConnectionInsert = Database['public']['Tables']['connections']['Insert']
import { createNotification } from '@/lib/notifications'

const LINK_REGEX = /\[\[(.*?)\]\]/g

export async function parseLinks(content: string) {
    const matches = [...content.matchAll(LINK_REGEX)]
    return matches.map(m => ({
        fullMatch: m[0],
        title: m[1],
        index: m.index
    }))
}

function extractContext(content: string, index: number, length: number): string {
    // Find sentence boundaries around the link
    // Look backward for (.!?) + space or Newline or Start
    const endOfPreviousSentence = Math.max(
        content.lastIndexOf('.', index),
        content.lastIndexOf('!', index),
        content.lastIndexOf('?', index),
        content.lastIndexOf('\n', index)
    )

    const start = endOfPreviousSentence === -1 ? 0 : endOfPreviousSentence + 1

    // Look forward for (.!?) or Newline or End
    let end = -1
    const terminators = ['.', '!', '?', '\n']
    for (const t of terminators) {
        const idx = content.indexOf(t, index + length)
        if (idx !== -1 && (end === -1 || idx < end)) {
            end = idx
        }
    }

    if (end === -1) end = content.length

    return content.substring(start, end + 1).trim()
}

export async function syncConnections(noteId: string, content: string, userId: string): Promise<number> {
    const supabase = await createClient()
    const links = await parseLinks(content)

    // 1. Fetch Existing Connections
    const { data: existingConnections } = await (supabase as any)
        .from('connections')
        .select('*')
        .eq('source_note_id', noteId)

    const existingMap = new Map((existingConnections as any[])?.map((c: any) => [c.target_note_id, c]) || [])
    const foundTargetIds = new Set<string>()
    let validLinksCount = 0
    const newConnections: ConnectionInsert[] = []

    // 2. Identify Targets from Content
    for (const link of links) {
        // Find target note by title
        let { data: targetNote } = await (supabase as any)
            .from('notes')
            .select('id, user_id, is_public, title')
            .eq('title', link.title)
            .maybeSingle() // Use maybeSingle to avoid error if not found

        // LAZY CREATION: If note not found, check if it's a known System Source (Text)
        if (!targetNote) {
            const { data: textData } = await (supabase as any)
                .from('texts')
                .select('*')
                .eq('title', link.title)
                .eq('status', 'approved')
                .maybeSingle()

            if (textData) {
                // Create the Source Note on the fly!
                const { data: newSource, error: createError } = await (supabase as any)
                    .from('notes')
                    .insert({
                        title: textData.title,
                        content: textData.description || `by ${textData.author}`,
                        type: 'source',
                        user_id: 'system', // System owned
                        is_public: true,
                        created_at: textData.created_at, // Preserve original date or now? 
                        // actually created_at defaults to now, which is fine for "Note creation", 
                        // but let's stick to defaults.
                    })
                    .select('id, user_id, is_public, title') // Select matching fields
                    .single()

                if (newSource && !createError) {
                    targetNote = newSource
                    // Also add tags?
                    await (supabase as any).from('note_tags').insert([
                        { note_id: newSource.id, user_id: 'system', tag: 'system-source' },
                        { note_id: newSource.id, user_id: 'system', tag: textData.type }
                    ])
                }
            }
        }

        if (targetNote && targetNote.id !== noteId) {
            // Check permissions: Own note OR Public note
            const isOwn = targetNote.user_id === userId
            if (isOwn || targetNote.is_public) {
                const context = extractContext(content, link.index!, link.fullMatch.length)
                foundTargetIds.add(targetNote.id)
                validLinksCount++

                if (existingMap.has(targetNote.id)) {
                    // UPDATE existing: Check if context changed? 
                    // For now, let's always update context to keep it fresh
                    const validationId = existingMap.get(targetNote.id)!.id
                    await (supabase as any)
                        .from('connections')
                        .update({ context })
                        .eq('id', validationId)
                } else {
                    // NEW connection
                    newConnections.push({
                        source_note_id: noteId,
                        target_note_id: targetNote.id,
                        user_id: userId,
                        context: context
                    })
                }
            }
        }
    }

    // 3. Process New Connections
    if (newConnections.length > 0) {
        const { error } = await (supabase as any).from('connections').insert(newConnections)

        if (!error) {
            // Trigger Notifications for NEW connections
            // ONLY if the source note is public (or if we trust the caller to have handled it? No, check DB/Context)
            // We need to fetch source note's public status if we don't pass it.
            const { data: sourceNote } = await (supabase as any)
                .from('notes')
                .select('is_public, user_id') // we already have user_id passed in but good to confirm ? No, rely on args.
                .eq('id', noteId)
                .single()

            // If note is private, DO NOT notify target. (They will be notified when promoted)
            if (!sourceNote?.is_public) return validLinksCount

            // We need the author's name for the notification
            const { data: author } = await (supabase as any)
                .from('users')
                .select('codex_name')
                .eq('id', userId)
                .single()

            const authorName = author?.codex_name || 'Someone'

            for (const conn of newConnections) {
                // Fetch target note details to get owner (we could have cached this above, but cleaner here for now)
                const { data: targetNote } = await (supabase as any)
                    .from('notes')
                    .select('user_id, title')
                    .eq('id', conn.target_note_id)
                    .single()

                if (targetNote && targetNote.user_id !== userId) {
                    await createNotification({
                        user_id: targetNote.user_id,
                        type: 'citation',
                        title: 'New Citation',
                        message: `${authorName} linked to your note "${targetNote.title}".`,
                        link: `/my-notes?noteId=${noteId}` // Link to the SOURCE note so they can see the context
                    })
                }
            }
        } else {
            console.error("Error inserting connections:", error)
        }
    }

    // 4. Remove Stale Connections
    // Any existing connection NOT in foundTargetIds should be deleted
    const toDeleteIds: string[] = []
    existingMap.forEach((conn, targetId) => {
        if (!foundTargetIds.has(targetId)) {
            toDeleteIds.push(conn.id)
        }
    })

    if (toDeleteIds.length > 0) {
        await (supabase as any)
            .from('connections')
            .delete()
            .in('id', toDeleteIds)
    }

    return validLinksCount
}

export async function fetchNodeConnections(noteId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch Incoming (Backlinks)
    // We want connections where target_note_id === noteId
    // AND source_note is (Public OR Mine)
    const { data: incoming } = await (supabase as any)
        .from('connections')
        .select(`
            id,
            context,
            source_note:source_note_id (
                id, title, type, is_public, user_id, content, created_at, updated_at, citation
            )
        `)
        .eq('target_note_id', noteId)

    // 2. Fetch Outgoing
    // We want connections where source_note_id === noteId
    // AND target_note is (Public OR Mine)
    const { data: outgoing } = await (supabase as any)
        .from('connections')
        .select(`
            id,
            context,
            target_note:target_note_id (
                id, title, type, is_public, user_id, content, created_at, updated_at, citation
            )
        `)
        .eq('source_note_id', noteId)

    // 3. Filter Visibility
    const userId = user?.id

    const validIncoming = incoming?.filter((c: any) => {
        const note = c.source_note
        if (!note) return false
        return note.is_public || note.user_id === userId
    }) || []

    const validOutgoing = outgoing?.filter((c: any) => {
        const note = c.target_note
        if (!note) return false
        return note.is_public || note.user_id === userId
    }) || []

    return { incoming: validIncoming, outgoing: validOutgoing }
}
