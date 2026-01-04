import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { awardPoints } from '@/lib/points'
import { createNotification } from '@/lib/notifications'
export async function checkAndUnlockAchievements(userId: string) {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch User Stats (Manual Aggregation for now)
    // In a larger app, we might have a 'user_stats' table.
    const { count: noteCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'permanent')

    const { count: connectionCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    // 2. Fetch All Achievements
    const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')

    // 3. Fetch User's Existing Achievements
    const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId)

    const unlockedIds = new Set((userAchievements as any[])?.map((ua: any) => ua.achievement_id) || [])
    const newUnlocks: string[] = [] // Names of unlocked achievements

    if (!allAchievements) return []

    // 4. Check Logic
    for (const ach of (allAchievements as any[])) {
        if (unlockedIds.has(ach.id)) continue

        let unlocked = false

        switch (ach.key) {
            case 'first_note':
                if ((noteCount || 0) >= 1) unlocked = true
                break
            case 'prolific':
                if ((noteCount || 0) >= 10) unlocked = true
                break
            case 'connector':
                if ((connectionCount || 0) >= 1) unlocked = true
                break
            case 'web_weaver':
                if ((connectionCount || 0) >= 10) unlocked = true
                break
            // Add other cases here (streaks, etc.)
        }

        if (unlocked) {
            // Unlock it!
            const { error } = await supabaseAdmin
                .from('user_achievements')
                .insert({
                    user_id: userId,
                    achievement_id: ach.id,
                    unlocked_at: new Date().toISOString()
                })

            if (!error) {
                newUnlocks.push(ach.name)

                // Award the XP for it!
                await awardPoints(
                    userId,
                    ach.xp_reward,
                    'achievement_unlocked',
                    ach.id // Source ID is the achievement ID
                )

                // Notify User
                await createNotification({
                    user_id: userId,
                    type: 'achievement',
                    title: 'Achievement Unlocked!',
                    message: `You unlocked "${ach.name}"!`,
                    link: '/dashboard'
                })
            }
        }
    }

    return newUnlocks
}
