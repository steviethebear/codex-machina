'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Edit, Trash } from 'lucide-react'
import { UnitDialog } from '@/components/admin/unit-dialog'
import { toast } from 'sonner'

type Unit = Database['public']['Tables']['units']['Row']

export default function AdminUnitsPage() {
    const supabase = createClient()
    const [units, setUnits] = useState<Unit[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

    const fetchUnits = async () => {
        const { data } = await supabase
            .from('units')
            .select('*')
            .order('start_date', { ascending: false })

        if (data) setUnits(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchUnits()
    }, [supabase])

    const handleSave = async (data: { title: string; start_date: string; end_date: string; reflection_prompt: string | null }) => {
        if (selectedUnit) {
            // Update existing unit
            const { error } = await supabase
                .from('units')
                .update(data)
                .eq('id', selectedUnit.id)

            if (error) throw error
            toast.success('Unit updated successfully')
        } else {
            // Create new unit
            const { error } = await supabase
                .from('units')
                .insert([data])

            if (error) throw error
            toast.success('Unit created successfully')
        }

        fetchUnits()
    }

    const handleDelete = async (unitId: string) => {
        if (!confirm('Are you sure you want to delete this unit?')) return

        const { error } = await supabase
            .from('units')
            .delete()
            .eq('id', unitId)

        if (error) {
            toast.error('Failed to delete unit')
        } else {
            toast.success('Unit deleted')
            fetchUnits()
        }
    }

    if (loading) return <div className="p-8">Loading units...</div>

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Units</h2>
                    <p className="text-muted-foreground">Manage curriculum units and reflection prompts.</p>
                </div>
                <Button onClick={() => {
                    setSelectedUnit(null)
                    setDialogOpen(true)
                }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Unit
                </Button>
            </div>

            <div className="grid gap-4">
                {units.length === 0 ? (
                    <p className="text-muted-foreground">No units found. Create your first unit to get started.</p>
                ) : (
                    units.map((unit) => (
                        <Card key={unit.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{unit.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {new Date(unit.start_date).toLocaleDateString()} - {new Date(unit.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedUnit(unit)
                                                setDialogOpen(true)
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(unit.id)}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {unit.reflection_prompt && (
                                <CardContent>
                                    <p className="text-sm font-medium mb-1">Reflection Prompt:</p>
                                    <p className="text-sm text-muted-foreground">{unit.reflection_prompt}</p>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>

            <UnitDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                unit={selectedUnit}
                onSave={handleSave}
            />
        </div>
    )
}
