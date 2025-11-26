'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Loader2 } from 'lucide-react'
import { Database } from '@/types/database.types'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { MachineMessages } from '@/lib/machine-messages'
import { checkContentQuality } from '@/lib/actions/check-content-quality'
import { MarkdownEditor } from '@/components/markdown/editor'
import { MarkdownRenderer } from '@/components/markdown/renderer'
import { detectBridgeBuilder } from '@/lib/rewards/bonus-detector'
import { awardBonus, getBonusMessage } from '@/lib/rewards/bonus-awards'
import { checkAchievements } from '@/lib/achievements/tracker'
import { detectBadFaith } from '@/lib/actions/detect-bad-faith'

type Note = Database['public']['Tables']['atomic_notes']['Row']
type Text = Database['public']['Tables']['texts']['Row']

interface LinkDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sourceNote: Note | null
    onLinkCreated?: () => void
}

export function LinkDialog({ open, onOpenChange, sourceNote, onLinkCreated }: LinkDialogProps) {
    const { user } = useAuth()
    const supabase = createClient()

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
        if (open) {
            const fetchData = async () => {
                const { data: notesData } = await supabase
                    .from('atomic_notes')
                    .select('*')
                    .neq('id', sourceNote?.id || '')
                    .eq('hidden', false)
                if (notesData) setNotes(notesData)

                const { data: textsData } = await supabase.from('texts').select('*').eq('archived', false)
                if (textsData) setTexts(textsData)
            }
            fetchData()
        }
    }, [open, sourceNote, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !sourceNote) return
        setLoading(true)
        setError(null)

        if (explanation.length < 40) {
            const msg = 'Explanation must be at least 40 characters.'
            setError(msg)
            toast.error(MachineMessages.insufficientData)
            setLoading(false)
            return
        }

        // Validate explanation using unified quality checker
        const qualityCheck = await checkContentQuality({ body: explanation }, 'link', 40)
        if (!qualityCheck.isValid) {
            const msg = qualityCheck.feedback
            setError(msg)
            toast.error(MachineMessages.insufficientData)
            setLoading(false)
            return
        }

        // Check for bad faith / low-effort content
        const badFaithCheck = await detectBadFaith(explanation, 'link')
        if (badFaithCheck.isBadFaith) {
            const msg = badFaithCheck.feedback
            setError(msg)
            toast.error(badFaithCheck.feedback, {
                description: badFaithCheck.suggestions.join(' • '),
                duration: 8000
            })
            setLoading(false)
            return
        }

        // Create Link
        // @ts-ignore
        const { error: linkError } = await supabase.from('links').insert({
            from_note_id: sourceNote.id,
            to_note_id: targetType === 'note' ? targetNoteId : null,
            to_text_id: targetType === 'text' ? targetTextId : null,
            relation_type: relationType as any,
            explanation,
            created_by: user.id,
        })

        if (linkError) {
            const msg = linkError.message
            setError(msg)
            toast.error(MachineMessages.processingFailed)
            setLoading(false)
            return
        }

        // Award Points
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

        // Update Character Stats
        const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
        if (charData) {
            const char = charData as any
            // @ts-ignore
            await supabase.from('characters').update({
                sp_thinking: char.sp_thinking + spThinking,
                sp_reading: char.sp_reading + spReading,
            }).eq('id', char.id)
        }

        toast.success(MachineMessages.linkCreated)

        // Check for hub status (5+ connections)
        const { checkHubStatus } = await import('@/lib/actions/check-hub-status')
        const sourceHubStatus = await checkHubStatus(sourceNote.id)
        const targetHubStatus = targetNoteId ? await checkHubStatus(targetNoteId) : null

        if (sourceHubStatus.justBecameHub) {
            toast.success("🌟 Your atom has become a hub! +50 XP, +10 Thinking SP")
        }
        if (targetHubStatus?.justBecameHub) {
            toast.success("🌟 Connected atom is now a hub!")
        }

        // Detect and award Bridge Builder bonus
        if (targetType === 'note' && linkData) {
            const bridgeBonus = await detectBridgeBuilder(linkData.id, sourceNote.id, targetNoteId)
            if (bridgeBonus) {
                await awardBonus(user.id, bridgeBonus, linkData.id)
                const message = getBonusMessage(bridgeBonus)
                toast.success(`${message.icon} ${message.title}`, {
                    description: `${message.description} +${bridgeBonus.xp} XP`
                })
            }
        }

        // Check for achievement unlocks
        const unlockedAchievements = await checkAchievements(user.id, 'link_created', { linkId: linkData?.id })
        if (unlockedAchievements.length > 0) {
            unlockedAchievements.forEach(achievement => {
                toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
                    description: `${achievement.description} +${achievement.xp_reward} XP`
                })
            })
        }

        setLoading(false)
        // Reset form
        setTargetNoteId('')
        setTargetTextId('')
        setExplanation('')
        onOpenChange(false)
        onLinkCreated?.()
    }

    if (!sourceNote) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader onClose={() => onOpenChange(false)}>
                <DialogTitle>Create Connection</DialogTitle>
                <DialogDescription>
                    Link <span className="font-semibold text-primary">{sourceNote.title}</span> to another concept.
                </DialogDescription>
            </DialogHeader>

            <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                {sourceNote.body}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Target Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" checked={targetType === 'note'} onChange={() => setTargetType('note')} />
                            Another Atom
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" checked={targetType === 'text'} onChange={() => setTargetType('text')} />
                            Academic Text
                        </label>
                    </div>
                </div>

                {targetType === 'note' ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Atom</label>
                        <Combobox
                            options={notes.map((n) => ({
                                value: n.id,
                                label: n.title,
                                sublabel: n.type,
                            }))}
                            value={targetNoteId}
                            onValueChange={setTargetNoteId}
                            placeholder="Select an atom..."
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
                                sublabel: `${t.author} (${t.type})`,
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
                    <MarkdownEditor
                        value={explanation}
                        onChange={setExplanation}
                        placeholder="Why are these connected? (markdown supported)"
                        minLength={40}
                    />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Link
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
