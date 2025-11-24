'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Database } from '@/types/database.types'
import { Trophy, Brain, BookOpen, Share2, Zap, Calendar, CalendarDays, CalendarRange } from 'lucide-react'

type Character = Database['public']['Tables']['characters']['Row'] & {
    users: { codex_name: string | null } | null
}

export default function LeaderboardPage() {
    const supabase = createClient()
    const { user } = useAuth()
    const [characters, setCharacters] = useState<Character[]>([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState<'xp_total' | 'sp_reading' | 'sp_thinking' | 'sp_engagement'>('xp_total')
    const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const userRowRef = useRef<HTMLTableRowElement>(null)

    useEffect(() => {
        if (user) {
            setCurrentUserId(user.id)
        }
    }, [user])

    useEffect(() => {
        const fetchLeaderboard = async () => {
            let query = supabase
                .from('characters')
                .select(`
          *,
          users (codex_name)
        `)
                .order(sortBy, { ascending: false })

            // For monthly/weekly, we filter by created_at (simplified approach)
            // In a full implementation, we'd calculate XP/SP from activities within the timeframe
            if (timeframe === 'monthly') {
                const startOfMonth = new Date()
                startOfMonth.setDate(1)
                startOfMonth.setHours(0, 0, 0, 0)
                query = query.gte('created_at', startOfMonth.toISOString())
            } else if (timeframe === 'weekly') {
                const startOfWeek = new Date()
                const day = startOfWeek.getDay()
                const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday
                startOfWeek.setDate(diff)
                startOfWeek.setHours(0, 0, 0, 0)
                query = query.gte('created_at', startOfWeek.toISOString())
            }

            const { data } = await query.limit(50)

            if (data) setCharacters(data as any)
            setLoading(false)
        }

        fetchLeaderboard()
    }, [supabase, sortBy, timeframe])

    // Scroll to user's row when data loads
    useEffect(() => {
        if (!loading && userRowRef.current) {
            userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [loading, characters])

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Leaderboard</h2>
                <p className="text-muted-foreground">Top performing agents in the simulation.</p>
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-2">
                <button
                    onClick={() => setTimeframe('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${timeframe === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                    <Calendar className="h-4 w-4" />
                    All Time
                </button>
                <button
                    onClick={() => setTimeframe('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${timeframe === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                    <CalendarDays className="h-4 w-4" />
                    This Month
                </button>
                <button
                    onClick={() => setTimeframe('weekly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${timeframe === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                    <CalendarRange className="h-4 w-4" />
                    This Week
                </button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSortBy('xp_total')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortBy === 'xp_total' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                    <Zap className="inline-block w-4 h-4 mr-2" />
                    Total XP
                </button>
                <button
                    onClick={() => setSortBy('sp_thinking')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortBy === 'sp_thinking' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                    <Brain className="inline-block w-4 h-4 mr-2" />
                    Thinking
                </button>
                <button
                    onClick={() => setSortBy('sp_reading')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortBy === 'sp_reading' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                    <BookOpen className="inline-block w-4 h-4 mr-2" />
                    Reading
                </button>
                <button
                    onClick={() => setSortBy('sp_engagement')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortBy === 'sp_engagement' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                    <Share2 className="inline-block w-4 h-4 mr-2" />
                    Engagement
                </button>
            </div>

            <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rank</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Codex Name</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Level</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">XP</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Thinking</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Reading</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Engagement</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {loading ? (
                                <tr><td colSpan={7} className="p-4 text-center">Loading data...</td></tr>
                            ) : (
                                characters.map((char, index) => {
                                    const isCurrentUser = char.user_id === currentUserId
                                    return (
                                        <tr
                                            key={char.id}
                                            ref={isCurrentUser ? userRowRef : null}
                                            className={`border-b transition-colors ${isCurrentUser
                                                ? 'bg-primary/10 hover:bg-primary/20 font-semibold'
                                                : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <td className="p-4 align-middle font-medium">
                                                {index + 1}
                                                {index === 0 && <Trophy className="inline-block ml-2 h-4 w-4 text-yellow-500" />}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {char.users?.codex_name || 'Unknown'}
                                                {isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                                                {char.title && <div className="text-xs italic text-muted-foreground">✨ {char.title}</div>}
                                            </td>
                                            <td className="p-4 align-middle text-right">{char.level}</td>
                                            <td className="p-4 align-middle text-right font-bold">{char.xp_total}</td>
                                            <td className="p-4 align-middle text-right">{char.sp_thinking}</td>
                                            <td className="p-4 align-middle text-right">{char.sp_reading}</td>
                                            <td className="p-4 align-middle text-right">{char.sp_engagement}</td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
