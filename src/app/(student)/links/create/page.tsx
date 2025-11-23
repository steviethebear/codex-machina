'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'
import { Combobox } from '@/components/ui/combobox'

type Note = Database['public']['Tables']['atomic_notes']['Row']
type Text = Database['public']['Tables']['texts']['Row']

export default function CreateLinkPage() {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const fromId = searchParams.get('fromId')

    const [fromNote, setFromNote] = useState<Note | null>(null)
    const [targetType, setTargetType] = useState<'note' | 'text'>('note')
    const [targetNoteId, setTargetNoteId] = useState('')
    const [targetTextId, setTargetTextId] = useState('')
    const [relationType, setRelationType] = useState('supports')
    const [explanation, setExplanation] = useState('')

    const [notes, setNotes] = useState<Note[]>([])
    const [texts, setTexts] = useState<Text[]>([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            if (fromId) {
                const { data } = await supabase.from('atomic_notes').select('*').eq('id', fromId).single()
                if (data) setFromNote(data)
            }

            const { data: notesData } = await supabase.from('atomic_notes').select('*').neq('id', fromId || '').eq('hidden', false)
            if (notesData) setNotes(notesData)

            const { data: textsData } = await supabase.from('texts').select('*').eq('archived', false)
            if (textsData) setTexts(textsData)
        }
        fetchData()
    }, [fromId, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !fromId) return
        setLoading(true)
        setError(null)

        if (explanation.length < 40) {
            setError('Explanation must be at least 40 characters.')
            setLoading(false)
            return
        }

        // Create Link
        const { error: linkError } = await supabase
            .from('links')
            // @ts-ignore
            .insert({
                from_note_id: fromId,
                to_note_id: targetType === 'note' ? targetNoteId : null,
                to_text_id: targetType === 'text' ? targetTextId : null,
                relation_type: relationType as any,
                explanation,
                created_by: user.id
            })

        if (linkError) {
            setError(linkError.message)
            setLoading(false)
            return
        }

        // Award Points
        // +2 SP Thinking when linking to peer's atom (assume all atoms are peers for now)
        // +1 SP Reading when linking to text
        let spThinking = targetType === 'note' ? 2 : 0
        let spReading = targetType === 'text' ? 1 : 0

        // @ts-ignore
        await supabase.from('actions').insert({
            user_id: user.id,
            type: 'LINK_NOTE',
            xp: 0,
            sp_thinking: spThinking,
            sp_reading: spReading,
            description: `Linked atom to ${targetType === 'note' ? 'atom' : 'text'}`,
        })

        // Update Character Stats (Simplified)
        const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
        if (charData) {
            const char = charData as any
            // @ts-ignore
            await supabase.from('characters').update({
                sp_thinking: char.sp_thinking + spThinking,
                sp_reading: char.sp_reading + spReading
            }).eq('id', char.id)
        }

        router.push(`/notes/${fromId}`)
        router.refresh()
    }

    if (!fromId) return <div className="p-8">Invalid request. Missing source note.</div>
    if (!fromNote) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Create Connection</h2>
                <p className="text-muted-foreground">Link <span className="font-semibold text-primary">{fromNote.title}</span> to another concept.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Target Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" checked={targetType === 'note'} onChange={() => setTargetType('note')} />
                            Another Note
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" checked={targetType === 'text'} onChange={() => setTargetType('text')} />
                            Academic Text
                        </label>
                    </div>
                </div>

                {targetType === 'note' ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Note</label>
                        <Combobox
                            options={notes.map((n) => ({
                                value: n.id,
                                label: n.title,
                                sublabel: n.type
                            }))}
                            value={targetNoteId}
                            onValueChange={setTargetNoteId}
                            placeholder="Select a note..."
                            searchPlaceholder="Search atoms..."
                            emptyText="No atoms found."
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Text</label>
                        <Combobox
                            options={texts.map((t) => ({
                                value: t.id,
                                label: t.title,
                                sublabel: `${t.author} (${t.type})`
                            }))}
                            value={targetTextId}
                            onValueChange={setTargetTextId}
                            placeholder="Select a text..."
                            searchPlaceholder="Search texts..."
                            emptyText="No texts found."
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Relation Type</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={relationType}
                        onChange={(e) => setRelationType(e.target.value)}
                    >
                        <option value="supports">Supports</option>
                        <option value="extends">Extends</option>
                        <option value="questions">Questions</option>
                        <option value="contrasts">Contrasts</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Explanation</label>
                    <textarea
                        required
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Why are these connected?"
                    />
                    <p className="text-xs text-muted-foreground">
                        Minimum length: 40 characters.
                    </p>
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
                        Create Link
                    </Button>
                </div>
            </form>
        </div>
    )
}
