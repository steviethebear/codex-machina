'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, FileText, Network, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LeaderboardEntry {
    id: string
    name: string
    notes: number
    connections: number
    comments: number
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

            // Aggregate stats for each user
            const entries = await Promise.all(users.map(async (user) => {
                const [notesRes, connectionsRes, commentsRes] = await Promise.all([
                    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                    supabase.from('connections').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                ])

                const notes = notesRes.count || 0
                const connections = connectionsRes.count || 0
                const comments = commentsRes.count || 0

                // Points calculation: Notes = 2pts, Connections = 1pt, Comments = 1pt
                const points = (notes * 2) + connections + comments

                return {
                    id: user.id,
                    name: user.codex_name || user.email?.split('@')[0] || 'Student',
                    notes,
                    connections,
                    comments,
                    points
                }
            }))

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
                <p className="text-muted-foreground mt-1">Class rankings based on contribution points.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Points: Notes (2pts) + Connections (1pt) + Comments (1pt)
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
                                        <FileText className="h-4 w-4 inline-block" />
                                    </th>
                                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">
                                        <Network className="h-4 w-4 inline-block" />
                                    </th>
                                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">
                                        <MessageSquare className="h-4 w-4 inline-block" />
                                    </th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">Points</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {leaderboard.map((entry, index) => (
                                    <tr key={entry.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4">
                                            {index === 0 && <span className="text-lg">🥇</span>}
                                            {index === 1 && <span className="text-lg">🥈</span>}
                                            {index === 2 && <span className="text-lg">🥉</span>}
                                            {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                                        </td>
                                        <td className="p-4 font-medium">{entry.name}</td>
                                        <td className="p-4 text-center text-muted-foreground">{entry.notes}</td>
                                        <td className="p-4 text-center text-muted-foreground">{entry.connections}</td>
                                        <td className="p-4 text-center text-muted-foreground">{entry.comments}</td>
                                        <td className="p-4 text-right">
                                            <Badge variant="secondary" className="font-bold">
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
        </div>
    )
}
