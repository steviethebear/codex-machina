'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'
import { SimpleTooltip } from '@/components/ui/simple-tooltip'
import { toast } from 'sonner'
import { checkMeaningAsync } from '@/lib/actions/check-meaning-async'
import { MarkdownEditor } from '@/components/markdown/editor'
import { MarkdownRenderer } from '@/components/markdown/renderer'

type Note = Database['public']['Tables']['atomic_notes']['Row']
type Text = Database['public']['Tables']['texts']['Row']

interface CreateNoteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sourceAtom: Note | null
    targetText?: Text | null  // Optional text to link to
    onAtomCreated?: () => void
}

export function CreateNoteDialog({ open, onOpenChange, sourceAtom, targetText, onAtomCreated }: CreateNoteDialogProps) {
    const { user } = useAuth()
    const supabase = createClient()

    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [type, setType] = useState('idea')
    const [relationType, setRelationType] = useState('extends')
    const [explanation, setExplanation] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return // sourceAtom is optional now
        setLoading(true)
        setError(null)

        if (body.length < 50) {
            setError('Atom body must be at least 50 characters.')
            setLoading(false)
            return
        }

        // 1. Create the new atom (no blocking check)
        const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
        if (!charData) {
            setError('Character not found.')
            setLoading(false)
            return
        }
        const char = charData as any

        const { data: newAtom, error: noteError } = await supabase
            .from('atomic_notes')
            // @ts-ignore
            .insert({
                author_id: user.id,
                character_id: char.id,
                title,
                body,
                type: type as any,
                text_id: sourceAtom?.text_id || null // Inherit text context if applicable
            })
            .select()
            .single()

        if (noteError || !newAtom) {
            const msg = noteError?.message || 'Failed to create atom.'
            setError(msg)
            toast.error(msg)
            setLoading(false)
            return
        }

        const atom = newAtom as any

        // 2. Create link to source atom (only if branching)
        if (sourceAtom) {
            // @ts-ignore
            const { error: linkError } = await supabase.from('links').insert({
                from_note_id: sourceAtom.id,
                to_note_id: atom.id,
                relation_type: relationType as any,
                explanation: explanation || `Branched from ${sourceAtom.title}`,
                created_by: user.id
            })

            if (linkError) {
                console.error('Error creating link:', linkError)
            }
        }

        // 3. Create link to target text if specified
        if (targetText) {
            // @ts-ignore
            const { error: textLinkError } = await supabase.from('links').insert({
                from_note_id: atom.id,
                to_text_id: targetText.id,
                relation_type: 'supports' as any,
                explanation: explanation || `Connected to ${targetText.title}`,
                created_by: user.id
            })

            if (textLinkError) {
                console.error('Error creating text link:', textLinkError)
            } else {
                // Award points for text link (1 SP reading)
                // @ts-ignore
                await supabase.from('actions').insert({
                    user_id: user.id,
                    type: 'LINK_NOTE',
                    xp: 0,
                    sp_thinking: 0,
                    sp_reading: 1,
                    description: `Linked atom to text: ${targetText.title}`,
                })

                // Update Character Stats
                if (char) {
                    // @ts-ignore
                    await supabase.from('characters').update({
                        sp_reading: char.sp_reading + 1,
                    }).eq('id', char.id)
                }
            }
        }

        // 3. Success - points will be awarded by async moderation

        setLoading(false)
        setTitle('')
        setBody('')
        setExplanation('')
        toast.success(sourceAtom ? 'Branch created successfully!' : 'Atom created successfully!')
        onOpenChange(false)

        // Trigger async moderation (don't await)
        checkMeaningAsync(atom.id).catch((err) => {
            console.error('Async moderation failed:', err)
        })

        onAtomCreated?.()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader onClose={() => onOpenChange(false)}>
                <DialogTitle>
                    {sourceAtom ? `Branch from: ${sourceAtom.title}` : targetText ? `Create Atom for: ${targetText.title}` : 'Create New Atom'}
                </DialogTitle>
                <DialogDescription>
                    {sourceAtom
                        ? 'Create a new atom that builds upon this idea.'
                        : targetText
                            ? 'Create a new atom linked to this text.'
                            : 'Capture a new idea, question, or insight.'}
                </DialogDescription>
            </DialogHeader>

            {sourceAtom && (
                <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                    <MarkdownRenderer content={sourceAtom.body} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a concise title..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <div className="flex gap-2">
                        {[
                            { id: 'idea', label: 'Idea', desc: 'A raw concept, a hypothesis, or a topic you want to explore.', align: 'start' },
                            { id: 'question', label: 'Question', desc: 'A specific inquiry or doubt to investigate.', align: 'center' },
                            { id: 'insight', label: 'Insight', desc: 'A realization, a conclusion, or a synthesis of multiple ideas.', align: 'center' },
                            { id: 'quote', label: 'Quote', desc: 'A direct citation or reference from a text.', align: 'end' }
                        ].map((t) => (
                            <SimpleTooltip key={t.id} content={t.desc} align={t.align as any}>
                                <button
                                    type="button"
                                    onClick={() => setType(t.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${type === t.id
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-accent text-muted-foreground border-input'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            </SimpleTooltip>
                        ))}
                    </div>
                </div>

                {sourceAtom && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Relation</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={relationType}
                                onChange={(e) => setRelationType(e.target.value)}
                            >
                                <option value="extends">Extends</option>
                                <option value="supports">Supports</option>
                                <option value="questions">Questions</option>
                                <option value="contrasts">Contrasts</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Connection (Optional)</label>
                            <Input
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                placeholder="Why branch here?"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Body</label>
                    <MarkdownEditor
                        value={body}
                        onChange={setBody}
                        placeholder="Your idea, question, or insight... (markdown supported)"
                        minLength={50}
                    />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {sourceAtom ? 'Create Branch' : 'Create Atom'}
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
