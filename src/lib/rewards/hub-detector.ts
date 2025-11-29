import { createClient } from '@/lib/supabase/client'
import { BonusReward } from './bonus-awards'

/**
 * Detect hub formation bonus
 * Awards bonus when a note reaches ≥5 unique connections for the first time
 * 
 * @param noteId - UUID of the note that may have become a hub
 * @returns BonusReward object if hub was just formed, null otherwise
 */
export async function detectHubFormation(noteId: string): Promise<BonusReward | null> {
    const supabase = createClient()

    const { data: note } = await supabase
        .from('atomic_notes')
        .select('is_hub, connection_count, title')
        .eq('id', noteId)
        .single()

    if (!note) {
        console.warn(`[Hub Detection] Note ${noteId} not found`)
        return null
    }

    // Only award if the note is newly a hub (exactly 5 connections)
    // This ensures the bonus is awarded once when threshold is reached
    if (note.is_hub && note.connection_count === 5) {
        return {
            type: 'hub_formation',
            xp: 2,
            sp: { thinking: 1 }, // Hub formation rewards synthesis/thinking
            metadata: {
                note_id: noteId,
                note_title: note.title,
                connection_count: note.connection_count
            }
        }
    }

    return null
}

/**
 * Check both notes involved in a link for hub formation
 * Called after a new link is created
 * 
 * @param fromNoteId - Source note ID
 * @param toNoteId - Target note ID (if linking to note, not text)
 * @returns Array of bonus rewards (0-2 items, one per note if applicable)
 */
export async function detectHubsFromLink(
    fromNoteId: string,
    toNoteId: string | null
): Promise<BonusReward[]> {
    const bonuses: BonusReward[] = []

    // Check if source note became a hub
    const fromBonus = await detectHubFormation(fromNoteId)
    if (fromBonus) bonuses.push(fromBonus)

    // Check if target note became a hub (if linking to note, not text)
    if (toNoteId) {
        const toBonus = await detectHubFormation(toNoteId)
        if (toBonus) bonuses.push(toBonus)
    }

    return bonuses
}
