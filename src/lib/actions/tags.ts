'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAdminTagTrends() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Verify Admin
    const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!userData?.is_admin) return []

    const { data, error } = await supabase.rpc('get_global_tag_trends')
    if (error) {
        console.error('Error fetching tag trends:', error)
        return []
    }

    return data
}

export async function addTag(noteId: string, tag: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Constraint Check: Can only tag your own notes (v0.6)
    const { data: note } = await supabase
        .from('notes')
        .select('user_id')
        .eq('id', noteId)
        .single()

    if (!note || note.user_id !== user.id) {
        return { error: 'For now, you can only tag your own notes.' }
    }

    // Check if tag alrady exists for this user/note pair
    const { error } = await supabase
        .from('note_tags')
        .insert({
            note_id: noteId,
            user_id: user.id,
            tag: tag.trim()
        })
        .select()

    if (error && error.code !== '23505') { // Ignore unique violation
        console.error('Error adding tag:', error)
        return { error: 'Failed to add tag' }
    }

    revalidatePath('/my-notes')
    revalidatePath(`/note/${noteId}`) // Assuming we have a note view
    return { success: true }
}

export async function removeTag(noteId: string, tag: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Users can remove their OWN tags.
    // What if I want to remove a tag I added to someone else's note? Yes, that's what this does.
    const { error } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .eq('tag', tag)

    if (error) {
        console.error('Error removing tag:', error)
        return { error: 'Failed to remove tag' }
    }

    revalidatePath('/my-notes')
    return { success: true }
}

export async function getNoteTags(noteId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user is admin (teacher)
    let isAdmin = false
    if (user) {
        const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single()
        isAdmin = !!userData?.is_admin
    }

    const { data, error } = await supabase
        .from('note_tags')
        .select(`
            tag,
            user_id,
            users ( email, codex_name )
        `)
        .eq('note_id', noteId)
    // Order by creation? Or by most common?

    if (error) {
        console.error('Error getting tags:', error)
        return []
    }

    // Return a structured list
    return data.map((t: any) => ({
        tag: t.tag,
        // Only show attribution to admins
        userId: isAdmin ? t.user_id : undefined,
        userName: isAdmin ? (t.users?.codex_name || t.users?.email || 'Unknown') : undefined
    }))
}

// Search
export async function searchNotesByTag(tag: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { notes: [] }

    // Find notes that have this tag.
    // Join note_tags -> notes
    // We only want notes visible to the user (own notes OR public notes)
    // Actually, RLS on 'notes' handles visibility.

    // 1. Get Note IDs with this tag
    const { data: tagData } = await supabase
        .from('note_tags')
        .select('note_id')
        .ilike('tag', tag) // Case insensitive-ish

    if (!tagData || tagData.length === 0) return { notes: [] }

    const noteIds = tagData.map(t => t.note_id)

    // 2. Fetch the notes
    const { data: notes } = await supabase
        .from('notes')
        .select('id, title, updated_at, type, user_id')
        .in('id', noteIds)
        .order('updated_at', { ascending: false })

    return { notes: notes || [] }
}
