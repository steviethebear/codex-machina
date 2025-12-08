'use server'

import { createClient } from '@/lib/supabase/server'
import { awardXp } from '@/lib/actions/award-xp'
import { revalidatePath } from 'next/cache'

export async function resolveQuestion(userId: string, questionId: string, atomId?: string) {
    const supabase = await createClient()

    try {
        // 1. Verify ownership
        const { data: question } = await supabase
            .from('questions')
            .select('author_id')
            .eq('id', questionId)
            .single()

        if (!question || question.author_id !== userId) {
            return { success: false, message: 'Unauthorized' }
        }

        // 2. Update question status
        const { error } = await supabase
            .from('questions')
            .update({
                is_resolved: true,
                resolved_at: new Date().toISOString(),
                accepted_atom_id: atomId
            })
            .eq('id', questionId)

        if (error) throw error

        // 3. If atomId provided (accepted answer), award bonus to atom author
        if (atomId) {
            // Award bonus to the author of the accepted answer
            if (atomId) {
                // Fetch the atom to get the author
                const { data: atom } = await supabase
                    .from('atomic_notes')
                    .select('author_id')
                    .eq('id', atomId)
                    .single()

                if (atom && atom.author_id) {
                    await awardXp(atom.author_id, {
                        type: 'scholar',
                        xp: 50,
                        sp: { thinking: 10, writing: 10 }
                    }, questionId)
                }
            }
        }

        revalidatePath('/notebook')

        return {
            success: true,
            message: 'Question resolved',
            oracleMessage: "🔮 Knowledge shared is knowledge multiplied."
        }

    } catch (error) {
        console.error('Error resolving question:', error)
        return { success: false, message: 'Failed to resolve question' }
    }
}
