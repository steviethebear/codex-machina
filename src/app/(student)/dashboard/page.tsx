'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/types/database.types'
import { Brain, BookOpen, PenTool, Share2, Zap } from 'lucide-react'
import Link from 'next/link'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { WeeklyProgress } from '@/components/dashboard/weekly-progress'

type Character = Database['public']['Tables']['characters']['Row'] & {
    users: { codex_name: string | null } | null
}
type Action = Database['public']['Tables']['actions']['Row']

export default function DashboardPage() {
    const { user } = useAuth()
    const [character, setCharacter] = useState<Character | null>(null)
    const [recentActions, setRecentActions] = useState<Action[]>([])
    const [streak, setStreak] = useState(0)
    const [totalAtoms, setTotalAtoms] = useState(0)
    const [weeklyData, setWeeklyData] = useState<{ day: string; xp: number; sp_reading: number; sp_thinking: number; sp_writing: number; sp_engagement: number; actions: number }[]>([])
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
                .limit(15)

            if (actionsData) setRecentActions(actionsData)

            // Calculate streak (consecutive days with activity)
            const { data: allActions } = await supabase
                .from('actions')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }) as { data: { created_at: string }[] | null }

            if (allActions && allActions.length > 0) {
                let currentStreak = 0
                let lastDate: Date | null = null

                for (const action of allActions) {
                    const actionDate = new Date(action.created_at)
                    actionDate.setHours(0, 0, 0, 0)

                    if (!lastDate) {
                        // First action
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const yesterday = new Date(today)
                        yesterday.setDate(yesterday.getDate() - 1)

                        // Only count streak if activity is today or yesterday
                        if (actionDate.getTime() === today.getTime() || actionDate.getTime() === yesterday.getTime()) {
                            currentStreak = 1
                            lastDate = actionDate
                        } else {
                            break // No recent activity
                        }
                    } else {
                        const dayDiff = Math.floor((lastDate.getTime() - actionDate.getTime()) / (1000 * 60 * 60 * 24))
                        if (dayDiff === 1) {
                            currentStreak++
                            lastDate = actionDate
                        } else if (dayDiff > 1) {
                            break // Gap in streak
                        }
                        // dayDiff === 0 means same day, continue without incrementing
                    }
                }

                setStreak(currentStreak)
            }

            // Fetch total atoms count
            const { count } = await supabase
                .from('atomic_notes')
                .select('*', { count: 'exact', head: true })
                .eq('author_id', user.id)
                .eq('hidden', false)

            if (count !== null) setTotalAtoms(count)

            // Fetch weekly activity data (last 7 days)
            const weekData: { day: string; xp: number; sp_reading: number; sp_thinking: number; sp_writing: number; sp_engagement: number; actions: number }[] = []
            const today = new Date()

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                date.setHours(0, 0, 0, 0)

                const nextDate = new Date(date)
                nextDate.setDate(nextDate.getDate() + 1)

                const { data: dayActions } = await supabase
                    .from('actions')
                    .select('xp, sp_reading, sp_thinking, sp_writing, sp_engagement')
                    .eq('user_id', user.id)
                    .gte('created_at', date.toISOString())
                    .lt('created_at', nextDate.toISOString()) as { data: { xp: number; sp_reading: number; sp_thinking: number; sp_writing: number; sp_engagement: number }[] | null }

                const totalXP = dayActions?.reduce((sum, action) => sum + (action.xp || 0), 0) || 0
                const totalReadingSP = dayActions?.reduce((sum, action) => sum + (action.sp_reading || 0), 0) || 0
                const totalThinkingSP = dayActions?.reduce((sum, action) => sum + (action.sp_thinking || 0), 0) || 0
                const totalWritingSP = dayActions?.reduce((sum, action) => sum + (action.sp_writing || 0), 0) || 0
                const totalEngagementSP = dayActions?.reduce((sum, action) => sum + (action.sp_engagement || 0), 0) || 0
                const actionCount = dayActions?.length || 0

                const dayName = i === 0 ? 'Today' :
                    i === 1 ? 'Yesterday' :
                        date.toLocaleDateString('en-US', { weekday: 'short' })

                weekData.push({
                    day: dayName,
                    xp: totalXP,
                    sp_reading: totalReadingSP,
                    sp_thinking: totalThinkingSP,
                    sp_writing: totalWritingSP,
                    sp_engagement: totalEngagementSP,
                    actions: actionCount
                })
            }

            setWeeklyData(weekData)
        }

        fetchData()
    }, [user, supabase])

    if (!character) return <div className="p-8">Loading stats...</div>

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <div className="text-sm text-muted-foreground mt-1">
                        Welcome back, <span className="font-medium text-foreground">{character.users?.codex_name || 'Student'}</span>
                        {character.title && (
                            <span className="block text-xs italic text-primary mt-0.5">✨ {character.title}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Streak</CardTitle>
                        <Zap className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{streak}</div>
                        <p className="text-xs text-muted-foreground">consecutive days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Atoms</CardTitle>
                        <PenTool className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAtoms}</div>
                        <p className="text-xs text-muted-foreground">ideas created</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.xp_total}</div>
                        <p className="text-xs text-muted-foreground">Level {character.level}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reading SP</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.sp_reading}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thinking SP</CardTitle>
                        <Brain className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.sp_thinking}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Writing SP</CardTitle>
                        <PenTool className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.sp_writing}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement SP</CardTitle>
                        <Share2 className="h-4 w-4 text-pink-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{character.sp_engagement}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WeeklyProgress data={weeklyData} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="pr-4">
                            <ActivityFeed actions={recentActions} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
