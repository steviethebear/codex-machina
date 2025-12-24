'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, FileText, Lightbulb, TrendingUp, Trophy } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalNotes: 0,
        permanentNotes: 0,
        fleetingNotes: 0,
        totalXP: 0,
        streak: 0
    })
    const [profile, setProfile] = useState<{ codex_name: string | null } | null>(null)
    const [achievements, setAchievements] = useState<any[]>([])
    const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!user) return

        const fetchData = async () => {
            setLoading(true)

            // 1. Fetch Profile
            const { data: profileData } = await supabase
                .from('users')
                .select('codex_name')
                .eq('id', user.id)
                .single()

            setProfile(profileData)

            // 2. Fetch Notes Stats
            const { data: notes } = await supabase
                .from('notes')
                .select('type, created_at')
                .eq('user_id', user.id)

            if (notes) {
                const totalNotes = notes.length
                const permanentNotes = notes.filter(n => n.type === 'permanent').length
                const fleetingNotes = notes.filter(n => n.type === 'fleeting').length
                const dates = [...new Set(notes.map(n => new Date(n.created_at).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                const today = new Date().toDateString()
                let streak = 0
                if (dates.includes(today)) streak = 1
                // Simplified streak for now

                // 3. Fetch Points
                const { data: points } = await supabase
                    .from('points')
                    .select('amount')
                    .eq('user_id', user.id)

                const totalXP = points?.reduce((acc, curr) => acc + curr.amount, 0) || 0

                setStats({
                    totalNotes,
                    permanentNotes,
                    fleetingNotes,
                    totalXP,
                    streak
                })
            }

            // 4. Fetch Achievements
            const { data: allAchievements } = await supabase
                .from('achievements')
                .select('*')
                .order('xp_reward', { ascending: true })

            const { data: myAchievements } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', user.id)

            setAchievements(allAchievements || [])
            setUserAchievements(new Set(myAchievements?.map(a => a.achievement_id) || []))

            setLoading(false)
        }
        fetchData()
    }, [user, supabase])

    if (loading) return <div className="p-8"><Skeleton className="h-48 w-full" /></div>

    return (
        <div className="flex flex-col gap-8 p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary border-2 border-primary">
                    {profile?.codex_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {profile?.codex_name || "Student"}
                    </h1>
                    <p className="text-muted-foreground">
                        {user?.email} • Level {Math.floor(stats.totalXP / 100) + 1} Scribe
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalXP}</div>
                        <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
                            <div
                                className="bg-primary h-full"
                                style={{ width: `${(stats.totalXP % 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {100 - (stats.totalXP % 100)} XP to next level
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalNotes}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.permanentNotes} Permanent • {stats.fleetingNotes} Fleeting
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Knowledge Score</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats.permanentNotes * 2.5).toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Based on permanent notes quality
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.streak} Days</div>
                        <p className="text-xs text-muted-foreground">
                            Keep writing daily!
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">No recent activity recorded.</p>
                    </CardContent>
                </Card>

                {/* Achievements List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Achievements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            {achievements.map((achievement) => {
                                const isUnlocked = userAchievements.has(achievement.id)
                                return (
                                    <div
                                        key={achievement.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border ${isUnlocked
                                                ? 'bg-primary/5 border-primary/20'
                                                : 'bg-muted/50 border-muted opacity-70'
                                            }`}
                                    >
                                        <div className={`text-2xl ${!isUnlocked && 'grayscale'}`}>
                                            {achievement.icon || '🏆'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <h4 className={`font-semibold text-sm ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {achievement.name}
                                                </h4>
                                                {isUnlocked && (
                                                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                                        +{achievement.xp_reward} XP
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {achievement.description}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                            {achievements.length === 0 && (
                                <p className="text-sm text-muted-foreground">No achievements available yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
