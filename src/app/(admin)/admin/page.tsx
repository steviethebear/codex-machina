'use client'

import { useEffect, useState } from 'react'
import { getClassStats, getStudentLeaderboard, getTeacherAnalytics } from '@/lib/actions/teacher'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, FileText, Network, ListChecks, Trophy, AlertTriangle, Activity, UserPlus, ChevronRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { AddSourceDialog } from '@/components/admin/AddSourceDialog'
import { InviteStudentDialog } from '@/components/admin/InviteStudentDialog'
import { SimpleTooltip } from '@/components/ui/simple-tooltip'

import { createClient } from '@/lib/supabase/client'
import { NoteSlideOver } from '@/components/NoteSlideOver'
import { useRouter } from 'next/navigation'
import { generateAllEmbeddings } from '@/lib/actions/admin-ai'
import { toast } from 'sonner'
import { Database } from 'lucide-react'

// Load Graph dynamically
const ForceGraph = dynamic(() => import('@/components/graph/force-graph'), {
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center bg-muted/10">Loading Neural Network...</div>
})

export default function TeacherDashboard() {
    const supabase = createClient()
    const router = useRouter()

    const [stats, setStats] = useState<any>(null)
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)

    // SlideOver State
    const [slideOverNote, setSlideOverNote] = useState<any>(null)

    useEffect(() => {
        const load = async () => {
            const { counts } = await getClassStats()
            if (counts) setStats(counts)

            const { data } = await getStudentLeaderboard()
            if (data) setLeaderboard(data)

            const { graphData } = await getTeacherAnalytics()
            if (graphData) setGraphData(graphData)

            setLoading(false)
        }
        load()
    }, [])

    const atRiskStudents = leaderboard.filter(s => s.isAtRisk)

    if (loading) return <div className="p-8 flex items-center justify-center h-screen">Initializing Assessment Procedures...</div>

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <div className="flex-none p-6 border-b bg-card">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Activity className="h-8 w-8 text-primary" />
                            Command Center
                        </h2>
                        <p className="text-muted-foreground">Real-time class intelligence and intervention monitoring.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={async () => {
                            toast.promise(generateAllEmbeddings(), {
                                loading: 'Regenerating embeddings...',
                                success: (data) => `Generated ${data.count} embeddings (${data.failed} failed)`,
                                error: 'Failed to generate embeddings'
                            })
                        }}>
                            <Database className="h-4 w-4 mr-2" />
                            Reindex
                        </Button>
                        <AddSourceDialog />
                        <InviteStudentDialog />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="students">Directory</TabsTrigger>
                        <TabsTrigger value="sources">Sources</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* KPI Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats?.notes || 0}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Knowledge Connections</CardTitle>
                                    <Network className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-primary">{stats?.connections || 0}</div>
                                </CardContent>
                            </Card>
                            <Card className={atRiskStudents.length > 0 ? "border-red-500/50 bg-red-500/5" : ""}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <SimpleTooltip content="Students inactive for > 7 days or with < 3 notes">
                                        <div className="flex items-center gap-2 cursor-help">
                                            <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
                                            <AlertTriangle className={`h-4 w-4 ${atRiskStudents.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                                        </div>
                                    </SimpleTooltip>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${atRiskStudents.length > 0 ? "text-red-500" : ""}`}>{atRiskStudents.length}</div>
                                    <p className="text-xs text-muted-foreground">Require intervention</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <SimpleTooltip content="Average notes created per active student this week">
                                        <div className="flex items-center gap-2 cursor-help">
                                            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </SimpleTooltip>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">87%</div>
                                    <p className="text-xs text-muted-foreground">Average weekly activity</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Class Knowledge Graph */}
                        <Card className="col-span-4 border-primary/20 bg-card/50 overflow-hidden relative z-0">
                            <CardHeader>
                                <CardTitle>Class Neural Network</CardTitle>
                                <CardDescription>Visualizing the collective intelligence of the cohort. Violet nodes are students, others are public notes.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 h-[400px]">
                                <ForceGraph
                                    data={graphData}
                                    nodeRelSize={6}
                                    onNodeClick={async (node) => {
                                        if (node.type === 'student') {
                                            router.push(`/admin/student/${node.id}`)
                                        } else {
                                            // Fetch Note Content
                                            const { data } = await supabase.from('notes').select('*').eq('id', node.id).single()
                                            if (data) setSlideOverNote(data)
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 relative z-50">
                            {/* At Risk List */}
                            <Card className="col-span-3 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        Intervention Needed
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {atRiskStudents.length === 0 ? (
                                        <div className="text-center p-4 text-muted-foreground">All systems nominal.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {atRiskStudents.map(student => (
                                                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                                    <div>
                                                        <div className="font-semibold">{student.name}</div>
                                                        <div className="text-xs text-red-500">
                                                            {student.daysInactive > 7 ? `${student.daysInactive} days inactive` : 'Low participation'}
                                                        </div>
                                                    </div>
                                                    <Link href={`/admin/student/${student.id}`}>
                                                        <Button size="sm" variant="outline">View</Button>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Top Students */}
                            <Card className="col-span-4 shadow-sm bg-card" style={{ zIndex: 50 }}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-yellow-500" />
                                        Top Contributors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 relative z-50">
                                        {leaderboard.slice(0, 5).map((student, i) => (
                                            <div
                                                key={student.id}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    router.push(`/admin/student/${student.id}`);
                                                }}
                                                className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-accent group relative z-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="font-bold text-muted-foreground w-4">{i + 1}</div>
                                                    <div>
                                                        <div className="font-medium text-foreground group-hover:text-primary transition-colors font-semibold">
                                                            {student.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{student.notes} Notes • {student.connections} Connections</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="secondary">{student.points} XP</Badge>
                                                    <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="students">
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Directory</CardTitle>
                                <CardDescription>Manage student access and view detailed progress.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <table className="w-full caption-bottom text-sm text-left">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Student</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Last Active</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboard.map((student) => (
                                                <tr key={student.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">{student.name} <br /> <span className="text-xs text-muted-foreground font-normal">{student.email}</span></td>
                                                    <td className="p-4 align-middle">{student.daysInactive === 999 ? 'Never' : `${student.daysInactive} days ago`}</td>
                                                    <td className="p-4 align-middle">
                                                        {student.isAtRisk ?
                                                            <Badge variant="destructive">At Risk</Badge> :
                                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                                        }
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Link href={`/admin/student/${student.id}`}>
                                                            <Button size="sm" variant="outline">Manage</Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sources">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Course Resources</CardTitle>
                                    <CardDescription>Manage the library of sources available to students.</CardDescription>
                                </div>
                                <div className="shrink-0">
                                    <AddSourceDialog />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg bg-muted/5 flex flex-col items-center justify-center gap-4">
                                    <div>
                                        <p>Sources added here will appear in the global feed and search.</p>
                                        <p className="text-sm mt-2">Currently showing 0 managed sources.</p>
                                    </div>
                                    <AddSourceDialog />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </ScrollArea>

            <NoteSlideOver
                open={!!slideOverNote}
                note={slideOverNote}
                onClose={() => setSlideOverNote(null)}
                onOpenNote={(n) => window.open(`/notes/${n.id}`, '_blank')}
                onNavigate={(n) => setSlideOverNote(n)}
            />
        </div>
    )
}
