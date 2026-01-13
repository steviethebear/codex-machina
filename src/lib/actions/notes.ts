'use server'

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { evaluateNote } from './evaluation'
import { syncConnections } from './links'
import { awardPoints } from '@/lib/points'
import { checkAndUnlockAchievements } from '@/lib/achievements'
import { createNotification } from '@/lib/notifications'
import { updateNoteEmbedding } from '@/lib/ai/embeddings'
import { checkUnlocks } from '@/lib/actions/unlocks'

type Note = Database['public']['Tables']['notes']['Row']
type NoteInsert = Database['public']['Tables']['notes']['Insert']
type NoteUpdate = Database['public']['Tables']['notes']['Update']

// New Type for Extended Note with Tags
interface NoteWithTags extends Note {
    tags: string[]
}

export async function createNote(note: NoteInsert & { tags?: string[] }) {
    const supabase: any = await createClient()

    // Default to fleeting if not provided
    if (!note.type) note.type = 'fleeting'

    // Separate tags from note data
    const { tags, ...noteData } = note

    const { data, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single()

    if (error) {
        console.error('Error creating note:', error)
        return { error: error.message }
    }

    // Insert Tags if present
    if (tags && tags.length > 0) {
        const tagInserts = tags.map(tag => ({
            note_id: data.id,
            user_id: data.user_id,
            tag: tag.trim()
        }))
        const { error: tagError } = await supabase.from('note_tags').insert(tagInserts)
        if (tagError) console.error('Error adding initial tags:', tagError)
    }

    // Award 1 point for creating a fleeting note (Coherence check implied or just participation for now)
    if (data.type === 'fleeting') {
        await awardPoints(data.user_id, 1, 'created_fleeting_note', data.id)
    }

    // Sync connections if initial content is provided
    if (note.content) {
        await syncConnections(data.id, note.content, data.user_id)
        // Generate Embedding
        await updateNoteEmbedding(data.id)
    }

    // ... (after updateNoteEmbedding)

    // Fetch tags to return complete object
    const { data: noteTags } = await supabase
        .from('note_tags')
        .select('tag')
        .eq('note_id', data.id)

    // Check for unlocks (fire and forget, or await if critical)
    await checkUnlocks(data.user_id)

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph')

    return { data: { ...data, tags: noteTags?.map((t: any) => t.tag) || [] } }
}

export async function updateNote(id: string, updates: NoteUpdate & { tags?: string[] }) {
    const supabase: any = await createClient()

    // 1. Fetch current state to check type
    const { data: currentNote, error: fetchError } = await supabase
        .from('notes')
        .select('type')
        .eq('id', id)
        .single()

    if (fetchError || !currentNote) {
        return { error: 'Note not found' }
    }

    if (currentNote.type === 'permanent') {
        return { error: 'Permanent notes cannot be edited.' }
    }

    // Strip tags from updates to prevent legacy column write
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tags, ...safeUpdates } = updates

    const { data, error } = await supabase
        .from('notes')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating note:', error)
        return { error: error.message }
    }

    // Sync connections if content changed, regardless of note type (fleeting, permanent, source)
    if (updates.content) {
        await syncConnections(data.id, data.content, data.user_id)
        // Update Embedding
        await updateNoteEmbedding(data.id)
    }

    // Fetch tags to return complete object
    // We can assume tags haven't changed during this update since we handle them separately, 
    // BUT we need to return them so the UI doesn't lose them.
    const { data: noteTags } = await supabase
        .from('note_tags')
        .select('tag')
        .eq('note_id', data.id)

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph')
    return { data: { ...data, tags: noteTags?.map((t: any) => t.tag) || [] } }
}

export async function deleteNote(id: string) {
    const supabase: any = await createClient()

    // 1. Fetch current state to check type
    const { data: currentNote, error: fetchError } = await supabase
        .from('notes')
        .select('type')
        .eq('id', id)
        .single()

    if (fetchError || !currentNote) {
        return { error: 'Note not found' }
    }

    if (currentNote.type === 'permanent') {
        return { error: 'Permanent notes cannot be deleted.' }
    }

    // 2. Delete associated points (XP)
    // We do this before deleting the note, though order doesn't strictly matter since no FK constraint on points.source_id
    const { error: pointsError } = await supabase
        .from('points')
        .delete()
        .eq('source_id', id)

    if (pointsError) {
        console.error('Error deleting note points:', pointsError)
        // We continue to delete the note even if points fail, or maybe we should stop?
        // Continuing seems safer for UX, leaving orphan points is a minor backend issue.
    }

    // 3. Delete the note
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting note:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph') // Ensure graph updates too
    return { success: true }
}

