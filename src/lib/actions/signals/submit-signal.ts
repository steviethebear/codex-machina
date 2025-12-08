'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitSignal(userId: string, signalId: string, submission: any) {
    const supabase = await createClient()

    try {
        // 1. Get signal details for rewards
        const { data: signal } = await supabase
            .from('signals')
            .select('xp_reward, sp_thinking, sp_reading, sp_writing, sp_engagement')
            .eq('id', signalId)
            .single()

        if (!signal) throw new Error('Signal not found')

        // 2. Update user_signal status to 'completed' (Auto-approve for MVP)
        const { error } = await supabase
            .from('user_signals')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                submission: submission
            })
            .eq('user_id', userId)
            .eq('signal_id', signalId)

        if (error) throw error

        // 3. Award XP/SP
        const { awardXp } = await import('@/lib/actions/award-xp')
        await awardXp(userId, {
            type: 'solution', // Or 'signal_completion'
            xp: signal.xp_reward || 0,
            sp: {
                thinking: signal.sp_thinking || 0,
                reading: signal.sp_reading || 0,
                writing: signal.sp_writing || 0,
                engagement: signal.sp_engagement || 0
            },
            metadata: { signal_id: signalId }
        }, signalId)

        revalidatePath('/notebook')

        return {
            success: true,
            message: 'Signal Completed',
            oracleMessage: "🔮 Knowledge assimilated. The pattern strengthens."
        }

    } catch (error: any) {
        console.error('Error submitting signal:', error)
        return { success: false, message: 'Failed to submit signal' }
    }
}
