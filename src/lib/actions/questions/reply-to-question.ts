'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/llm/generate-embeddings'
import { revalidatePath } from 'next/cache'

interface ReplyParams {
    questionId: string
    body: string
    title?: string // Optional, can default to "Re: [Question Title]"
}

export async function replyToQuestion(userId: string, params: ReplyParams) {
    const supabase = await createClient()

    try {
        // 1. Get question details
        const { data: question } = await supabase
            .from('questions')
            .select('title, text_id, unit_id')
            .eq('id', params.questionId)
            .single()

        if (!question) {
            return { success: false, message: 'Question not found' }
        }

        // 2. Get user's active character
        const { data: character } = await supabase
            .from('characters')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!character) {
            return { success: false, message: 'No active character found' }
        }

        // 3. Generate embedding for the reply atom
        const title = params.title || `Re: ${question.title}`
        const embedding = await generateEmbedding(`${title}\n${params.body}`)

        // 4. Create the Atom (Reply)
        const { data: atom, error: atomError } = await supabase
            .from('atomic_notes')
            .insert({
                author_id: userId,
                character_id: character.id,
                title: title,
                body: params.body,
                text_id: question.text_id, // Inherit context
                type: 'idea', // Or specific 'reply' type if we added it, but 'idea' works
                embedding: embedding as any,
                moderation_status: 'approved'
            })
            .select()
            .single()

        if (atomError) throw atomError

        // 5. Link Atom to Question
        const { error: linkError } = await supabase
            .from('links')
            .insert({
                created_by: userId,
                from_note_id: atom.id,        // The reply is the source
                to_question_id: params.questionId, // The question is the target
                relation_type: 'reply',
                explanation: 'Reply to question'
            })

        if (linkError) throw linkError

        // 6. Increment reply count
        await supabase.rpc('increment_question_views', { question_id: params.questionId }) // Reusing view count for now, or create increment_reply_count

        revalidatePath('/notebook')

        // 7. Award XP/SP
        const { awardXp } = await import('@/lib/actions/award-xp')
        await awardXp(userId, {
            type: 'bridge_builder',
            xp: 15,
            sp: { engagement: 1, thinking: 1 },
            metadata: { question_id: params.questionId, reply_id: atom.id }
        }, atom.id)

        return {
            success: true,
            message: 'Reply posted',
            atom: atom
        }

    } catch (error) {
        console.error('Error replying to question:', error)
        return { success: false, message: 'Failed to post reply' }
    }
}