export async function getUserTags(userId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If no userId provided, use current user
    const targetId = userId || user?.id
    if (!targetId) return []

    // Use RPC function
    const { data, error } = await supabase.rpc('get_user_tags', { p_user_id: targetId })

    if (error) {
        console.error('Error fetching user tags:', error)
        return []
    }

    // Return just the strings
    return data.map((d: any) => d.tag)
}

export async function getNotes(filters?: {
    userId?: string,
    type?: Note['type'],
    isPublic?: boolean
}) {
    const supabase: any = await createClient()

    let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

    if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
    }
    if (filters?.type) {
        query = query.eq('type', filters.type)
    }
    if (filters?.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching notes:', error)
        return { error: error.message }
    }

    return { data }
}

export async function getNote(id: string) {
    const supabase: any = await createClient()

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching note:', error)
        return { error: error.message }
    }

    return { data }
}

export async function promoteNote(id: string) {
    const supabase: any = await createClient()

    // 1. Fetch the note
    const { data: note, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !note) {
        return { error: 'Note not found' }
    }

    if (note.type === 'permanent') {
        return { error: 'Note is already permanent' }
    }

    if (!note.content || note.content.trim().length === 0) {
        return { error: 'Note content cannot be empty' }
    }

    // 2. Run AI Diagnostic (Form Check)
    const diagnosis = await evaluateNote(id)
    if ('error' in diagnosis) {
        return { error: diagnosis.error }
    }

    // 3. Block on Form Violations
    if (!diagnosis.isValid) {
        return {
            success: false,
            feedback: "Note could not be promoted due to form issues.",
            violations: diagnosis.violations
        }
    }

    // 4. Success - Update Note (Become Permanent)
    const { error: updateError } = await supabase
        .from('notes')
        .update({
            type: 'permanent',
            is_public: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (updateError) {
        return { error: updateError.message }
    }

    // 5. Sync Connections & Gather Telemetry Data
    // syncConnections returns validLinksCount (total outbound).
    // We want detailed telemetry: Self vs Peer links.
    await syncConnections(note.id, note.content, note.user_id)

    // Telemetry Calculation (Internal Logging)
    const { count: selfLinks } = await supabase.from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('source_note_id', id)
        .eq('user_id', note.user_id) // Links I made...
    // Wait, connections table has user_id = creator of link. 
    // To find "Self Link" (Target is MINE) vs "Peer Link" (Target is THEIRS), we need to check target note's owner.

    // Let's query connections with target note details
    const { data: outConnections } = await supabase
        .from('connections')
        .select(`
            target_note_id,
            notes!connections_target_note_id_fkey ( user_id )
        `)
        .eq('source_note_id', id)

    let telemetrySelfLinks = 0
    let telemetryPeerLinks = 0

    if (outConnections) {
        outConnections.forEach((c: any) => {
            if (c.notes?.user_id === note.user_id) telemetrySelfLinks++
            else telemetryPeerLinks++
        })
    }

    // Inbound Links (How many people link TO this note? - likely 0 for a new note, but maybe fleeting had links?)
    const { count: inboundLinks } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('target_note_id', id)

    // Time since creation (Minutes)
    const ageMinutes = Math.round((Date.now() - new Date(note.created_at).getTime()) / 1000 / 60)

    console.log(`[Telemetry] Promotion: NoteID=${id}, SelfLinks=${telemetrySelfLinks}, PeerLinks=${telemetryPeerLinks}, Inbound=${inboundLinks || 0}, AgeMinutes=${ageMinutes}`)

    // 6. Award Points (Deterministic Only)
    // Removed Quality Points.

    // Link Points (2pts per valid link)
    const totalLinks = telemetrySelfLinks + telemetryPeerLinks
    if (totalLinks > 0) {
        await awardPoints(note.user_id, totalLinks * 2, 'note_promotion_links', id)
    }

    // Check Unlocks
    await checkUnlocks(note.user_id)

    // 7. Award Mention Points (2 pts per mention to the TARGET)
    const mentionMatches = note.content.match(/@(\w+)/g) || []
    const uniqueMentions = [...new Set(mentionMatches.map((m: any) => m.slice(1)))] // remove @

    // Use Admin Client for Lookup to bypass RLS
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch author details for notification
    const { data: author } = await supabase
        .from('users')
        .select('codex_name')
        .eq('id', note.user_id)
        .single()

    for (const handle of uniqueMentions) {
        // Find user by handle (email prefix OR name prefix)
        const { data: targetUser } = await supabaseAdmin
            .from('users')
            .select('id, email, codex_name')
            .or(`email.ilike.${handle}@%,codex_name.ilike.${handle}%`)
            .maybeSingle()

        if (targetUser && targetUser.id !== note.user_id) {
            await awardPoints(targetUser.id, 2, 'mentioned_in_note', id)

            // Notify the mentioned user
            await createNotification({
                user_id: targetUser.id,
                type: 'mention',
                title: 'You were mentioned!',
                message: `${author?.codex_name || 'Someone'} mentioned you in "${note.title}".`,
                link: `/my-notes?noteId=${note.id}`
            })
        }
    }

    // 8. Check Achievements
    const newAchievements = await checkAndUnlockAchievements(note.user_id)

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph')

    return {
        success: true,
        feedback: "Promotion Successful",
        observations: diagnosis.observations,
        newAchievements
    }
}

export async function fetchClassFeed(filter: 'all' | 'teacher' | 'students' = 'all') {
    const supabase: any = await createClient()

    // 1. Fetch Notes
    let query = supabase
        .from('notes')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })

    if (filter === 'teacher') {
        query = query.eq('type', 'source')
    } else if (filter === 'students') {
        query = query.neq('type', 'source')
    }

    const { data: notes, error: notesError } = await query

    if (notesError) {
        console.error('Error fetching feed notes:', notesError)
        return { success: false, error: 'Failed to fetch feed' }
    }

    if (!notes || notes.length === 0) {
        return { success: true, data: [] }
    }

    // 2. Fetch Authors manually to report avoid FK issues
    const userIds = [...new Set(notes.map((n: any) => n.user_id))]

    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, codex_name')
        .in('id', userIds)

    if (usersError) {
        console.error('Error fetching feed authors:', usersError)
        // Return notes without author info if user fetch fails, or fail? 
        // Better to return notes with partial info than nothing.
    }

    // 3. Fetch Tags
    const noteIds = notes.map((n: any) => n.id)
    const { data: tagsData } = await supabase
        .from('note_tags')
        .select('note_id, tag')
        .in('note_id', noteIds)

    // 4. Merge Data
    const enrichedNotes = notes.map((note: any) => {
        const author = users?.find((u: any) => u.id === note.user_id)
        const noteTags = tagsData?.filter((t: any) => t.note_id === note.id).map((t: any) => t.tag) || []

        return {
            ...note,
            user: author || { email: 'Unknown', codex_name: 'Unknown' },
            tags: noteTags
        }
    })

    return { success: true, data: enrichedNotes }
}

