'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Threads Server Actions
 * 
 * Threads are weaving spaces where students arrange permanent notes
 * to explore structure, tension, and possible directions for writing.
 */

export interface Thread {
    id: string
    user_id: string
    title: string
    description: string | null
    created_at: string | null
    updated_at: string | null
}

export interface ThreadNote {
    id: string
    thread_id: string
    note_id: string
    position: number
    group_label: string | null
    created_at: string
}

export interface ThreadWithNotes extends Thread {
    notes: (ThreadNote & { note: any, x: number, y: number })[]
    connections?: any[]
}

/**
 * Create a new thread
 */
export async function createThread(title: string, description?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('threads')
        .insert({
            user_id: user.id,
            title,
            description: description || null
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/threads')
    return { data }
}

/**
 * Get all threads for current user
 */
export async function getThreads() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    if (error) return { error: error.message }
    return { data }
}

/**
 * Get single thread with all notes
 */
export async function getThread(threadId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Get thread
    const { data: thread, error: threadError } = await supabase
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single()

    if (threadError) return { error: threadError.message }

    // Get thread notes with note content and author
    const { data: threadNotes, error: notesError } = await supabase
        .from('thread_notes')
        .select(`
            *,
            note:notes(
                *,
                author:users(codex_name, email)
            )
        `)
        .eq('thread_id', threadId)

    if (notesError) return { error: notesError.message }

    // Get thread connections
    const { data: connections, error: connectionsError } = await supabase
        .from('thread_connections')
        .select('*')
        .eq('thread_id', threadId)

    if (connectionsError) return { error: connectionsError.message }

    const notesWithAuthor = threadNotes?.map((tn: any) => ({
        ...tn,
        note: {
            ...tn.note,
            author_name: tn.note?.author?.codex_name || tn.note?.author?.email || 'Unknown'
        }
    }))

    return {
        data: {
            ...thread,
            notes: notesWithAuthor || [],
            connections: connections || []
        }
    }
}

/**
 * Update thread metadata
 */
export async function updateThread(threadId: string, updates: { title?: string, description?: string }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('threads')
        .update(updates)
        .eq('id', threadId)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/threads')
    revalidatePath(`/threads/${threadId}`)
    return { data }
}

/**
 * Delete thread
 */
export async function deleteThread(threadId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', threadId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/threads')
    return { success: true }
}

/**
 * Add note to thread
 */
