'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownEditor } from '@/components/markdown/editor'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'

type Unit = Database['public']['Tables']['units']['Row']

interface UnitDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    unit?: Unit | null
    onSave: (data: { title: string; start_date: string; end_date: string; reflection_prompt: string | null }) => Promise<void>
}

export function UnitDialog({ open, onOpenChange, unit, onSave }: UnitDialogProps) {
    const [title, setTitle] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reflectionPrompt, setReflectionPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open && unit) {
            // Editing existing unit
            setTitle(unit.title)
            setStartDate(unit.start_date.split('T')[0]) // Extract date part
            setEndDate(unit.end_date.split('T')[0])
            setReflectionPrompt(unit.reflection_prompt || '')
        } else if (open) {
            // Creating new unit
            setTitle('')
            setStartDate('')
            setEndDate('')
            setReflectionPrompt('')
        }
        setError(null)
    }, [open, unit])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Validation
        if (new Date(endDate) <= new Date(startDate)) {
            setError('End date must be after start date')
            setLoading(false)
            return
        }

        try {
            await onSave({
                title,
                start_date: startDate,
                end_date: endDate,
                reflection_prompt: reflectionPrompt || null
            })
            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || 'Failed to save unit')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader onClose={() => onOpenChange(false)}>
                <DialogTitle>{unit ? 'Edit Unit' : 'Create Unit'}</DialogTitle>
                <DialogDescription>
                    {unit ? 'Modify the unit details below.' : 'Create a new curriculum unit with reflection prompts.'}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                        Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Unit 1: Introduction to Critical Thinking"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="start-date" className="text-sm font-medium">
                            Start Date <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="end-date" className="text-sm font-medium">
                            End Date <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="reflection-prompt" className="text-sm font-medium">
                        Reflection Prompt (Optional)
                    </label>
                    <MarkdownEditor
                        value={reflectionPrompt}
                        onChange={setReflectionPrompt}
                        placeholder="What were the key insights from this unit?"
                    />
                </div>

                {error && (
                    <div className="text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {unit ? 'Update Unit' : 'Create Unit'}
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