export async function fetchPeers() {
    const supabase: any = await createClient()

    // 1. Fetch all public notes to identify users AND count notes
    const { data: notes } = await supabase
        .from('notes')
        .select('user_id')
        .eq('is_public', true)

    const uniqueUserIds = [...new Set(notes?.map((n: any) => n.user_id))]

    if (uniqueUserIds.length === 0) return { success: true, data: [] }

    // 2. Fetch Users
    const { data: users } = await supabase
        .from('users')
        .select('id, codex_name, email')
        .in('id', uniqueUserIds)

    // 3. Fetch Connection Counts (Aggregated)
    // We want to know how many connections each user has made.
    // Grouping in Supabase/SQL via RPC is efficient, but for MVP standard query:
    const { data: connections } = await supabase
        .from('connections')
        .select('user_id')
        .in('user_id', uniqueUserIds)

    // 4. Aggregate Stats
    const notesCountMap = new Map<string, number>()
    notes?.forEach((n: any) => {
        notesCountMap.set(n.user_id, (notesCountMap.get(n.user_id) || 0) + 1)
    })

    const connectionsCountMap = new Map<string, number>()
    connections?.forEach((c: any) => {
        connectionsCountMap.set(c.user_id, (connectionsCountMap.get(c.user_id) || 0) + 1)
    })

    const enrichedUsers = users?.map((u: any) => ({
        ...u,
        stats: {
            notes: notesCountMap.get(u.id) || 0,
            connections: connectionsCountMap.get(u.id) || 0
        }
    }))

    return { success: true, data: enrichedUsers }
}

export async function fetchSources() {
    const supabase: any = await createClient()

    // 1. Fetch User-created Sources
    const { data: sources } = await supabase
        .from('notes')
        .select('*')
        .eq('type', 'source')
        .eq('is_public', true) // Re-enforce? Sources should be public usually.
        .order('title', { ascending: true })

    // 2. Fetch System Sources (Texts)
    const { data: texts } = await supabase
        .from('texts')
        .select('*')
        .in('status', ['approved'])

    // 3. Map Texts to Note structure
    const mappedTexts = (texts || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        content: s.description || (s.author ? `by ${s.author}` : ''),
        type: 'source',
        user_id: 'system',
        created_at: s.created_at,
        updated_at: s.created_at,
        is_public: true,
        tags: ['system-source', s.type],
        citation: s.author,
        page_number: null,
        embedding: null,
        user: { codex_name: 'Library', email: 'system' }
    }))

    // 4. Merge and Sort
    const allSources = [...(sources || []), ...mappedTexts].sort((a, b) =>
        a.title.localeCompare(b.title)
    )

    return { success: true, data: allSources }
}
