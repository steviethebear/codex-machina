'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createComment(noteId: string, content: string, highlightedText?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await (supabase as any)
        .from('comments')
        .insert({
            note_id: noteId,
            user_id: user.id,
            content,
            highlighted_text: highlightedText
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating comment:', error)
        return { error: error.message }
    }

    // Award point? "Margin comment: 1 point"

    revalidatePath(`/notes/${noteId}`)
    return { data }
}

export async function getComments(noteId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('comments')
        .select(`
            *,
            user:users!user_id(codex_name, email)
        `)
        .eq('note_id', noteId)
        .order('created_at', { ascending: true })

    if (error) {
        return { error: error.message }
    }

    return { data }
}

export async function forkNote(originalNoteId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Fetch original note
    const { data: original, error: fetchError } = await (supabase as any)
        .from('notes')
        .select('*')
        .eq('id', originalNoteId)
        .single()

    if (fetchError || !original) return { error: 'Original note not found' }

    // 2. Create copy
    // "Forked note is read-only" - actually usually users edit forks, but spec says "Read-only copy".
    // "Always displays original author"
    // We can add "Source: Forked from X" in content or metadata.
    // Spec says: "Student can create connections from forked note..."
    // If it's read-only, they can't change content.

    const { data: newNote, error: createError } = await (supabase as any)
        .from('notes')
        .insert({
            user_id: user.id,
            title: original.title + ' (Fork)',
            content: original.content, // Copy content
            type: original.type, // Same type? usually permanent
            is_public: false, // Private initially? Spec says "into their own collection". Let's say private.
            // We might need a metadata field for "forked_from" if we want to enforce read-only or attribution strictly.
            // For MVP, just copying.
            citation: original.citation,
            page_number: original.page_number
        })
        .select()
        .single()

    if (createError) return { error: createError.message }

    revalidatePath('/my-notes')
    revalidatePath('/dashboard')

    return { data: newNote }
}

export async function getFeed() {
    const supabase = await createClient()

    // Fetch recent 20 public notes
    const { data: notes } = await (supabase as any)
        .from('notes')
        .select(`
            *,
            user:users!user_id(codex_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20)

    // Fetch recent 20 connections
    const { data: connections } = await (supabase as any)
        .from('connections')
        .select(`
            *,
            user:users!user_id(codex_name),
            source_note:notes!source_note_id(title),
            target_note:notes!target_note_id(title)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

    // Merge and sort
    const feedItems = [
        ...(notes || []).map((n: any) => ({ ...n, feedType: 'note' })),
        ...(connections || []).map((c: any) => ({ ...c, feedType: 'connection' }))
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { data: feedItems }
}
