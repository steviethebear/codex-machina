'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Edit, Trash, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/types/database.types'

type Signal = Database['public']['Tables']['signals']['Row']

export default function SignalsPage() {
    const [signals, setSignals] = useState<Signal[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [currentSignal, setCurrentSignal] = useState<Partial<Signal>>({})

    const supabase = createClient()

    const fetchSignals = async () => {
        const { data, error } = await supabase
            .from('signals')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setSignals(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchSignals()
    }, [])

    const handleSave = async () => {
        if (!currentSignal.title || !currentSignal.description) return

        try {
            if (currentSignal.id) {
                // Update
                const { error } = await supabase
                    .from('signals')
                    .update(currentSignal)
                    .eq('id', currentSignal.id)
                if (error) throw error
                toast.success('Signal updated')
            } else {
                // Create
                const { error } = await supabase
                    .from('signals')
                    .insert(currentSignal)
                if (error) throw error
                toast.success('Signal created')
            }
            setIsEditing(false)
            setCurrentSignal({})
            fetchSignals()
        } catch (error) {
            console.error('Error saving signal:', error)
            toast.error('Failed to save signal')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return
        try {
            const { error } = await supabase
                .from('signals')
                .delete()
                .eq('id', id)
            if (error) throw error
            toast.success('Signal deleted')
            fetchSignals()
        } catch (error) {
            console.error('Error deleting signal:', error)
            toast.error('Failed to delete signal')
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Signal Management</h1>
                <Button onClick={() => {
                    setCurrentSignal({
                        difficulty: 'easy',
                        estimated_time_minutes: 15,
                        xp_reward: 10,
                        sp_thinking: 1,
                        sp_reading: 0,
                        sp_writing: 0,
                        sp_engagement: 0,
                        deliverables: ["Reflection"]
                    })
                    setIsEditing(true)
                }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Signal
                </Button>
            </div>

            {isEditing && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{currentSignal.id ? 'Edit Signal' : 'New Signal'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Title"
                            value={currentSignal.title || ''}
                            onChange={e => setCurrentSignal({ ...currentSignal, title: e.target.value })}
                        />
                        <Textarea
                            placeholder="Description"
                            value={currentSignal.description || ''}
                            onChange={e => setCurrentSignal({ ...currentSignal, description: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Difficulty</label>
                                <select
                                    className="w-full p-2 border rounded-md bg-background"
                                    value={currentSignal.difficulty || 'easy'}
                                    onChange={e => setCurrentSignal({ ...currentSignal, difficulty: e.target.value })}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Est. Time (min)</label>
                                <Input
                                    type="number"
                                    value={currentSignal.estimated_time_minutes || 0}
                                    onChange={e => setCurrentSignal({ ...currentSignal, estimated_time_minutes: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">XP Reward</label>
                                <Input
                                    type="number"
                                    value={currentSignal.xp_reward || 0}
                                    onChange={e => setCurrentSignal({ ...currentSignal, xp_reward: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Thinking SP</label>
                                <Input
                                    type="number"
                                    value={currentSignal.sp_thinking || 0}
                                    onChange={e => setCurrentSignal({ ...currentSignal, sp_thinking: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {signals.map(signal => (
                    <Card key={signal.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{signal.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">{signal.description}</p>
                                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                    <span className="capitalize">{signal.difficulty}</span>
                                    <span>•</span>
                                    <span>{signal.estimated_time_minutes} min</span>
                                    <span>•</span>
                                    <span>{signal.xp_reward} XP</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setCurrentSignal(signal)
                                    setIsEditing(true)
                                }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(signal.id)}>
                                    <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
