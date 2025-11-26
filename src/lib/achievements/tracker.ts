import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Achievement = Database['public']['Tables']['achievements']['Row']
type UserAchievement = Database['public']['Tables']['user_achievements']['Row']

/**
 * Check and update achievements for a user based on an event
 */
export async function checkAchievements(
    userId: string,
    eventType: 'atom_created' | 'link_created' | 'hub_created' | 'reflection_submitted' | 'streak_milestone',
    eventData?: any
): Promise<Achievement[]> {
    const supabase = createClient()
    const unlockedAchievements: Achievement[] = []

    // Get all achievements
    const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')

    if (!allAchievements) return []

    // Get user's current achievements
    const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)

    const unlockedIds = new Set(
        userAchievements
            ?.filter(ua => ua.unlocked_at !== null)
            .map(ua => ua.achievement_id) || []
    )

    // Filter achievements relevant to this event
    const relevantAchievements = allAchievements.filter(achievement => {
        if (unlockedIds.has(achievement.id)) return false // Already unlocked

        const metadata = achievement.requirement_metadata as any

        switch (eventType) {
            case 'atom_created':
                return metadata.entity === 'atoms'
            case 'link_created':
                return metadata.entity === 'links' || metadata.entity === 'text_links'
            case 'hub_created':
                return metadata.entity === 'hubs'
            case 'reflection_submitted':
                return metadata.entity === 'reflections'
            case 'streak_milestone':
                return achievement.requirement_type === 'streak'
            default:
                return false
        }
    })

    // Check each relevant achievement
    for (const achievement of relevantAchievements) {
        const shouldUnlock = await checkRequirement(userId, achievement, eventType, eventData)

        if (shouldUnlock) {
            await unlockAchievement(userId, achievement)
            unlockedAchievements.push(achievement)
        } else {
            // Update progress
            await updateProgress(userId, achievement, eventType)
        }
    }

    return unlockedAchievements
}

/**
 * Check if user meets requirement for an achievement
 */
async function checkRequirement(
    userId: string,
    achievement: Achievement,
    eventType: string,
    eventData?: any
): Promise<boolean> {
    const supabase = createClient()
    const metadata = achievement.requirement_metadata as any

    switch (achievement.requirement_type) {
        case 'count': {
            let count = 0

            if (metadata.entity === 'atoms') {
                const { count: atomCount } = await supabase
                    .from('atomic_notes')
                    .select('id', { count: 'exact', head: true })
                    .eq('author_id', userId)
                    .eq('moderation_status', 'approved')
                count = atomCount || 0
            } else if (metadata.entity === 'links') {
                const { count: linkCount } = await supabase
                    .from('links')
                    .select('id', { count: 'exact', head: true })
                    .eq('created_by', userId)
                count = linkCount || 0
            } else if (metadata.entity === 'hubs') {
                // Count notes with 5+ connections
                const { data: notes } = await supabase
                    .from('atomic_notes')
                    .select('id')
                    .eq('author_id', userId)
                    .eq('moderation_status', 'approved')

                if (notes) {
                    let hubCount = 0
                    for (const note of notes) {
                        const { count: linkCount } = await supabase
                            .from('links')
                            .select('id', { count: 'exact', head: true })
                            .or(`from_note_id.eq.${note.id},to_note_id.eq.${note.id}`)
                        if (linkCount && linkCount >= 5) hubCount++
                    }
                    count = hubCount
                }
            } else if (metadata.entity === 'reflections') {
                const { count: reflectionCount } = await supabase
                    .from('reflections')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                count = reflectionCount || 0
            }

            return count >= (achievement.requirement_value || 0)
        }

        case 'unique_count': {
            if (metadata.entity === 'text_links') {
                // Count unique texts linked to
                const { data: links } = await supabase
                    .from('links')
                    .select('to_text_id')
                    .eq('created_by', userId)
                    .not('to_text_id', 'is', null)

                const uniqueTexts = new Set(links?.map(l => l.to_text_id).filter(Boolean))
                return uniqueTexts.size >= (achievement.requirement_value || 0)
            }
            return false
        }

        case 'streak': {
            // Check current streak from streaks table
            const { data: streak } = await supabase
                .from('streaks')
                .select('current_streak')
                .eq('user_id', userId)
                .single()

            return (streak?.current_streak || 0) >= (achievement.requirement_value || 0)
        }

        default:
            return false
    }
}

