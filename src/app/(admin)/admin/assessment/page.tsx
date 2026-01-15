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
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadData()
    }, [sectionFilter])

    const loadData = async () => {
        setLoading(true)
        const data = await getClassAssessment(sectionFilter === 'all' ? undefined : sectionFilter)
        setStudents(data)
        setLoading(false)
    }

    const filteredStudents = students.filter(s =>
        s.codex_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    )

    // Extract unique sections for filter
    const sections = Array.from(new Set(students.map(s => s.class_section).filter(Boolean)))

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

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>Gradebook</CardTitle>
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
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 bg-muted/20">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Student</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Stats</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Consistency (14d)</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Connectivity</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Rubric Score</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="border-b">
                                            <td colSpan={6} className="p-4"><Skeleton className="h-8 w-full" /></td>
                                        </tr>
                                    ))
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">No students found.</td>
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
                                                        <span className="text-xs text-muted-foreground">{student.class_section}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-col text-xs text-muted-foreground">
                                                        <span>{student.stats.totalNotes} Notes</span>
                                                        <span>{student.stats.notesWithLinks} Connected</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Sparkline data={student.stats.activity} />
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
