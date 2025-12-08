'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type ConnectionInsert = Database['public']['Tables']['connections']['Insert']

export async function createConnection(connection: ConnectionInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('connections')
        .insert(connection)
        .select()
        .single()

    if (error) {
        console.error('Error creating connection:', error)
        return { error: error.message }
    }

    // Points for connection to be handled separately or via hook

    revalidatePath('/graph')
    revalidatePath('/dashboard')
    revalidatePath(`/notes/${connection.source_note_id}`)
    revalidatePath(`/notes/${connection.target_note_id}`)

    return { data }
}

export async function deleteConnection(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting connection:', error)
        return { error: error.message }
    }

    revalidatePath('/graph')
    return { success: true }
}

export async function getConnections(filters?: {
    userId?: string
    noteId?: string // connections involves this note as source OR target
}) {
    const supabase = await createClient()

    let query = supabase
        .from('connections')
        .select(`
      *,
      user:users!user_id(codex_name)
    `)

    if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
    }

    if (filters?.noteId) {
        query = query.or(`source_note_id.eq.${filters.noteId},target_note_id.eq.${filters.noteId}`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching connections:', error)
        return { error: error.message }
    }

    return { data }
}
