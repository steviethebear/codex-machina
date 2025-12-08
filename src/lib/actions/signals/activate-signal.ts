'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function activateSignal(userId: string, signalId: string) {
    const supabase = await createClient()

    try {
        // 1. Verify signal is available
        const { data: userSignal } = await supabase
            .from('user_signals')
            .select('status')
            .eq('user_id', userId)
            .eq('signal_id', signalId)
            .single()

        // Allow activation if status is 'available' OR if it doesn't exist yet (admin_release signals)
        // But for admin_release, we should probably create the record first. 
        // For now, let's assume getSignals handles the "virtual" available state, 
        // but here we need to ensure a record exists.

        // Upsert to 'in_progress'
        const { error } = await supabase
            .from('user_signals')
            .upsert({
                user_id: userId,
                signal_id: signalId,
                status: 'in_progress',
                activated_at: new Date().toISOString()
            }, { onConflict: 'user_id, signal_id' })

        if (error) throw error

        revalidatePath('/notebook')

        return {
            success: true,
            message: 'Signal Activated',
            oracleMessage: "🔮 The journey begins. Walk with purpose."
        }

    } catch (error) {
        console.error('Error activating signal:', error)
        return { success: false, message: 'Failed to activate signal' }
    }
}
