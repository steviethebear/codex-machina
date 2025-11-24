'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { Trophy, Brain, BookOpen, Share2, Zap } from 'lucide-react'

type Character = Database['public']['Tables']['characters']['Row'] & {
    users: { codex_name: string | null } | null
}

export default function LeaderboardPage() {
    const supabase = createClient()
    const [characters, setCharacters] = useState<Character[]>([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState<'xp_total' | 'sp_reading' | 'sp_thinking' | 'sp_engagement'>('xp_total')

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const { data } = await supabase
                .from('characters')
                .select(`
          *,
          users (codex_name)
        `)
                .order(sortBy, { ascending: false })
                .limit(50)

            if (data) setCharacters(data as any)
            setLoading(false)
        }

        fetchLeaderboard()
    }, [supabase, sortBy])

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Leaderboard</h2>
                <p className="text-muted-foreground">Top performing agents in the simulation.</p>
            </div>

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
                                characters.map((char, index) => (
                                    <tr key={char.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{index + 1}</td>
                                        <td className="p-4 align-middle">{char.users?.codex_name || 'Unknown'}</td>
                                        <td className="p-4 align-middle text-right">{char.level}</td>
                                        <td className="p-4 align-middle text-right font-bold">{char.xp_total}</td>
                                        <td className="p-4 align-middle text-right">{char.sp_thinking}</td>
                                        <td className="p-4 align-middle text-right">{char.sp_reading}</td>
                                        <td className="p-4 align-middle text-right">{char.sp_engagement}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
