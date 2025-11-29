'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database } from '@/types/database.types'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

type Character = Database['public']['Tables']['characters']['Row'] & {
    users: { email: string; codex_name: string | null } | null
}

export default function StudentsPage() {
    const supabase = createClient()
    const [students, setStudents] = useState<Character[]>([])
    const [loading, setLoading] = useState(true)

    // Award Form
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
    const [xp, setXp] = useState(0)
    const [spThinking, setSpThinking] = useState(0)
    const [description, setDescription] = useState('')

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('characters')
            .select(`*, users (email, codex_name)`)
            .order('xp_total', { ascending: false })

        if (data) {
            // Deduplicate by user_id
            const uniqueStudents = data.reduce((acc: any[], current: any) => {
                const x = acc.find(item => item.user_id === current.user_id);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);
            setStudents(uniqueStudents as any)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchStudents()
    }, [supabase])

    const handleAward = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStudent) return

        // Log Action
        // @ts-ignore
        const { error: actionError } = await supabase.from('actions').insert({
            user_id: selectedStudent,
            type: 'MANUAL_AWARD',
            xp,
            sp_thinking: spThinking,
            description: description || 'Manual Award'
        })

        if (actionError) {
            toast.error('Failed to log action: ' + actionError.message)
            return
        }

        // Update Character
        const student = students.find(s => s.user_id === selectedStudent)
        if (student) {
            // @ts-ignore
            const { error: updateError } = await supabase.from('characters').update({
                xp_total: (student.xp_total || 0) + xp,
                sp_thinking: (student.sp_thinking || 0) + spThinking
            }).eq('id', student.id)

            if (updateError) {
                toast.error('Failed to update character: ' + updateError.message)
                return
            }
        }

        toast.success('Points awarded successfully')

        // Reset
        setXp(0)
        setSpThinking(0)
        setDescription('')
        setSelectedStudent(null)
        fetchStudents()
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Student Management</h2>
                <p className="text-muted-foreground">Monitor progress and award bonuses.</p>
            </div>

            {selectedStudent && (
                <div className="p-4 border rounded-lg bg-card mb-8">
                    <h3 className="text-lg font-medium mb-4">Award Points</h3>
                    <form onSubmit={handleAward} className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">XP Amount</label>
                            <Input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Thinking SP</label>
                            <Input type="number" value={spThinking} onChange={(e) => setSpThinking(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason</label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Reason for award" />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">Award</Button>
                            <Button type="button" variant="ghost" onClick={() => setSelectedStudent(null)}>Cancel</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Codex Name</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">XP</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Thinking</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {students.map((student) => (
                            <tr key={student.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle font-medium">{student.users?.codex_name || 'Unknown'}</td>
                                <td className="p-4 align-middle text-muted-foreground">{student.users?.email}</td>
                                <td className="p-4 align-middle text-right">{student.xp_total}</td>
                                <td className="p-4 align-middle text-right">{student.sp_thinking}</td>
                                <td className="p-4 align-middle text-right">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student.user_id)}>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Award
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
