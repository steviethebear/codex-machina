'use server'

import { createClient } from '@/lib/supabase/server'

export async function getClassStats() {
    const supabase = await createClient()

    // Counts
    const { count: noteCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
    const { count: connectionCount } = await supabase.from('connections').select('*', { count: 'exact', head: true })
    const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true })
    const { count: outlineCount } = await supabase.from('outlines').select('*', { count: 'exact', head: true })

    // Recent Activity (Mixed)
    // Reuse log from getFeed? Maybe just simple list.

    return {
        counts: {
            notes: noteCount || 0,
            connections: connectionCount || 0,
            comments: commentCount || 0,
            outlines: outlineCount || 0
        }
    }
}

export async function getStudentLeaderboard() {
    const supabase = await createClient()

    // Get all users
    const { data: users } = await supabase.from('users').select('id, codex_name, email')

    if (!users) return { data: [] }

    // Aggregate stats for each user
    // Ideally use a View or RPC for performance, but loop is fine for MVP small class.

    const leaderboard = await Promise.all(users.map(async (user) => {
        const { count: notes } = await supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        const { count: connections } = await supabase.from('connections').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        const { count: comments } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

        // Calculate Points
        // Note = 2, Connection = 1, Comment = 1 (Simple Model)
        const points = (notes || 0) * 2 + (connections || 0) * 1 + (comments || 0) * 1

        return {
            id: user.id,
            name: user.codex_name || user.email,
            notes: notes || 0,
            connections: connections || 0,
            comments: comments || 0,
            points
        }
    }))

    // Sort by points
    return { data: leaderboard.sort((a, b) => b.points - a.points) }
}
