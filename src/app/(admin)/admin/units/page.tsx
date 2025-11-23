'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Unit = Database['public']['Tables']['units']['Row']

export default function AdminUnitsPage() {
    const supabase = createClient()
    const [units, setUnits] = useState<Unit[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUnits = async () => {
            const { data } = await supabase
                .from('units')
                .select('*')
                .order('start_date', { ascending: false })

            if (data) setUnits(data)
            setLoading(false)
        }

        fetchUnits()
    }, [supabase])

    if (loading) return <div className="p-8">Loading units...</div>

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Units</h2>
                <p className="text-muted-foreground">Manage curriculum units.</p>
            </div>

            <div className="grid gap-4">
                {units.length === 0 ? (
                    <p className="text-muted-foreground">No units found.</p>
                ) : (
                    units.map((unit) => (
                        <Card key={unit.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{unit.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(unit.start_date).toLocaleDateString()} - {new Date(unit.end_date).toLocaleDateString()}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Prompt: {unit.reflection_prompt || 'None'}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
