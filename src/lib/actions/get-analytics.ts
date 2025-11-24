'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * Get activity heatmap data for a date range
 */
export async function getActivityHeatmap(userId?: string, days: number = 90) {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabase
        .from('atomic_notes')
        .select('created_at, author_id')
        .gte('created_at', startDate.toISOString())
        .eq('moderation_status', 'approved')

    if (userId) {
        query = query.eq('author_id', userId)
    }

    const { data } = await query

    // Aggregate by date
    const heatmapData: Record<string, number> = {}
    data?.forEach(note => {
        const date = new Date(note.created_at).toISOString().split('T')[0]
        heatmapData[date] = (heatmapData[date] || 0) + 1
    })

    return heatmapData
}

/**
 * Get SP/XP trends over time for a student
 */
export async function getSPTrends(userId: string, days: number = 30) {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: actions } = await supabase
        .from('actions')
        .select('created_at, xp, sp_reading, sp_thinking, sp_writing, sp_engagement')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

    // Aggregate by day and cumulative sum
    const trends: any[] = []
    let cumulative = {
        xp: 0,
        sp_reading: 0,
        sp_thinking: 0,
        sp_writing: 0,
        sp_engagement: 0
    }

    const dailyData: Record<string, typeof cumulative> = {}

    actions?.forEach(action => {
        const date = new Date(action.created_at).toISOString().split('T')[0]
        if (!dailyData[date]) {
            dailyData[date] = { xp: 0, sp_reading: 0, sp_thinking: 0, sp_writing: 0, sp_engagement: 0 }
        }
        dailyData[date].xp += action.xp || 0
        dailyData[date].sp_reading += action.sp_reading || 0
        dailyData[date].sp_thinking += action.sp_thinking || 0
        dailyData[date].sp_writing += action.sp_writing || 0
        dailyData[date].sp_engagement += action.sp_engagement || 0
    })

    // Convert to cumulative trends
    Object.keys(dailyData).sort().forEach(date => {
        cumulative.xp += dailyData[date].xp
        cumulative.sp_reading += dailyData[date].sp_reading
        cumulative.sp_thinking += dailyData[date].sp_thinking
        cumulative.sp_writing += dailyData[date].sp_writing
        cumulative.sp_engagement += dailyData[date].sp_engagement

        trends.push({
            date,
            ...cumulative
        })
    })

    return trends
}

/**
 * Get atoms count per unit
 */
export async function getNodesPerUnit() {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: units } = await supabase
        .from('units')
        .select('id, title')
        .order('start_date', { ascending: true })

    if (!units) return []

    const stats = await Promise.all(units.map(async (unit) => {
        const { data: reflections } = await supabase
            .from('reflections')
            .select('id, author_id')
            .eq('unit_id', unit.id)

        const authorIds = reflections?.map(r => r.author_id) || []

        // Count atoms by students who submitted reflections for this unit
        const { data: atoms, count } = await supabase
            .from('atomic_notes')
            .select('id, type', { count: 'exact' })
            .in('author_id', authorIds.length > 0 ? authorIds : [''])
            .eq('moderation_status', 'approved')

        // Count by type
        const typeCounts: Record<string, number> = {}
        atoms?.forEach(atom => {
            typeCounts[atom.type] = (typeCounts[atom.type] || 0) + 1
        })

        return {
            unit: unit.title,
            total: count || 0,
            ...typeCounts
        }
    }))

    return stats
}

/**
 * Get link density statistics
 */
export async function getLinkDensity() {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: atoms, count: atomCount } = await supabase
        .from('atomic_notes')
        .select('id', { count: 'exact' })
        .eq('moderation_status', 'approved')

    const { data: links, count: linkCount } = await supabase
        .from('links')
        .select('id', { count: 'exact' })

    // Count hubs (atoms with 5+ connections)
    let hubCount = 0
    if (atoms) {
        for (const atom of atoms) {
            const { data: atomLinks } = await supabase
                .from('links')
                .select('id')
                .or(`note_a_id.eq.${atom.id},note_b_id.eq.${atom.id}`)

            if (atomLinks && atomLinks.length >= 5) {
                hubCount++
            }
        }
    }

    const avgConnectionsPerAtom = atomCount ? (linkCount || 0) * 2 / atomCount : 0

    return {
        atomCount: atomCount || 0,
        linkCount: linkCount || 0,
        hubCount,
        avgConnectionsPerAtom: Math.round(avgConnectionsPerAtom * 10) / 10
    }
}
