'use client'

import { useEffect, useState } from 'react'
import { getClassStats, getCodexCheck, getTeacherAnalytics } from '@/lib/actions/teacher'
import { unlockFeatureForGroup } from '@/lib/actions/unlocks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, FileText, Network, Activity, Database, AlertTriangle, ChevronRight, Calendar, ListChecks } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { getAdminTagTrends } from '@/lib/actions/tags'
import { Tag } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

// Load Graph dynamically
const ForceGraph = dynamic(() => import('@/components/graph/force-graph'), {
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center bg-muted/10">Loading Neural Network...</div>
})

export default function TeacherDashboard() {
    const supabase = createClient()
    const router = useRouter()

    const [stats, setStats] = useState<any>(null)
    const [codexReport, setCodexReport] = useState<any[]>([])
    const [tagTrends, setTagTrends] = useState<any[]>([])
    const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState("14") // Days back

    // SlideOver State
    const [slideOverNote, setSlideOverNote] = useState<any>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const { counts } = await getClassStats()
            if (counts) setStats(counts)

            const { data } = await getCodexCheck(parseInt(dateRange))
            if (data) setCodexReport(data)

            const { graphData } = await getTeacherAnalytics()
            if (graphData) setGraphData(graphData)

            const tagsData = await getAdminTagTrends()
            if (tagsData) setTagTrends(tagsData)

            setLoading(false)
        }
        load()
    }, [dateRange])

    const [sectionFilter, setSectionFilter] = useState('all')
    const [teacherFilter, setTeacherFilter] = useState('all')
    const [needsAttentionFilter, setNeedsAttentionFilter] = useState(false)

    // Derived Data
    // Derived Data
    const students = codexReport.filter(u => !u.is_admin)

    const sections = Array.from(new Set(students.map(s => s.section).filter(Boolean))).sort()
    const teachers = Array.from(new Set(students.map(s => s.teacher).filter(Boolean))).sort()

    const filteredReport = students.filter(s => {
        if (sectionFilter !== 'all' && s.section !== sectionFilter) return false
        if (teacherFilter !== 'all' && s.teacher !== teacherFilter) return false
        if (needsAttentionFilter && !s.isAtRisk) return false
        return true
    })

    const atRiskStudents = students.filter(s => s.isAtRisk)

    if (loading && codexReport.length === 0) return <div className="p-8 flex items-center justify-center h-screen">Initializing Command Center...</div>

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
                        <BulkUnlockDialog
                            sections={sections}
                            teachers={teachers}
                            currentSection={sectionFilter}
                            currentTeacher={teacherFilter}
                        />
                        <AddSourceDialog />
                        <InviteStudentDialog />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                {/* Cohort Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/20 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <ListChecks className="h-4 w-4" />
                        Cohort Filter:
                    </div>

                    <Select value={sectionFilter} onValueChange={setSectionFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="All Teachers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Teachers</SelectItem>
                            {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2 bg-background p-1.5 px-3 rounded-md border">
                        <input
                            type="checkbox"
                            id="needs-attention"
                            checked={needsAttentionFilter}
                            onChange={(e) => setNeedsAttentionFilter(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <label htmlFor="needs-attention" className="text-xs font-medium leading-none cursor-pointer">
                            Needs Attention ({atRiskStudents.length})
                        </label>
                    </div>

                    {(sectionFilter !== 'all' || teacherFilter !== 'all' || needsAttentionFilter) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs ml-auto"
                            onClick={() => {
                                setSectionFilter('all')
                                setTeacherFilter('all')
                                setNeedsAttentionFilter(false)
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </div>

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
                                            <CardTitle className="text-sm font-medium">Support Needed</CardTitle>
                                            <AlertTriangle className={`h-4 w-4 ${atRiskStudents.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                                        </div>
                                    </SimpleTooltip>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${atRiskStudents.length > 0 ? "text-red-500" : ""}`}>{atRiskStudents.length}</div>
                                    <p className="text-xs text-muted-foreground">Check in required</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <SimpleTooltip content="% of active students in selected range">
                                        <div className="flex items-center gap-2 cursor-help">
                                            <CardTitle className="text-sm font-medium">Active Cohort</CardTitle>
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </SimpleTooltip>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {students.length > 0
                                            ? Math.round((students.filter(s => !s.isAtRisk).length / students.length) * 100)
                                            : 0}%
                                    </div>
                                    <p className="text-xs text-muted-foreground">Active in last {dateRange} days</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Emerging Patterns (Tags) */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Emerging Vocab
                                    </CardTitle>
                                    <CardDescription>Top user-generated tags across the cohort.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[200px]">
                                        <div className="flex flex-wrap gap-2">
                                            {tagTrends.length > 0 ? (
                                                tagTrends.map((t) => (
                                                    <Badge key={t.tag} variant="secondary" className="cursor-default hover:bg-secondary/80">
                                                        #{t.tag}
                                                        <span className="ml-1 text-[10px] opacity-50">({t.count})</span>
                                                    </Badge>
                                                ))
                                            ) : (
                                                <div className="text-sm text-muted-foreground italic">No tags detected yet.</div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Placeholder for future insights - keeping grid balanced */}
                            <Card className="md:col-span-2 bg-muted/20 border-dashed">
                                <CardContent className="h-full flex items-center justify-center text-muted-foreground text-sm italic p-6">
                                    More semantic insights coming soon (e.g. Concept Drift)
                                </CardContent>
                            </Card>
                        </div>

                        {/* Codex Check Section */}
                        <Card className="col-span-4">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ListChecks className="h-5 w-5" />
                                        Codex Check
                                    </CardTitle>
                                    <CardDescription>
                                        Formative engagement signals. Not for grading.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <Select value={dateRange} onValueChange={setDateRange}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">Last 7 Days</SelectItem>
                                            <SelectItem value="14">Last 14 Days</SelectItem>
                                            <SelectItem value="30">Last 30 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <table className="w-full caption-bottom text-sm text-left">
                                        <thead className="[&_tr]:border-b bg-muted/50">
                                            <tr className="border-b">
                                                <th className="h-10 px-4 font-medium text-muted-foreground w-[200px]">Student</th>
                                                <th className="h-10 px-4 font-medium text-muted-foreground">Consistency</th>
                                                <th className="h-10 px-4 font-medium text-muted-foreground">Connections</th>
                                                <th className="h-10 px-4 font-medium text-muted-foreground">
                                                    <SimpleTooltip content="Intellectual return across time">
                                                        Revisitation
                                                    </SimpleTooltip>
                                                </th>
                                                <th className="h-10 px-4 font-medium text-muted-foreground text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReport.map((student) => (
                                                <tr key={student.id}
                                                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                                                    onClick={() => router.push(`/admin/student/${student.id}`)}
                                                >
                                                    <td className="p-4 font-medium">
                                                        {student.name}
                                                        <div className="text-xs text-muted-foreground font-normal">{student.email}</div>
                                                        {(student.section || student.teacher) && (
                                                            <div className="flex gap-1 mt-1">
                                                                {student.section && <Badge variant="secondary" className="text-[9px] px-1 py-0">{student.section}</Badge>}
                                                                {student.teacher && <Badge variant="outline" className="text-[9px] px-1 py-0">{student.teacher}</Badge>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-xs text-muted-foreground">
                                                                {student.activeDays} active days / {student.recentNotes} notes
                                                            </div>
                                                            {/* Simple sparkline visualization */}
                                                            <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-indigo-500"
                                                                    style={{ width: `${Math.min((student.activeDays / parseInt(dateRange)) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{student.recentConnections}</span>
                                                            <span className="text-xs text-muted-foreground">({student.density.toFixed(1)}/note)</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {student.revisitationCount > 0 ? (
                                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                                                {student.revisitationCount} Returns
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {student.isAtRisk ? (
                                                            <Badge variant="destructive">Check In</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Active</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                    </TabsContent>

                    <TabsContent value="students">
                        {/* Directory View (similar to Codex Check but distinct list) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Full Directory</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <table className="w-full caption-bottom text-sm text-left">
                                        <tbody>
                                            {codexReport.filter(s => {
                                                if (sectionFilter !== 'all' && s.section !== sectionFilter) return false
                                                if (teacherFilter !== 'all' && s.teacher !== teacherFilter) return false
                                                return true
                                            }).map((student) => (
                                                <tr key={student.id} className="border-b p-4">
                                                    <td className="p-4">
                                                        <div>{student.name}</div>
                                                        {(student.section || student.teacher) && (
                                                            <div className="flex gap-1 mt-1">
                                                                {student.section && <Badge variant="secondary" className="text-[9px] px-1 py-0">{student.section}</Badge>}
                                                                {student.teacher && <Badge variant="outline" className="text-[9px] px-1 py-0">{student.teacher}</Badge>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Link href={`/admin/student/${student.id}`}>
                                                            <Button size="sm" variant="outline">Manage Profile</Button>
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
                        {/* Placeholder for now as Sources are managed at /admin/sources, 
                            but we can instruct user to go there or embed if desired. 
                            For now, let's link to the dedicated page. */}
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="mb-4">Standardized Sources have moved to their own manager.</p>
                                <Link href="/admin/sources">
                                    <Button variant="default">Go to Source Manager</Button>
                                </Link>
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

function BulkUnlockDialog({ sections, teachers, currentSection, currentTeacher }: {
    sections: string[], teachers: string[], currentSection: string, currentTeacher: string
}) {
    const [open, setOpen] = useState(false)
    const [targetType, setTargetType] = useState<'section' | 'teacher'>('section')
    const [targetValue, setTargetValue] = useState('')
    const [feature, setFeature] = useState('smart_connections')
    const [loading, setLoading] = useState(false)

    // Auto-select if filter is active
    useEffect(() => {
        if (open) {
            if (currentSection !== 'all') {
                setTargetType('section')
                setTargetValue(currentSection)
            } else if (currentTeacher !== 'all') {
                setTargetType('teacher')
                setTargetValue(currentTeacher)
            }
        }
    }, [open, currentSection, currentTeacher])

    const handleUnlock = async () => {
        if (!targetValue) {
            toast.error("Please select a target group")
            return
        }

        setLoading(true)
        try {
            const result = await unlockFeatureForGroup(targetType, targetValue, feature)
            toast.success(`Unlocked ${feature} for ${result.count} students in ${targetValue}`)
            setOpen(false)
        } catch (e) {
            console.error(e)
            toast.error("Failed to unlock feature")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <ListChecks className="h-4 w-4 mr-2" />
                    Bulk Unlock
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Feature Unlock</DialogTitle>
                    <DialogDescription>
                        Unlock a capability for an entire Section or Teacher group.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Target Group</Label>
                            <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="section">Section</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Value</Label>
                            <Select value={targetValue} onValueChange={setTargetValue}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {targetType === 'section'
                                        ? sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                                        : teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Feature to Unlock</Label>
                        <Select value={feature} onValueChange={setFeature}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="smart_connections">Smart Connections</SelectItem>
                                <SelectItem value="graph_view">Graph View</SelectItem>
                                <SelectItem value="thinking_profile">Thinking Profile</SelectItem>
                                <SelectItem value="threads">Threads</SelectItem>
                                <SelectItem value="deep_breadcrumbs">Extended Breadcrumbs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleUnlock} disabled={loading}>
                        {loading ? "Unlocking..." : "Unlock for Group"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
