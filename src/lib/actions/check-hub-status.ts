'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const HUB_THRESHOLD = 5
const HUB_XP_BONUS = 50
const HUB_SP_BONUS = 10

/**
 * Check if an atom has reached hub status (5+ connections)
 * and award bonus XP/SP if this is the first time
 */
export async function checkHubStatus(atomId: string): Promise<{
    isHub: boolean
    justBecameHub: boolean
    connectionCount: number
}> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Count total connections for this atom
    const { data: links, error } = await supabase
        .from('links')
        .select('id')
        .or(`note_a_id.eq.${atomId},note_b_id.eq.${atomId}`)

    if (error) {
        console.error('Error counting links for hub detection:', error)
        return { isHub: false, justBecameHub: false, connectionCount: 0 }
    }

    const connectionCount = links?.length || 0
    const isHub = connectionCount >= HUB_THRESHOLD

    if (!isHub) {
        return { isHub: false, justBecameHub: false, connectionCount }
    }

    // Check if we've already awarded hub bonus
    // We'll check if the atom has exactly HUB_THRESHOLD connections (just became a hub)
    const justBecameHub = connectionCount === HUB_THRESHOLD

    if (justBecameHub) {
        // Award bonus XP and SP
        const { data: atomData } = await supabase
            .from('atomic_notes')
            .select('author_id, character_id')
            .eq('id', atomId)
            .single()

        if (atomData) {
            // Get current character stats
            const { data: char } = await supabase
                .from('characters')
                .select('xp_total, sp_thinking')
                .eq('id', atomData.character_id)
                .single()

            if (char) {
                // Award to character
                await supabase
                    .from('characters')
                    .update({
                        xp_total: char.xp_total + HUB_XP_BONUS,
                        sp_thinking: char.sp_thinking + HUB_SP_BONUS
                    })
                    .eq('id', atomData.character_id)

                console.log(`Hub bonus awarded to atom ${atomId}: +${HUB_XP_BONUS} XP, +${HUB_SP_BONUS} Thinking SP`)
            }
        }
    }

    return { isHub, justBecameHub, connectionCount }
}

/**
 * Get connection count for an atom (for display purposes)
 */
export async function getAtomConnectionCount(atomId: string): Promise<number> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: links } = await supabase
        .from('links')
        .select('id')
        .or(`note_a_id.eq.${atomId},note_b_id.eq.${atomId}`)

    return links?.length || 0
}
