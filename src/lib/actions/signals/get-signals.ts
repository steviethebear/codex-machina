'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type Signal = Database['public']['Tables']['signals']['Row']
type UserSignal = Database['public']['Tables']['user_signals']['Row']

export type SignalWithStatus = Signal & {
    user_status: UserSignal['status'] | 'locked'
    user_signal_id?: string
    user_signal?: UserSignal
}

export async function getSignals(userId: string): Promise<SignalWithStatus[]> {
    const supabase = await createClient()

    // 1. Fetch all active signals
    const { data: signals, error: signalsError } = await supabase
        .from('signals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (signalsError) {
        console.error('Error fetching signals:', signalsError)
        return []
    }

    // 2. Fetch user's progress on these signals
    const { data: userSignals, error: userSignalsError } = await supabase
        .from('user_signals')
        .select('*')
        .eq('user_id', userId)

    if (userSignalsError) {
        console.error('Error fetching user signals:', userSignalsError)
        return []
    }

    // 3. Merge data
    const userSignalsMap = new Map(userSignals?.map((us: UserSignal) => [us.signal_id, us]))

    return signals.map((signal: Signal) => {
        const userSignal = userSignalsMap.get(signal.id)

        // Determine status
        // If no user_signal record exists, it's either 'locked' (hidden) or 'available' (if discovery_type is admin_release)
        // For now, we'll assume admin_release signals are available by default if not tracked
        let status: SignalWithStatus['user_status'] = 'locked'

        if (userSignal) {
            status = userSignal.status
        } else if (signal.discovery_type === 'admin_release') {
            status = 'available'
        }

        return {
            ...signal,
            user_status: status,
            user_signal_id: userSignal?.id,
            user_signal: userSignal
        }
    })
}
