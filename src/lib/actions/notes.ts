'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['notes']['Row']
type NoteInsert = Database['public']['Tables']['notes']['Insert']
type NoteUpdate = Database['public']['Tables']['notes']['Update']

export async function createNote(note: NoteInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('notes')
        .insert(note)
        .select()
        .single()

    if (error) {
        console.error('Error creating note:', error)
        return { error: error.message }
    }

    // Award points logic will be handled separately or via triggers/hooks
    // For v0.5 MVP, we might call a separate action here or relying on the client to trigger it.
    // The plan said "1 point awarded on creation" for fleeting.
    // We can add simple point logic here or in a separate specific function.
    // Let's keep it simple for now and revalidate.

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph')
    return { data }
}

export async function updateNote(id: string, updates: NoteUpdate) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating note:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    return { data }
}

export async function deleteNote(id: string) {
    const supabase = await createClient()

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
    return { success: true }
}

export async function getNotes(filters?: {
    userId?: string,
    type?: Note['type'],
    isPublic?: boolean
}) {
    const supabase = await createClient()

    let query = supabase
        .from('notes')
        .select(`
      *,
      user:users!user_id(codex_name)
    `)
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
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('notes')
        .select(`
      *,
      user:users!user_id(codex_name)
    `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching note:', error)
        return { error: error.message }
    }

    return { data }
}
