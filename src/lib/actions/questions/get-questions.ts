'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type Question = Database['public']['Tables']['questions']['Row']

export type QuestionWithAuthor = Question & {
    author: { codex_name: string | null } | null
    texts: { title: string | null } | null
}

export async function getQuestions(userId: string): Promise<QuestionWithAuthor[]> {
    const supabase = await createClient()

    const { data: questions, error } = await supabase
        .from('questions')
        .select(`
      *,
      author:users!author_id(codex_name),
      texts(title)
    `)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching questions:', error)
        throw error
    }

    return (questions as unknown) as QuestionWithAuthor[]
}
