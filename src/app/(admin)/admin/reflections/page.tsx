'use client'

import { useEffect, useState } from 'react'
import { getAllReflections, createReflection } from '@/lib/actions/reflections'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquare, Plus, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function AdminReflectionsPage() {
    const supabase = createClient()
    const [reflections, setReflections] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<any[]>([])

    // Dialog State
    const [showDialog, setShowDialog] = useState(false)
    const [context, setContext] = useState('')
    const [selectedStudents, setSelectedStudents] = useState<string[]>([])
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        const load = async () => {
            const [refs, studs] = await Promise.all([
                getAllReflections(),
                supabase.from('users').select('id, email, codex_name').eq('is_admin', false)
            ])
            if (refs.data) setReflections(refs.data)
            if (studs.data) setStudents(studs.data)
            setLoading(false)
        }
        load()
    }, [])

    const handleCreate = async () => {
        if (!context || selectedStudents.length === 0) {
            toast.error("Context and at least one student are required")
            return
        }

        setIsCreating(true)
        try {
            // Create for each selected student
            // Could optimize with Promise.all but let's be safe
            let count = 0
            for (const studentId of selectedStudents) {
                const res = await createReflection(studentId, context)
                if (res.data) count++
            }

            toast.success(`Initiated ${count} reflections`)
            setShowDialog(false)
            setContext('')
            setSelectedStudents([])

            // Refresh list
            const res = await getAllReflections()
            if (res.data) setReflections(res.data)

        } catch (e) {
            console.error(e)
            toast.error("Failed to create reflections")
        }
        setIsCreating(false)
    }

    const toggleStudent = (id: string) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(prev => prev.filter(s => s !== id))
        } else {
            setSelectedStudents(prev => [...prev, id])
        }
    }

    const selectAll = () => {
        if (selectedStudents.length === students.length) setSelectedStudents([])
        else setSelectedStudents(students.map(s => s.id))
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reflections</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor and initiate student reflection conversations.
                    </p>
                </div>
                <Button onClick={() => setShowDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Initiate Reflection
                </Button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Active Interactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {reflections.map((r) => (
                                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                h-8 w-8 rounded-full flex items-center justify-center shrink-0
                                                ${r.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
                                            `}>
                                                {r.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{r.student?.codex_name || r.student?.email}</span>
                                                    <span className="text-muted-foreground mx-1">•</span>
                                                    <span className="text-foreground/90">{r.context}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase">
                                                        {r.status.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })}
                                                    </span>
                                                    <span>
                                                        {(r.messages as any[]).length} turns
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/admin/reflections/${r.id}`}>
                                            <Button variant="ghost" size="sm" className="gap-2">
                                                Review <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                                {reflections.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No reflections found. Initiate one to get started.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Initiate Modal */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Initiate Reflection</DialogTitle>
                        <DialogDescription>
                            Create a new reflection prompt for selected students. The AI will begin the conversation based on your context.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="context">Context / Prompt</Label>
                            <Input
                                id="context"
                                placeholder="e.g. Unit 3: Cybernetics & Systems"
                                value={context}
                                onChange={e => setContext(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">The AI will use this to frame its opening question.</p>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Select Students ({selectedStudents.length})</Label>
                                <Button variant="ghost" size="sm" onClick={selectAll} className="h-auto p-0 text-xs">
                                    {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                            <ScrollArea className="h-[200px] border rounded-md p-2">
                                <div className="space-y-2">
                                    {students.map(student => (
                                        <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-sm">
                                            <Checkbox
                                                id={student.id}
                                                checked={selectedStudents.includes(student.id)}
                                                onCheckedChange={() => toggleStudent(student.id)}
                                            />
                                            <label
                                                htmlFor={student.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                            >
                                                {student.codex_name ? `${student.codex_name} (${student.email})` : student.email}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={false}>
                            {isCreating ? "Initiating..." : `Initiate for ${selectedStudents.length} Students`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
