'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, FileText, Network, MessageSquare, Star, AtSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LeaderboardEntry {
    id: string
    name: string
    notes: number
    connections: number
    mentions: number
    points: number
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const loadLeaderboard = async () => {
            // Get all users
            const { data: users } = await supabase.from('users').select('id, codex_name, email')

            if (!users) {
                setLoading(false)
                return
            }

            // Fetch Data Needed for Stats
            // We could join, but independent fetches are okay for MVP
            const { data: allPoints } = await supabase.from('points').select('user_id, amount, reason')
            const { data: allNotes } = await supabase.from('notes').select('user_id, type')
            const { data: allConnections } = await supabase.from('connections').select('user_id')

            // Aggregate stats for each user
            const entries = users.map(user => {
                const userPoints = allPoints?.filter(p => p.user_id === user.id).reduce((sum, p) => sum + p.amount, 0) || 0
                // Count Permanent notes only? Or all? Usually leaderboard reflects Permanent count or Total?
                // "Notes created" usually means Permanent in Codex context.
                const userNotes = allNotes?.filter(n => n.user_id === user.id && n.type === 'permanent').length || 0
                const userConnections = allConnections?.filter(c => c.user_id === user.id).length || 0
                const userMentions = allPoints?.filter(p => p.user_id === user.id && p.reason === 'mentioned_in_note').length || 0

                return {
                    id: user.id,
                    name: user.codex_name || user.email?.split('@')[0] || 'Student',
                    notes: userNotes,
                    connections: userConnections,
                    mentions: userMentions,
                    points: userPoints
                }
            })

            // Sort by points descending
            entries.sort((a, b) => b.points - a.points)
            setLeaderboard(entries)
            setLoading(false)
        }

        loadLeaderboard()
    }, [supabase])

    if (loading) return <div className="p-8">Loading leaderboard...</div>

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    Leaderboard
                </h2>
                <p className="text-muted-foreground mt-1">Class rankings based on intellectual contribution.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Star className="h-4 w-4" /> Points awarded for Note Promotion, Connections, and Quality.
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b">
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground w-16">Rank</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Student</th>
                                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">
                                        <div className="flex items-center justify-center gap-1" title="Permanent Notes">
                                            <FileText className="h-4 w-4" />
                                            <span className="hidden sm:inline">Notes</span>
                                        </div>
                                    </th>
                                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">
                                        <div className="flex items-center justify-center gap-1" title="Connections Made">
                                            <Network className="h-4 w-4" />
                                            <span className="hidden sm:inline">Links</span>
                                        </div>
                                    </th>
                                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">
                                        <div className="flex items-center justify-center gap-1" title="Mentions Received">
                                            <AtSign className="h-4 w-4" />
                                            <span className="hidden sm:inline">Mentions</span>
                                        </div>
                                    </th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">Total Points</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {leaderboard.map((entry, index) => (
                                    <tr
                                        key={entry.id}
                                        className="border-b transition-colors hover:bg-muted/50 cursor-pointer group"
                                        onClick={() => window.location.href = `/user/${entry.id}`}
                                    >
                                        <td className="p-4">
                                            {index === 0 && <span className="text-lg">🥇</span>}
                                            {index === 1 && <span className="text-lg">🥈</span>}
                                            {index === 2 && <span className="text-lg">🥉</span>}
                                            {index > 2 && <span className="text-muted-foreground font-mono">{index + 1}</span>}
                                        </td>
                                        <td className="p-4 font-medium group-hover:text-primary transition-colors">{entry.name}</td>
                                        <td className="p-4 text-center text-muted-foreground">{entry.notes}</td>
                                        <td className="p-4 text-center text-muted-foreground">{entry.connections}</td>
                                        <td className="p-4 text-center text-muted-foreground">{entry.mentions}</td>
                                        <td className="p-4 text-right">
                                            <Badge variant="secondary" className="font-bold bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200">
                                                {entry.points} pts
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No students yet. Start creating notes to appear on the leaderboard!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}
