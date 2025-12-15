'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type ConnectionInsert = Database['public']['Tables']['connections']['Insert']

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
    let validLinksCount = 0

    // Get current connections to avoid duplicates or remove stale ones? 
    // v0.5 MVP: Just insert new ones, ignore conflicts. 
    // Ideally we should remove connections that are no longer in text.
    // For now, let's just Upsert/Insert existing ones found in text.
    // To handle deletions, we would need to delete all for this source and recreate.
    // "Delete all connections from this source" -> "Insert all found".

    // 1. Delete all existing connections for this note (to handle removals)
    //    Warning: This might lose 'created_at' if we care about history, but for graph current state it's fine.
    await supabase.from('connections').delete().eq('source_note_id', noteId)

    for (const link of links) {
        // Find target note
        // Attempt exact match on title
        const { data: targetNote } = await supabase
            .from('notes')
            .select('id, user_id, is_public')
            .eq('title', link.title)
            .single()

        if (targetNote && targetNote.id !== noteId) {
            // Can only link to Public notes (or own notes? Spec says "Permanent notes (own or classmates' - all public)")
            // If target is my own, I can link. If target is classmate, must be public.
            const isOwn = targetNote.user_id === userId
            if (isOwn || targetNote.is_public) {
                const context = extractContext(content, link.index!, link.fullMatch.length)

                const connection: ConnectionInsert = {
                    source_note_id: noteId,
                    target_note_id: targetNote.id,
                    user_id: userId,
                    context: context
                }

                const { error } = await supabase.from('connections').insert(connection)
                if (!error) {
                    validLinksCount++
                } else {
                    console.error("Error inserting connection:", error)
                }
            }
        }
    }

    return validLinksCount
}
