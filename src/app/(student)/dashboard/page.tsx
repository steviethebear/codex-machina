'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/types/database.types'
import { Brain, BookOpen, PenTool, Share2, Zap } from 'lucide-react'
import Link from 'next/link'

type Character = Database['public']['Tables']['characters']['Row'] & {
    users: { codex_name: string | null } | null
}
type Action = Database['public']['Tables']['actions']['Row']

export default function DashboardPage() {
    const { user } = useAuth()
    const [character, setCharacter] = useState<Character | null>(null)
    const [recentActions, setRecentActions] = useState<Action[]>([])
    const supabase = createClient()

    useEffect(() => {
        if (!user) return

        const fetchData = async () => {
            // Fetch character
            const { data: charData } = await supabase
                .from('characters')
                .select('*, users(codex_name)')
                .eq('user_id', user.id)
                .single()

            if (charData) setCharacter(charData)

            // Fetch recent actions
            const { data: actionsData } = await supabase
                .from('actions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (actionsData) setRecentActions(actionsData)
        }

        fetchData()
    }, [user, supabase])

    if (!character) return <div className="p-8">Loading stats...</div>

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="text-sm text-muted-foreground">
                    Welcome back, <span className="font-medium text-foreground">{character.users?.codex_name || 'Student'}</span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                        <Zap className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.xp_total}</div>
                        <p className="text-xs text-muted-foreground">Level {character.level}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reading SP</CardTitle>
                        <BookOpen className="h-4 w-4 text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.sp_reading}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thinking SP</CardTitle>
                        <Brain className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.sp_thinking}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement SP</CardTitle>
                        <Share2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.sp_engagement}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No activity yet.</p>
                            ) : (
                                recentActions.map((action) => {
                                    const content = (
                                        <>
                                            <div className="ml-4 space-y-1 flex-1">
                                                <p className="text-sm font-medium leading-none">{action.type}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {action.description || `Earned ${action.xp} XP`}
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium text-sm">+{action.xp} XP</div>
                                        </>
                                    )

                                    return (
                                        <div key={action.id}>
                                            {action.target_id ? (
                                                <Link
                                                    href={`/notes/${action.target_id}`}
                                                    className="flex items-center w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                                                >
                                                    {content}
                                                </Link>
                                            ) : (
                                                <div className="flex items-center w-full p-3 rounded-lg border bg-card">
                                                    {content}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