export async function addNoteToThread(
    threadId: string,
    noteId: string,
    position: number,
    groupLabel?: string
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Verify thread ownership
    const { data: thread } = await supabase
        .from('threads')
        .select('user_id')
        .eq('id', threadId)
        .single()

    if (!thread || thread.user_id !== user.id) {
        return { error: 'Unauthorized' }
    }

    // Default position 0,0 if not specified (could randomize slightly)
    const { data, error } = await supabase
        .from('thread_notes')
        .insert({
            thread_id: threadId,
            note_id: noteId,
            position, // Legacy, can keep or repurpose
            x: 100 + Math.random() * 50,
            y: 100 + Math.random() * 50,
            group_label: groupLabel || null
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath(`/threads/${threadId}`)
    return { data }
}

/**
 * Remove note from thread
 */
export async function removeNoteFromThread(threadId: string, noteId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('thread_notes')
        .delete()
        .eq('thread_id', threadId)
        .eq('note_id', noteId)

    if (error) return { error: error.message }

    revalidatePath(`/threads/${threadId}`)
    return { success: true }
}

/**
 * Update note position (Spatial)
 */
export async function updateNotePosition(
    threadId: string,
    noteId: string,
    x: number,
    y: number
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('thread_notes')
        .update({ x, y })
        .eq('thread_id', threadId)
        .eq('note_id', noteId)

    if (error) return { error: error.message }
    revalidatePath(`/threads/${threadId}`)
    return { success: true }
}

/**
 * Create connection between notes
 */
export async function createThreadConnection(
    threadId: string,
    sourceNoteId: string,
    targetNoteId: string,
    label?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('thread_connections')
        .insert({
            thread_id: threadId,
            source_note_id: sourceNoteId,
            target_note_id: targetNoteId,
            label
        })
        .select()
        .single()

    if (error) return { error: error.message }
    revalidatePath(`/threads/${threadId}`)
    return { data }
}

/**
 * Delete connection
 */
export async function deleteThreadConnection(connectionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Get thread_id before deleting for revalidation
    const { data: connection } = await supabase
        .from('thread_connections')
        .select('thread_id')
        .eq('id', connectionId)
        .single()

    const { error } = await supabase
        .from('thread_connections')
        .delete()
        .eq('id', connectionId)

    if (error) return { error: error.message }

    if (connection) {
        revalidatePath(`/threads/${connection.thread_id}`)
    }
    return { success: true }
}

/**
 * Update connection label
 */
export async function updateConnectionLabel(connectionId: string, label: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('thread_connections')
        .update({ label })
        .eq('id', connectionId)

    if (error) return { error: error.message }
    return { success: true }
}

/**
 * Bulk reorder thread notes (Legacy / List view support if needed)
 */
export async function reorderThreadNotes(
    threadId: string,
    noteUpdates: { note_id: string, position: number, group_label?: string | null }[]
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Verify thread ownership
    const { data: thread } = await supabase
        .from('threads')
        .select('user_id')
        .eq('id', threadId)
        .single()

    if (!thread || thread.user_id !== user.id) {
        return { error: 'Unauthorized' }
    }

    // Update each note position
    for (const update of noteUpdates) {
        await supabase
            .from('thread_notes')
            .update({
                position: update.position,
                group_label: update.group_label
            })
            .eq('thread_id', threadId)
            .eq('note_id', update.note_id)
    }

    revalidatePath(`/threads/${threadId}`)
    return { success: true }
}

/**
 * Update group label for a note in a thread
 */
export async function updateNoteGroupLabel(
    threadId: string,
    noteId: string,
    groupLabel: string | null
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('thread_notes')
        .update({ group_label: groupLabel })
        .eq('thread_id', threadId)
        .eq('note_id', noteId)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath(`/threads/${threadId}`)
    return { data }
}

/**
 * Export thread as Markdown
 */
export async function exportThreadAsMarkdown(threadId: string): Promise<{ data?: string, error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Get thread with notes
    const result = await getThread(threadId)
    if (result.error || !result.data) {
        return { error: result.error || 'Thread not found' }
    }

    const thread = result.data

    // Build markdown
    let markdown = `# ${thread.title}\n\n`

    if (thread.description) {
        markdown += `${thread.description}\n\n---\n\n`
    }

    // Group notes by group_label
    const notesByGroup = new Map<string, any[]>()
    const ungroupedNotes: any[] = []

    for (const tn of thread.notes) {
        if (tn.group_label) {
            if (!notesByGroup.has(tn.group_label)) {
                notesByGroup.set(tn.group_label, [])
            }
            notesByGroup.get(tn.group_label)!.push(tn)
        } else {
            ungroupedNotes.push(tn)
        }
    }

    // Output grouped notes
    for (const [label, notes] of notesByGroup) {
        markdown += `## ${label}\n\n`

        for (const tn of notes) {
            markdown += `### [[${tn.note.title}]]\n\n`
            markdown += `${tn.note.content}\n\n`
            markdown += `---\n\n`
        }
    }

    // Output ungrouped notes
    if (ungroupedNotes.length > 0) {
        if (notesByGroup.size > 0) {
            markdown += `## Notes\n\n`
        }

        for (const tn of ungroupedNotes) {
            markdown += `### [[${tn.note.title}]]\n\n`
            markdown += `${tn.note.content}\n\n`
            markdown += `---\n\n`
        }
    }

    return { data: markdown }
}
