'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['atomic_notes']['Row']

export type ReplyWithAuthor = Note & {
    author: { codex_name: string | null } | null
}

export async function getReplies(questionId: string): Promise<ReplyWithAuthor[]> {
    const supabase = await createClient()

    // 1. Get IDs of atoms linked as replies (Note -> Question)
    const { data: links } = await supabase
        .from('links')
        .select('from_note_id')
        .eq('to_question_id', questionId)
        .eq('relation_type', 'reply')

    if (!links || links.length === 0) return []

    const noteIds = links.map(l => l.from_note_id).filter(Boolean) as string[]

    if (noteIds.length === 0) return []

    // 2. Fetch the atoms with author info
    const { data: replies, error } = await supabase
        .from('atomic_notes')
        .select(`
      *,
      author:users!atomic_notes_author_id_fkey(codex_name)
    `)
        .in('id', noteIds)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching replies:', error)
        return []
    }

    return replies as ReplyWithAuthor[]
}
