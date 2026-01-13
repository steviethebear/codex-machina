'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity, Network, Rewind, Calendar as CalendarIcon, FileText, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<{ codex_name: string | null } | null>(null)
    const [pendingReflections, setPendingReflections] = useState<number>(0)

    // Thinking Profile Metrics
    const [metrics, setMetrics] = useState({
        totalNotes: 0,
        permanentCount: 0,
        fleetingCount: 0, // Explicit count
        connectionCount: 0,
        connectionDensity: 0, // Links per note
        activityMap: new Map<string, number>(), // date -> count
        revisits: [] as any[] // List of self-citations to older notes
    })

    const [unlocked, setUnlocked] = useState(false)

    useEffect(() => {
        if (!user) return

        const fetchData = async () => {
            setLoading(true)

            // 0. Fetch Reflections status (Ungated)
            const { count: pendingCount } = await supabase
                .from('reflections')
                .select('id', { count: 'exact' })
                .eq('student_id', user.id)
                .neq('status', 'completed')
            setPendingReflections(pendingCount || 0)

            // 0. Check Unlock Status
            const { data: unlockData } = await supabase
                .from('unlocks')
                .select('feature')
                .eq('user_id', user.id)
                .eq('feature', 'thinking_profile')
                .single()

            if (!unlockData) {
                setLoading(false)
                return // Remain locked
            }
            setUnlocked(true)

            // 1. Fetch Profile
            // ... (rest of fetch logic)
            const { data: profileData } = await supabase
                .from('users')
                .select('codex_name')
                .eq('id', user.id)
                .single()
            setProfile(profileData)

            // 2. Fetch Notes (for Counts & Heatmap)
            // We need created_at to build the rhythm map
            const { data: notes } = await supabase
                .from('notes')
                .select('id, title, type, created_at, content')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (notes) {
                const totalNotes = notes.length
                const permanentCount = notes.filter(n => n.type === 'permanent').length
                const fleetingCount = notes.filter(n => n.type === 'fleeting').length

                // Build Activity Map (Production Rhythm)
                const activityMap = new Map<string, number>()
                let totalParsedConnections = 0

                notes.forEach(note => {
                    // Activity Map
                    const date = new Date(note.created_at).toISOString().split('T')[0]
                    activityMap.set(date, (activityMap.get(date) || 0) + 1)

                    // Parse Content for connections (Links + Mentions)
                    const content = note.content || ''
                    // Match [[Wiki Links]]
                    const links = content.match(/\[\[(.*?)\]\]/g) || []
                    // Match @Mentions (simple word match for now)
                    const mentions = content.match(/@(\w+)/g) || []

                    totalParsedConnections += links.length + mentions.length
                })

                // 3. Fetch Connections (only used for Revisitation analysis now)
                const { data: connections } = await supabase
                    .from('connections')
                    .select('source_note_id, target_note_id, created_at')
                    .eq('user_id', user.id)

                const validConnections = connections || []
                // Use parsed count for the metric
                const connectionCount = totalParsedConnections
                const connectionDensity = totalNotes > 0 ? (connectionCount / totalNotes) : 0

                // 4. Calculate Revisitation (Self-citations > 7 days old)
                // We need to look up the created_at of the TARGET note to compare.
                // Since we already fetched all USER notes in step 2, we can generate a lookup map.
                const noteDateMap = new Map<string, string>(); // id -> created_at
                const noteTitleMap = new Map<string, string>(); // id -> title
                notes.forEach(n => {
                    noteDateMap.set(n.id, n.created_at)
                    noteTitleMap.set(n.id, n.title)
                })

                const revisits: any[] = []
                validConnections.forEach(conn => {
                    const sourceDate = noteDateMap.get(conn.source_note_id)
                    const targetDate = noteDateMap.get(conn.target_note_id)

                    // Only count if both notes belong to user (Self-revisitation)
                    if (sourceDate && targetDate) {
                        const sTime = new Date(sourceDate).getTime()
                        const tTime = new Date(targetDate).getTime()
                        const dayDiff = (sTime - tTime) / (1000 * 3600 * 24)

                        // If source is significantly newer than target (> 7 days)
                        // It means we revisited an old idea in a new note
                        if (dayDiff > 7) {
                            revisits.push({
                                sourceTitle: noteTitleMap.get(conn.source_note_id),
                                targetTitle: noteTitleMap.get(conn.target_note_id),
                                date: conn.created_at,
                                ageGap: Math.floor(dayDiff)
                            })
                        }
                    }
                })

                // Sort revisits by connection creation date (newest first)
                revisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                setMetrics({
                    totalNotes,
                    permanentCount,
                    fleetingCount,
                    connectionCount,
                    connectionDensity,
                    activityMap,
                    revisits: revisits.slice(0, 5) // Top 5 recent revisits
                })
            }
            setLoading(false)
        }
        fetchData()
    }, [user, supabase])

    // Constants for Heatmap
    const getHeatmapData = () => {
        const today = new Date()
        const days = []
        // Show last 60 days
        for (let i = 59; i >= 0; i--) {
            const d = new Date()
            d.setDate(today.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            days.push({
                date: d,
                count: metrics.activityMap.get(dateStr) || 0
            })
        }
        return days
    }

    if (loading) return <div className="p-8"><Skeleton className="h-48 w-full" /></div>

    if (!unlocked) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[60vh] text-center max-w-lg mx-auto">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Thinking Profile</h1>
                <p className="text-muted-foreground mb-8">
                    Your thinking profile is currently forming. This view tracks the natural rhythms and patterns of your mind as they emerge over time.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg text-sm text-left w-full text-muted-foreground italic">
                    "We do not learn from experience... we learn from reflecting on experience."
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-secondary-foreground">
                    {profile?.codex_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Thinking Profile
                    </h1>
                    <p className="text-muted-foreground">
                        {profile?.codex_name || "Student"} • {user?.email}
                    </p>
                </div>
            </div>

            {/* Reflections Alert */}
            {pendingReflections > 0 && (
                <Link href="/reflections">
                    <Card className="mb-8 border-l-4 border-l-blue-500 hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Reflections Pending</h3>
                                <p className="text-sm text-muted-foreground">
                                    You have {pendingReflections} active reflection conversations waiting for you.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-3">

                {/* 1. Production Rhythm (Heatmap) */}
                <Card className="col-span-1 md:col-span-3 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" /> Production Rhythm
                        </CardTitle>
                        <CardDescription>Consistency over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {getHeatmapData().map((day, i) => (
                                <div
                                    key={i}
                                    title={`${day.date.toDateString()}: ${day.count} notes`}
                                    className={`w-3 h-3 rounded-sm ${day.count === 0 ? 'bg-muted' :
                                        day.count === 1 ? 'bg-indigo-300 dark:bg-indigo-900' :
                                            day.count < 3 ? 'bg-indigo-500' :
                                                'bg-indigo-700'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">Last 60 days of activity.</p>
                    </CardContent>
                </Card>

                {/* 2. Connection Density */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Network className="h-4 w-4" /> Connection Density
                        </CardTitle>
                        <CardDescription>Interconnectedness of ideas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.connectionDensity.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Average links per note.
                            {metrics.connectionDensity < 0.5 ? " Ideas are mostly isolated." :
                                metrics.connectionDensity < 1.5 ? " Developing a web of thought." :
                                    " Highly interconnected Codex."}
                        </p>
                        <div className="mt-4 text-xs flex gap-4 text-muted-foreground">
                            <span>{metrics.totalNotes} Notes</span>
                            <span>{metrics.connectionCount} Connections</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Volume / Type */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Codex Composition
                        </CardTitle>
                        <CardDescription>Form of your knowledge base</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.permanentCount} <span className="text-sm text-muted-foreground font-normal">Permanent Notes</span></div>
                        <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
                            <div
                                className="bg-primary h-full"
                                style={{ width: metrics.totalNotes > 0 ? `${(metrics.permanentCount / metrics.totalNotes) * 100}%` : '0%' }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {metrics.fleetingCount} items in Fleeting/Inbox.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Revisitation Section */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Rewind className="h-5 w-5 text-indigo-500" />
                            Revisitation & Intellectual Return
                        </CardTitle>
                        <CardDescription>
                            Recent moments where you connected new thinking to established ideas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {metrics.revisits.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-4 italic">
                                No recent revisitations detected. Try linking a new note to an idea from last week.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {metrics.revisits.map((rev, i) => (
                                    <div key={i} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                                        <div className="space-y-1">
                                            <div className="text-sm">
                                                <span className="font-medium text-foreground">{rev.sourceTitle}</span>
                                                <span className="text-muted-foreground mx-2">linked back to</span>
                                                <span className="font-medium text-foreground">{rev.targetTitle}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Original idea was {rev.ageGap} days old.
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
