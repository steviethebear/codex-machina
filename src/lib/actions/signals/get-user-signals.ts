'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type UserSignal = Database['public']['Tables']['user_signals']['Row']

export async function getUserSignals(userId: string): Promise<UserSignal[]> {
    const supabase = await createClient()

    const { data: userSignals, error } = await supabase
        .from('user_signals')
        .select('*')
        .eq('user_id', userId)

    if (error) {
        console.error('Error fetching user signals:', error)
        return []
    }

    return userSignals
}
