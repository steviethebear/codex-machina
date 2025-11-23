'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { Database } from '@/types/database.types'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { MarkdownEditor } from '@/components/markdown/editor'

type Unit = Database['public']['Tables']['units']['Row']

export default function CreateReflectionPage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [units, setUnits] = useState<Unit[]>([])
    const [selectedUnit, setSelectedUnit] = useState('')
    const [body, setBody] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUnits = async () => {
            const { data } = await supabase.from('units').select('*').order('start_date', { ascending: false })
            if (data) setUnits(data)
        }
        fetchUnits()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)
        setError(null)

        if (body.length < 100) {
            setError('Reflection must be at least 100 characters.')
            setLoading(false)
            return
        }

        // Submit Reflection
        // @ts-ignore
        const { error: submitError } = await supabase.from('reflections').insert({
            user_id: user.id,
            unit_id: selectedUnit,
            body
        })

        if (submitError) {
            setError(submitError.message)
            setLoading(false)
            return
        }

        // Award Points
        // +5 XP for submitting reflection
        // +1 SP Writing
        // +1 SP Thinking (if references 2+ notes - simplified check for now)
        // +1 SP Engagement (if references peer note - simplified check)

        const xp = 5
        const spWriting = 1
        let spThinking = 0
        const spEngagement = 0

        // Simple heuristic: check for "note" or "link" in text as proxy for referencing
        if (body.toLowerCase().includes('note') || body.toLowerCase().includes('connect')) {
            spThinking = 1
        }

        // @ts-ignore
        await supabase.from('actions').insert({
            user_id: user.id,
            type: 'REFLECTION',
            xp,
            sp_writing: spWriting,
            sp_thinking: spThinking,
            sp_engagement: spEngagement,
            description: 'Submitted Unit Reflection'
        })

        // Update Character
        const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
        if (charData) {
            const char = charData as any
            // @ts-ignore
            await supabase.from('characters').update({
                xp_total: char.xp_total + xp,
                sp_writing: char.sp_writing + spWriting,
                sp_thinking: char.sp_thinking + spThinking,
                sp_engagement: char.sp_engagement + spEngagement
            }).eq('id', char.id)
        }

        toast.success('Reflection submitted successfully!')
        router.push('/dashboard')
        router.refresh()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Submit Reflection</h2>
                <p className="text-muted-foreground">Synthesize your learning for the unit.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Unit</label>
                    <select
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                    >
                        <option value="">Select a unit...</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>{u.title}</option>
                        ))}
                    </select>
                    {selectedUnit && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Prompt: {units.find(u => u.id === selectedUnit)?.reflection_prompt}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Reflection</label>
                    <MarkdownEditor
                        value={body}
                        onChange={setBody}
                        placeholder="Write your reflection here... (markdown supported)"
                        minLength={100}
                    />
                </div>

                {error && (
                    <div className="text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Reflection
                    </Button>
                </div>
            </form>
        </div>
    )
}
