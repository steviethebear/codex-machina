'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['notes']['Row']
type UserProfile = Database['public']['Tables']['users']['Row']

export async function getClassStats() {
    const supabase = await createClient()

    // Counts
    const { count: noteCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
    const { count: connectionCount } = await supabase.from('connections').select('*', { count: 'exact', head: true })
    const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true })

    // Activity for Heatmap (Last 365 Days)
    // We fetch updated_at from all notes.
    // Optimization: In a real app, use a materialized view or specialized table.
    const { data: activityData } = await (supabase as any)
        .from('notes')
        .select('updated_at')
        .gte('updated_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

    const activityMap = new Map<string, number>();
    const activityListRaw = activityData as any[];
    activityListRaw?.forEach((note: any) => {
        const date = new Date(note.updated_at).toISOString().split('T')[0]
        activityMap.set(date, (activityMap.get(date) || 0) + 1)
    })

    const activityList = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }))

    return {
        counts: {
            notes: noteCount || 0,
            connections: connectionCount || 0,
            comments: commentCount || 0
        },
        activity: activityList
    }
}

export async function getStudentLeaderboard() {
    const supabase = await createClient()

    // Get all users
    const { data: users } = await (supabase as any).from('users').select('id, codex_name, email')

    if (!users) return { data: [] }

    // Aggregate stats for each user
    const leaderboard = await Promise.all((users as any[]).map(async (user: any) => {
        const { count: notes } = await (supabase as any).from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        const { count: connections } = await (supabase as any).from('connections').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        const { count: comments } = await (supabase as any).from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

        // Fetch last activity
        const { data: lastNote } = await (supabase as any)
            .from('notes')
            .select('updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

        const lastActive = lastNote?.updated_at ? new Date(lastNote.updated_at) : null
        const daysInactive = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : 999

        // At Risk Logic
        // 1. Inactive > 7 days
        // 2. < 3 Notes total
        const isAtRisk = daysInactive > 7 || (notes || 0) < 3

        const points = (notes || 0) * 2 + (connections || 0) * 1 + (comments || 0) * 1

        return {
            id: user.id,
            name: user.codex_name || user.email,
            email: user.email,
            notes: notes || 0,
            connections: connections || 0,
            comments: comments || 0,
            points,
            daysInactive,
            isAtRisk
        }
    }))

    // Sort by points
    return { data: leaderboard.sort((a, b) => b.points - a.points) }
}

export async function getTeacherAnalytics() {
    const supabase = await createClient()

    // 1. Fetch Graph Data (Nodes & Links)
    // Nodes: All Public Notes + All Students
    // Links: Connections + Authorship (Student -> Note)

    // Fetch Users
    const { data: users } = await (supabase as any).from('users').select('id, codex_name, email')

    // Fetch Public Notes
    const { data: notes } = await (supabase as any)
        .from('notes')
        .select('id, title, type, user_id')
        .eq('is_public', true)

    // Fetch Connections
    const { data: connections } = await (supabase as any)
        .from('connections')
        .select('source_note_id, target_note_id')

    const nodes: any[] = []
    const links: any[] = [];

    // Add Student Nodes
    // Add Student Nodes
    const userList = users as any[];
    userList?.forEach((u: any) => {
        nodes.push({
            id: u.id,
            name: u.codex_name || u.email,
            type: 'student',
            val: 10,
            color: '#8b5cf6' // Violet for students
        })
    })

    // Add Note Nodes and Author Links
    const noteList = notes as any[];
    noteList?.forEach((n: any) => {
        nodes.push({
            id: n.id,
            name: n.title,
            type: n.type,
            val: 5
        })

        // Link Student -> Note (Authorship)
        links.push({
            source: n.user_id,
            target: n.id,
            color: '#333', // Subtle link
            width: 1
        })
    })

    // Add Note Connections
    const connectionList = connections as any[];
    connectionList?.forEach((c: any) => {
        // Only add if both nodes exist (public)
        // Since we only fetched public notes, we should filter connections where source/target are in our note list
        const noteIds = new Set((notes as any[])?.map((n: any) => n.id))
        if (noteIds.has(c.source_note_id) && noteIds.has(c.target_note_id)) {
            links.push({
                source: c.source_note_id,
                target: c.target_note_id,
                color: '#666',
                width: 2
            })
        }
    })

    return {
        graphData: { nodes, links }
    }
}
