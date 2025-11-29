import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

export type BonusReward = {
    type: 'trailblazer' | 'scholar' | 'bridge_builder' | 'streak' | 'combo' | 'hub_formation'
    xp: number
    sp: {
        reading?: number
        thinking?: number
        writing?: number
        engagement?: number
    }
    metadata?: Record<string, any>
}

/**
 * Award a bonus and record it in the database
 */
export async function awardBonus(
    userId: string,
    bonus: BonusReward,
    triggerId?: string
): Promise<void> {
    const supabase = createClient()

    // Record the bonus
    await supabase.from('bonus_rewards').insert({
        user_id: userId,
        bonus_type: bonus.type,
        trigger_id: triggerId,
        xp_awarded: bonus.xp,
        sp_awarded: bonus.sp,
        metadata: bonus.metadata || {}
    })

    // Create action record for the bonus
    await supabase.from('actions').insert({
        user_id: userId,
        type: `bonus_${bonus.type}`,
        xp: bonus.xp,
        sp_reading: bonus.sp.reading || 0,
        sp_thinking: bonus.sp.thinking || 0,
        sp_writing: bonus.sp.writing || 0,
        sp_engagement: bonus.sp.engagement || 0,
        description: getBonusDescription(bonus),
        target_id: triggerId,
        bonus_type: bonus.type
    })

    // Update character stats
    const { data: character } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (character) {
        await supabase
            .from('characters')
            .update({
                xp_total: (character.xp_total || 0) + bonus.xp,
                sp_reading: (character.sp_reading || 0) + (bonus.sp.reading || 0),
                sp_thinking: (character.sp_thinking || 0) + (bonus.sp.thinking || 0),
                sp_writing: (character.sp_writing || 0) + (bonus.sp.writing || 0),
                sp_engagement: (character.sp_engagement || 0) + (bonus.sp.engagement || 0)
            })
            .eq('user_id', userId)
    }
}

/**
 * Apply streak multiplier to base rewards
 */
export function applyStreakMultiplier(
    baseRewards: { xp: number; sp: any },
    streakMultiplier: number
): { xp: number; sp: any } {
    return {
        xp: Math.floor(baseRewards.xp * streakMultiplier),
        sp: {
            reading: Math.floor((baseRewards.sp.reading || 0) * streakMultiplier),
            thinking: Math.floor((baseRewards.sp.thinking || 0) * streakMultiplier),
            writing: Math.floor((baseRewards.sp.writing || 0) * streakMultiplier),
            engagement: Math.floor((baseRewards.sp.engagement || 0) * streakMultiplier)
        }
    }
}

/**
 * Get user-friendly description for bonus
 */
function getBonusDescription(bonus: BonusReward): string {
    switch (bonus.type) {
        case 'trailblazer':
            return "🎯 Trailblazer! You've charted new territory in the knowledge graph."
        case 'scholar':
            return `📚 Scholar! Your rigorous citation (${bonus.metadata?.citations} quotes) strengthens the Codex.`
        case 'bridge_builder':
            return "🌉 Bridge Builder! You've connected distant ideas."
        case 'streak':
            return `🔥 Streak: Day ${bonus.metadata?.streak_count}! Your consistency fuels the Machine.`
        case 'combo':
            return `⚡ Quality Combo x${bonus.metadata?.combo_length}! The Machine recognizes your excellence.`
        default:
            return 'Bonus awarded!'
    }
}

/**
 * Get bonus message for toast notification
 */
export function getBonusMessage(bonus: BonusReward): {
    title: string
    description: string
    icon: string
} {
    const messages = {
        trailblazer: {
            title: '🎯 Trailblazer Bonus!',
            description: "You've charted new territory in the knowledge graph.",
            icon: '🎯'
        },
        scholar: {
            title: '📚 Scholar Bonus!',
            description: `Your rigorous citation (${bonus.metadata?.citations} quotes) strengthens the Codex.`,
            icon: '📚'
        },
        bridge_builder: {
            title: '🌉 Bridge Builder Bonus!',
            description: "You've connected distant ideas.",
            icon: '🌉'
        },
        streak: {
            title: `🔥 ${bonus.metadata?.streak_count}-Day Streak!`,
            description: 'Your consistency fuels the Machine.',
            icon: '🔥'
        },
        combo: {
            title: 'Combo Streak!',
            description: 'Multiple quality atoms in sequence',
            icon: '🔥'
        },
        hub_formation: {
            title: 'Hub Formed',
            description: 'Your insight has become a knowledge nexus',
            icon: '🌐'
        }
    }

    return messages[bonus.type]
}
