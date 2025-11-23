'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'

type Reflection = Database['public']['Tables']['reflections']['Row'] & {
    users: { codex_name: string | null } | null
    units: { title: string } | null
}

export default function AdminReflectionsPage() {
    const supabase = createClient()
    const [reflections, setReflections] = useState<Reflection[]>([])
    const [filteredReflections, setFilteredReflections] = useState<Reflection[]>([])
    const [loading, setLoading] = useState(true)

    // Filter states
    const [students, setStudents] = useState<{ label: string, value: string }[]>([])
    const [units, setUnits] = useState<{ label: string, value: string }[]>([])
    const [selectedStudent, setSelectedStudent] = useState('all')
    const [selectedUnit, setSelectedUnit] = useState('all')

    useEffect(() => {
        const fetchData = async () => {
            // Fetch reflections
            const { data: reflectionsData } = await supabase
                .from('reflections')
                .select(`
          *,
          users (id, codex_name),
          units (id, title)
        `)
                .order('created_at', { ascending: false })

            if (reflectionsData) {
                const refs = reflectionsData as any[]
                setReflections(refs)
                setFilteredReflections(refs)

                // Extract unique students
                const uniqueStudents = Array.from(new Set(refs.map(r => r.users?.id)))
                    .map(id => {
                        const user = refs.find(r => r.users?.id === id)?.users
                        return {
                            label: user?.codex_name || 'Unknown',
                            value: user?.id || 'unknown'
                        }
                    })
                    .filter(s => s.value !== 'unknown')
                    .sort((a, b) => a.label.localeCompare(b.label))

                setStudents([{ label: 'All Students', value: 'all' }, ...uniqueStudents])

                // Extract unique units
                const uniqueUnits = Array.from(new Set(refs.map(r => r.units?.id)))
                    .map(id => {
                        const unit = refs.find(r => r.units?.id === id)?.units
                        return {
                            label: unit?.title || 'Unknown',
                            value: unit?.id || 'unknown'
                        }
                    })
                    .filter(u => u.value !== 'unknown')
                    .sort((a, b) => a.label.localeCompare(b.label))

                setUnits([{ label: 'All Units', value: 'all' }, ...uniqueUnits])
            }
            setLoading(false)
        }

        fetchData()
    }, [supabase])

    // Apply filters
    useEffect(() => {
        let filtered = reflections

        if (selectedStudent !== 'all') {
            filtered = filtered.filter(r => r.user_id === selectedStudent)
        }

        if (selectedUnit !== 'all') {
            filtered = filtered.filter(r => r.unit_id === selectedUnit)
        }

        setFilteredReflections(filtered)
    }, [selectedStudent, selectedUnit, reflections])

    if (loading) return <div className="p-8">Loading reflections...</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reflection Review</h2>
                    <p className="text-muted-foreground">Student reflections by unit.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Combobox
                        options={students}
                        value={selectedStudent}
                        onValueChange={setSelectedStudent}
                        placeholder="Filter by Student"
                        className="w-full sm:w-[200px]"
                    />
                    <Combobox
                        options={units}
                        value={selectedUnit}
                        onValueChange={setSelectedUnit}
                        placeholder="Filter by Unit"
                        className="w-full sm:w-[200px]"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {filteredReflections.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No reflections found matching your filters.</p>
                ) : (
                    filteredReflections.map((reflection) => (
                        <Card key={reflection.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{reflection.units?.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">By {reflection.users?.codex_name || 'Unknown'}</p>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-sm">{reflection.body}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
