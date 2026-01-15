'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClassAssessment } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, BarChart3, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Simple Sparkline Component
const Sparkline = ({ data }: { data: { count: number }[] }) => {
    const max = Math.max(...data.map(d => d.count), 5) // At least 5 scale
    if (data.length === 0) return null
    return (
        <div className="flex items-end gap-[2px] h-8 w-24">
            {data.map((d, i) => (
                <div
                    key={i}
                    className={`flex-1 rounded-sm ${d.count > 0 ? (d.count > 3 ? 'bg-emerald-500' : 'bg-emerald-300') : 'bg-muted'}`}
                    style={{ height: `${(d.count / max) * 100}%` }}
                    title={`Day ${i + 1}: ${d.count} notes`}
                />
            ))}
        </div>
    )
}

export default function AssessmentPage() {
    const router = useRouter()
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [sectionFilter, setSectionFilter] = useState('all')
    const [teacherFilter, setTeacherFilter] = useState('all')
    const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'all'>('7d')
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadData()
    }, [sectionFilter, teacherFilter, dateRange])

    const loadData = async () => {
        setLoading(true)
        const sFilter = sectionFilter === 'all' ? undefined : sectionFilter
        const tFilter = teacherFilter === 'all' ? undefined : teacherFilter
        const data = await getClassAssessment(sFilter, tFilter, dateRange)
        setStudents(data)
        setLoading(false)
    }

    const filteredStudents = students.filter(s =>
        s.codex_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    )

    // Extract unique options
    // Note: This only shows options from the *current result set*.
    // Ideally we'd fetch all unique values cleanly, but for now this works with "All" reset.
    const sections = Array.from(new Set(students.map(s => s.class_section).filter(Boolean)))
    const teachers = Array.from(new Set(students.map(s => s.teacher).filter(Boolean)))

    return (
        <div className="flex flex-col h-full bg-background p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Class Assessment</h2>
                    <p className="text-muted-foreground">Rubric-based grading view for Codex Consistency & Connections.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Filter Controls */}
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search student..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Rubric Legend */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">4 Points</Badge>
                    <span className="text-muted-foreground">&gt; 50% Active Days (e.g. 4/7)</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="default">3 Points</Badge>
                    <span className="text-muted-foreground">&gt; 25% Active Days (e.g. 2/7)</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">2 Points</Badge>
                    <span className="text-muted-foreground">Low Frequency</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline">1 Point</Badge>
                    <span className="text-muted-foreground">Inactive (0 Days)</span>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>Gradebook</CardTitle>
                        <div className="flex gap-2">
                            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="14d">Last 14 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Teachers</SelectItem>
                                    {teachers.map((t: any) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sectionFilter} onValueChange={setSectionFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Section" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map((s: any) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/20">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Student</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Stats</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Consistency ({dateRange})</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Connectivity</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Rubric Score</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Rationale</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="border-b">
                                            <td colSpan={7} className="p-4"><Skeleton className="h-8 w-full" /></td>
                                        </tr>
                                    ))
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">No students found.</td>
                                    </tr>
                                ) : (
                                    filteredStudents.map(student => {
                                        const score = student.stats.connectivityScore
                                        return (
                                            <tr
                                                key={student.id}
                                                className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                                                onClick={() => router.push(`/admin/student/${student.id}?view=assessment`)}
                                            >
                                                <td className="p-4 align-middle font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="text-base">{student.codex_name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {student.class_section} • {student.teacher}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-col text-xs text-muted-foreground">
                                                        <span>{student.stats.totalNotes} Notes</span>
                                                        <span>{student.stats.notesWithLinks} Connected</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-col gap-1">
                                                        <Sparkline data={student.stats.activity} />
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Active: <strong>{student.stats.activeDaysCount}</strong> / {student.stats.periodDays} days
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-secondary rounded-full h-2 w-24 overflow-hidden">
                                                            <div
                                                                className="bg-blue-500 h-full"
                                                                style={{ width: `${student.stats.totalNotes > 0 ? (student.stats.notesWithLinks / student.stats.totalNotes) * 100 : 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs">
                                                            {student.stats.totalNotes > 0 ? Math.round((student.stats.notesWithLinks / student.stats.totalNotes) * 100) : 0}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={score >= 3 ? 'default' : score === 2 ? 'secondary' : 'outline'} className={
                                                        score === 4 ? "bg-emerald-500 hover:bg-emerald-600" : ""
                                                    }>
                                                        {score} / 4 Points
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-xs text-muted-foreground">
                                                    {student.stats.rationale}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <Button variant="ghost" size="sm">
                                                        Review <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
