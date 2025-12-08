'use server'

import { createClient } from '@/lib/supabase/server'

export type BonusType = 'trailblazer' | 'scholar' | 'bridge_builder' | 'streak' | 'combo' | 'hub_formation' | 'discovery' | 'solution'

export type BonusReward = {
    type: BonusType
    xp: number
    sp: {
        reading?: number
        thinking?: number
        writing?: number
        engagement?: number
    }
    metadata?: Record<string, any>
}

export async function awardXp(
    userId: string,
    bonus: BonusReward,
    triggerId?: string
) {
    const supabase = await createClient()

    try {
        // 1. Record the bonus
        const { error: bonusError } = await supabase.from('bonus_rewards').insert({
            user_id: userId,
            bonus_type: bonus.type,
            trigger_id: triggerId,
            xp_awarded: bonus.xp,
            sp_awarded: bonus.sp,
            metadata: bonus.metadata || {}
        } as any)

        if (bonusError) throw bonusError

        // 2. Create action record
        const { error: actionError } = await supabase.from('actions').insert({
            user_id: userId,
            type: `bonus_${bonus.type}`,
            xp: bonus.xp,
            sp_reading: bonus.sp.reading || 0,
            sp_thinking: bonus.sp.thinking || 0,
            sp_writing: bonus.sp.writing || 0,
            sp_engagement: bonus.sp.engagement || 0,
            description: `Awarded ${bonus.type.replace('_', ' ')} bonus`,
            target_id: triggerId,
            bonus_type: bonus.type
        } as any)

        if (actionError) throw actionError

        // 3. Update character stats (RPC call is safest for atomic increments)
        // Assuming there's an RPC function or we do it manually. 
        // For now, let's try to do it manually if no RPC exists, or just rely on triggers if they exist.
        // Checking migrations... there might be triggers. 
        // If not, we should update the character table.

        // Let's check if we can just update the character directly.
        // First get the character ID for the user
        const { data: character } = await supabase
            .from('characters')
            .select('id, xp_total, sp_reading, sp_thinking, sp_writing, sp_engagement')
            .eq('user_id', userId)
            .single()

        if (character) {
            await supabase.from('characters').update({
                xp_total: (character.xp_total ?? 0) + bonus.xp,
                sp_reading: (character.sp_reading ?? 0) + (bonus.sp.reading ?? 0),
                sp_thinking: (character.sp_thinking ?? 0) + (bonus.sp.thinking ?? 0),
                sp_writing: (character.sp_writing ?? 0) + (bonus.sp.writing ?? 0),
                sp_engagement: (character.sp_engagement ?? 0) + (bonus.sp.engagement ?? 0)
            }).eq('id', character.id)
        }

        return { success: true }
    } catch (error) {
        console.error('Error awarding XP:', error)
        return { success: false, error }
    }
}
