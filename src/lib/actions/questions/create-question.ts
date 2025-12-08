'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/llm/generate-embeddings'
import { revalidatePath } from 'next/cache'

interface CreateQuestionParams {
    title: string
    body: string
    textId?: string
    unitId?: string
    tags?: string[]
}

export async function createQuestion(userId: string, params: CreateQuestionParams) {
    const supabase = await createClient()

    try {
        // 1. Generate embedding for the question
        console.log('[Create Question] Generating embedding...')
        const embedding = await generateEmbedding(`${params.title}\n${params.body}`)

        if (!embedding) {
            console.error('[Create Question] Failed to generate embedding')
            return { success: false, message: 'Failed to generate embedding for question' }
        }
        console.log(`[Create Question] Generated embedding with ${embedding.length} dimensions`)

        // 2. Get user's active character
        console.log('[Create Question] Fetching character...')
        const { data: character, error: charError } = await supabase
            .from('characters')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (charError) {
            console.error('[Create Question] Character fetch error:', charError)
            return { success: false, message: 'Failed to fetch character: ' + charError.message }
        }

        if (!character) {
            console.error('[Create Question] No character found for user:', userId)
            return { success: false, message: 'No active character found' }
        }
        console.log('[Create Question] Found character:', character.id)

        // 3. Insert question
        console.log('[Create Question] Inserting question...')
        const { data: question, error } = await supabase
            .from('questions')
            .insert({
                author_id: userId,
                character_id: character.id,
                title: params.title,
                body: params.body,
                text_id: params.textId,
                unit_id: params.unitId,
                tags: params.tags || [],
                embedding: embedding as any,
                moderation_status: 'approved' // Auto-approve for now, or 'pending' if using moderation
            })
            .select()
            .single()

        if (error) {
            console.error('[Create Question] Insert error:', JSON.stringify(error, null, 2))
            throw error
        }

        console.log('[Create Question] Successfully created question:', question.id)

        revalidatePath('/notebook')
        revalidatePath('/graph')

        // 4. Award XP/SP
        // Import dynamically to avoid circular deps if any, or just import at top
        const { awardXp } = await import('@/lib/actions/award-xp')
        await awardXp(userId, {
            type: 'scholar',
            xp: 10,
            sp: { thinking: 1 },
            metadata: { question_id: question.id }
        }, question.id)

        return {
            success: true,
            message: 'Question posted successfully',
            question: question,
            oracleMessage: "🔮 A thoughtful inquiry. Let's see what others think."
        }

    } catch (error: any) {
        console.error('[Create Question] Unexpected error:', error)
        return {
            success: false,
            message: error?.message || 'Failed to create question',
            error: error
        }
    }
}