/**
 * Unlock an achievement for a user
 */
async function unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    const supabase = createClient()

    // Double-check if already unlocked (defensive)
    const { data: existing } = await supabase
        .from('user_achievements')
        .select('unlocked_at')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single()

    if (existing?.unlocked_at) {
        console.log(`Achievement ${achievement.name} already unlocked, skipping`)
        return // Already unlocked, don't do it again
    }

    // Create or update user_achievement record
    await supabase
        .from('user_achievements')
        .upsert({
            user_id: userId,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString(),
            progress: achievement.requirement_value || 0
        }, {
            onConflict: 'user_id,achievement_id',
            ignoreDuplicates: false // Update if exists
        })

    // Award XP
    if (achievement.xp_reward > 0) {
        await supabase.from('actions').insert({
            user_id: userId,
            type: 'ACHIEVEMENT',
            xp: achievement.xp_reward,
            sp_reading: 0,
            sp_thinking: 0,
            sp_writing: 0,
            sp_engagement: 0,
            description: `Unlocked achievement: ${achievement.name}`,
            target_id: achievement.id
        })

        // Update character XP
        const { data: character } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (character) {
            await supabase
                .from('characters')
                .update({
                    xp_total: character.xp_total + achievement.xp_reward
                })
                .eq('user_id', userId)
        }
    }
}

/**
 * Update progress for an achievement
 */
async function updateProgress(
    userId: string,
    achievement: Achievement,
    eventType: string
): Promise<void> {
    const supabase = createClient()

    // Get current progress
    let currentProgress = 0
    const metadata = achievement.requirement_metadata as any

    if (achievement.requirement_type === 'count' || achievement.requirement_type === 'unique_count') {
        if (metadata.entity === 'atoms') {
            const { count } = await supabase
                .from('atomic_notes')
                .select('id', { count: 'exact', head: true })
                .eq('author_id', userId)
                .eq('moderation_status', 'approved')
            currentProgress = count || 0
        } else if (metadata.entity === 'links') {
            const { count } = await supabase
                .from('links')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', userId)
            currentProgress = count || 0
        } else if (metadata.entity === 'text_links') {
            const { data: links } = await supabase
                .from('links')
                .select('to_text_id')
                .eq('created_by', userId)
                .not('to_text_id', 'is', null)
            const uniqueTexts = new Set(links?.map(l => l.to_text_id).filter(Boolean))
            currentProgress = uniqueTexts.size
        }
    }

    // Upsert progress
    await supabase
        .from('user_achievements')
        .upsert({
            user_id: userId,
            achievement_id: achievement.id,
            progress: currentProgress,
            unlocked_at: null
        }, {
            onConflict: 'user_id,achievement_id'
        })
}

/**
 * Get all achievements with user's progress
 */
export async function getAchievementsWithProgress(userId: string) {
    const supabase = createClient()

    const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .order('category')
        .order('tier')

    const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)

    const userAchievementMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua]) || []
    )

    return achievements?.map(achievement => ({
        ...achievement,
        userProgress: userAchievementMap.get(achievement.id)?.progress || 0,
        unlockedAt: userAchievementMap.get(achievement.id)?.unlocked_at || null,
        isUnlocked: !!userAchievementMap.get(achievement.id)?.unlocked_at
    })) || []
}

/**
 * Get recently unlocked achievements
 */
export async function getRecentlyUnlocked(userId: string, limit: number = 5) {
    const supabase = createClient()

    const { data } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId)
        .not('unlocked_at', 'is', null)
        .order('unlocked_at', { ascending: false })
        .limit(limit)

    return data || []
}
