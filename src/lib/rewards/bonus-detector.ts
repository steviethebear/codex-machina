import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type BonusReward = {
    type: 'trailblazer' | 'scholar' | 'bridge_builder' | 'streak' | 'combo'
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
 * Detect if atom is the first for its text (Trailblazer bonus)
 */
export async function detectTrailblazer(
    noteId: string,
    textId: string | null,
    userId: string
): Promise<BonusReward | null> {
    if (!textId) return null

    const supabase = createClient()

    // Check if any other approved atoms exist for this text
    const { count } = await supabase
        .from('atomic_notes')
        .select('id', { count: 'exact', head: true })
        .eq('text_id', textId)
        .eq('moderation_status', 'approved')
        .neq('id', noteId)

    if (count === 0) {
        return {
            type: 'trailblazer',
            xp: 50,
            sp: { engagement: 10 },
            metadata: { text_id: textId }
        }
    }

    return null
}

/**
 * Detect if atom contains substantial citations (Scholar bonus)
 */
export function detectScholar(body: string): BonusReward | null {
    // Count blockquotes (markdown citations: lines starting with >)
    const citations = (body.match(/^>\s+.+$/gm) || []).length

    if (citations >= 3) {
        return {
            type: 'scholar',
            xp: 30,
            sp: { reading: 15 },
            metadata: { citations }
        }
    }

    return null
}

/**
 * Detect if link bridges previously disconnected notes (Bridge Builder bonus)
 * Simplified version: checks if the two notes had no direct connection before
 */
export async function detectBridgeBuilder(
    linkId: string,
    fromNoteId: string,
    toNoteId: string | null
): Promise<BonusReward | null> {
    if (!toNoteId) return null

    const supabase = createClient()

    // Check if there was already a direct link between these notes
    const { count } = await supabase
        .from('links')
        .select('id', { count: 'exact', head: true })
        .neq('id', linkId)
        .or(`and(from_note_id.eq.${fromNoteId},to_note_id.eq.${toNoteId}),and(from_note_id.eq.${toNoteId},to_note_id.eq.${fromNoteId})`)

    if (count === 0) {
        // Get text_ids for both notes to ensure they are from different sources
        const { data: notes } = await supabase
            .from('atomic_notes')
            .select('id, text_id')
            .in('id', [fromNoteId, toNoteId])

        if (notes && notes.length === 2) {
            const noteA = notes.find(n => n.id === fromNoteId)
            const noteB = notes.find(n => n.id === toNoteId)

            // Bridge Builder Requirement: Must connect two different texts
            // Both notes must have a text_id, and they must be different
            if (noteA?.text_id && noteB?.text_id && noteA.text_id !== noteB.text_id) {
                return {
                    type: 'bridge_builder',
                    xp: 25, // Reduced from 40
                    sp: { thinking: 10 }, // Reduced from 20
                    metadata: {
                        from_note_id: fromNoteId,
                        to_note_id: toNoteId,
                        cross_text: true
                    }
                }
            }
        }
    }

    return null
}

/**
 * Update user's streak and return current streak count
 */
export async function updateStreak(userId: string): Promise<number> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get or create streak record
    const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (!streak) {
        // Create new streak
        await supabase.from('streaks').insert({
            user_id: userId,
            current_streak: 1,
            longest_streak: 1,
            last_contribution_date: today
        })
        return 1
    }

    const lastDate = new Date(streak.last_contribution_date || 0)
    const todayDate = new Date(today)
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) {
        // Same day, no change
        return streak.current_streak || 0
    } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        const newStreak = (streak.current_streak || 0) + 1
        await supabase.from('streaks').update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak || 0),
            last_contribution_date: today
        }).eq('user_id', userId)
        return newStreak
    } else {
        // Streak broken, reset to 1
        await supabase.from('streaks').update({
            current_streak: 1,
            last_contribution_date: today
        }).eq('user_id', userId)
        return 1
    }
}

/**
 * Calculate streak multiplier based on current streak
 */
export function getStreakMultiplier(streakCount: number): number {
    if (streakCount >= 14) return 1.5
    if (streakCount >= 7) return 1.2
    if (streakCount >= 3) return 1.1
    return 1.0
}

/**
 * Detect quality combo (multiple high-quality atoms in a row)
 */
export async function detectCombo(userId: string): Promise<BonusReward | null> {
    const supabase = createClient()

    // Get user's last 3 approved atoms
    const { data: recentNotes } = await supabase
        .from('atomic_notes')
        .select('id')
        .eq('author_id', userId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3)

    if (!recentNotes || recentNotes.length < 3) return null

    // Check if each has 3+ connections
    let comboCount = 0
    for (const note of recentNotes) {
        const { count } = await supabase
            .from('links')
            .select('id', { count: 'exact', head: true })
            .or(`from_note_id.eq.${note.id},to_note_id.eq.${note.id}`)

        if (count && count >= 3) {
            comboCount++
        } else {
            break // Combo broken
        }
    }

    if (comboCount >= 3) {
        return {
            type: 'combo',
            xp: 25 * comboCount,
            sp: { writing: 10, thinking: 10 },
            metadata: { combo_length: comboCount }
        }
    }

    return null
}
