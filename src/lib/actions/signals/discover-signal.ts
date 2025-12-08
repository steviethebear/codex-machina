'use server'

import { createClient } from '@/lib/supabase/server'
import { awardXp } from '@/lib/actions/award-xp'
import { revalidatePath } from 'next/cache'

export async function discoverSignal(userId: string, signalId: string) {
    const supabase = await createClient()

    try {
        // 1. Check if already discovered
        const { data: existing } = await supabase
            .from('user_signals')
            .select('status')
            .eq('user_id', userId)
            .eq('signal_id', signalId)
            .single()

        if (existing && existing.status !== 'hidden') {
            return { success: false, message: 'Signal already discovered' }
        }

        // 2. Create or update user_signal record
        const { error } = await supabase
            .from('user_signals')
            .upsert({
                user_id: userId,
                signal_id: signalId,
                status: 'available',
                discovered_at: new Date().toISOString()
            }, { onConflict: 'user_id, signal_id' })

        if (error) throw error

        // 3. Award discovery XP (small bonus)
        // Award discovery bonus
        await awardXp(userId, {
            type: 'discovery',
            xp: 10,
            sp: { engagement: 5 }
        }, signalId)

        revalidatePath('/notebook')

        return {
            success: true,
            message: 'New Signal Discovered!',
            oracleMessage: "🔮 The threads of fate reveal a new path..."
        }

    } catch (error) {
        console.error('Error discovering signal:', error)
        return { success: false, message: 'Failed to discover signal' }
    }
}
