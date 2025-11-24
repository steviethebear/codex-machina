'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Title thresholds and definitions
const TITLES = [
    {
        id: 'question_weaver',
        name: 'The Question-Weaver',
        description: 'Master of inquiry',
        criteria: { type: 'question', minCount: 10 }
    },
    {
        id: 'citation_adept',
        name: 'The Citation Adept',
        description: 'Scholar of sources',
        criteria: { type: 'quote', minCount: 15 }
    },
    {
        id: 'insight_cartographer',
        name: 'The Insight Cartographer',
        description: 'Mapper of understanding',
        criteria: { type: 'insight', minCount: 10 }
    },
    {
        id: 'hub_architect',
        name: 'The Hub Architect',
        description: 'Builder of connections',
        criteria: { hubCount: 3 }
    },
    {
        id: 'the_connector',
        name: 'The Connector',
        description: 'Weaver of knowledge threads',
        criteria: { linkCount: 25 }
    },
    {
        id: 'the_analyst',
        name: 'The Analyst',
        description: 'Examiner of ideas',
        criteria: { type: 'idea', minCount: 10 }
    },
    {
        id: 'the_scribe',
        name: 'The Scribe',
        description: 'Chronicler of thought',
        criteria: { totalAtoms: 20 }
    }
]

/**
 * Calculate and award appropriate title for a user
 */
export async function calculateAndAwardTitle(userId: string): Promise<string | null> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get user's character
    const { data: character } = await supabase
        .from('characters')
        .select('id, title')
        .eq('user_id', userId)
        .single()

    if (!character) return null

    // Get user's stats
    const { data: atoms } = await supabase
        .from('atomic_notes')
        .select('id, type')
        .eq('author_id', userId)
        .eq('moderation_status', 'approved')

    const { data: links } = await supabase
        .from('links')
        .select('id')
        .eq('created_by', userId)

    if (!atoms) return null

    // Calculate type counts
    const typeCounts: Record<string, number> = {}
    atoms.forEach(atom => {
        typeCounts[atom.type] = (typeCounts[atom.type] || 0) + 1
    })

    // Count hubs (atoms with 5+ connections)
    let hubCount = 0
    for (const atom of atoms) {
        const { data: atomLinks } = await supabase
            .from('links')
            .select('id')
            .or(`note_a_id.eq.${atom.id},note_b_id.eq.${atom.id}`)

        if (atomLinks && atomLinks.length >= 5) {
            hubCount++
        }
    }

    const totalAtoms = atoms.length
    const linkCount = links?.length || 0

    // Check which titles are earned
    const earnedTitles = TITLES.filter(title => {
        const { criteria } = title

        if ('type' in criteria && criteria.type && criteria.minCount) {
            return (typeCounts[criteria.type] || 0) >= criteria.minCount
        }
        if ('hubCount' in criteria) {
            return hubCount >= criteria.hubCount!
        }
        if ('linkCount' in criteria) {
            return linkCount >= criteria.linkCount!
        }
        if ('totalAtoms' in criteria) {
            return totalAtoms >= criteria.totalAtoms!
        }
        return false
    })

    // Award the highest-tier title (last in earned list)
    if (earnedTitles.length > 0) {
        const newTitle = earnedTitles[earnedTitles.length - 1]

        // Only update if it's a new title
        if (character.title !== newTitle.name) {
            await supabase
                .from('characters')
                .update({ title: newTitle.name })
                .eq('id', character.id)

            return newTitle.name
        }
    }

    return null
}

/**
 * Get available titles and progress
 */
export async function getTitleProgress(userId: string) {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get stats (similar to calculateAndAwardTitle but return progress)
    const { data: atoms } = await supabase
        .from('atomic_notes')
        .select('id, type')
        .eq('author_id', userId)
        .eq('moderation_status', 'approved')

    const { data: links } = await supabase
        .from('links')
        .select('id')
        .eq('created_by', userId)

    if (!atoms) return []

    const typeCounts: Record<string, number> = {}
    atoms.forEach(atom => {
        typeCounts[atom.type] = (typeCounts[atom.type] || 0) + 1
    })

    let hubCount = 0
    for (const atom of atoms) {
        const { data: atomLinks } = await supabase
            .from('links')
            .select('id')
            .or(`note_a_id.eq.${atom.id},note_b_id.eq.${atom.id}`)

        if (atomLinks && atomLinks.length >= 5) {
            hubCount++
        }
    }

    const totalAtoms = atoms.length
    const linkCount = links?.length || 0

    // Return progress for each title
    return TITLES.map(title => {
        const { criteria } = title
        let current = 0
        let target = 0
        let earned = false

        if ('type' in criteria && criteria.type && criteria.minCount) {
            current = typeCounts[criteria.type] || 0
            target = criteria.minCount
            earned = current >= target
        } else if ('hubCount' in criteria) {
            current = hubCount
            target = criteria.hubCount!
            earned = current >= target
        } else if ('linkCount' in criteria) {
            current = linkCount
            target = criteria.linkCount!
            earned = current >= target
        } else if ('totalAtoms' in criteria) {
            current = totalAtoms
            target = criteria.totalAtoms!
            earned = current >= target
        }

        return {
            ...title,
            current,
            target,
            earned,
            progress: Math.min(100, (current / target) * 100)
        }
    })
}
