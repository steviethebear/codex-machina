'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Book } from 'lucide-react'
import { Database } from '@/types/database.types'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'
import { SimpleTooltip } from '@/components/ui/simple-tooltip'
import { toast } from 'sonner'
import { checkMeaningAsync } from '@/lib/actions/check-meaning-async'
import { MarkdownEditor } from '@/components/markdown/editor'
import { MarkdownRenderer } from '@/components/markdown/renderer'
import { findRelatedNotes, SuggestionResults } from '@/lib/suggestions'
import { RelatedNotes } from '@/components/related-notes'
import { checkContentQuality, ContentQualityResult } from '@/lib/actions/check-content-quality'
import { QualityFeedbackCard } from '@/components/graph/quality-feedback-card'
import { MachineMessages } from '@/lib/machine-messages'
import { TagInput } from '@/components/notes/tag-input'
import { addTagToNote } from '@/lib/tags/operations'
import { detectTrailblazer, detectScholar, updateStreak, getStreakMultiplier } from '@/lib/rewards/bonus-detector'
import { awardBonus, getBonusMessage } from '@/lib/rewards/bonus-awards'
import { checkAchievements } from '@/lib/achievements/tracker'
import { detectBadFaith } from '@/lib/actions/detect-bad-faith'

type Note = Database['public']['Tables']['atomic_notes']['Row']
type Text = Database['public']['Tables']['texts']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

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

    // Suggestions state
    const [suggestions, setSuggestions] = useState<SuggestionResults>({ notes: [], texts: [] })
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)
    const [selectedSuggestedText, setSelectedSuggestedText] = useState<string | null>(null)
    const [selectedSuggestedNoteIds, setSelectedSuggestedNoteIds] = useState<Set<string>>(new Set())
    const [targetTextId, setTargetTextId] = useState<string | null>(targetText?.id || null)
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])
    // Quality Analysis State
    const [qualityAnalysis, setQualityAnalysis] = useState<ContentQualityResult | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [bypassedQualityCheck, setBypassedQualityCheck] = useState(false)
    const [draftSaved, setDraftSaved] = useState(false)

    // Auto-save key
    const draftKey = sourceAtom ? `draft_atom_branch_${sourceAtom.id}` : targetText ? `draft_atom_text_${targetText.id}` : 'draft_atom_new'

    // Load draft on mount
    useEffect(() => {
        if (open) {
            const savedDraft = localStorage.getItem(draftKey)
            if (savedDraft) {
                try {
                    const { title: savedTitle, body: savedBody } = JSON.parse(savedDraft)
                    if (savedTitle) setTitle(savedTitle)
                    if (savedBody) setBody(savedBody)
                    toast.info('Draft restored')
                } catch (e) {
                    console.error('Failed to parse draft', e)
                }
            }
        }
    }, [open, draftKey])

    // Save draft on change (debounced)
    useEffect(() => {
        if (!open) return

        const timer = setTimeout(() => {
            if (title || body) {
                localStorage.setItem(draftKey, JSON.stringify({ title, body }))
                setDraftSaved(true)
                setTimeout(() => setDraftSaved(false), 2000)
            }
        }, 1000)

        return () => clearTimeout(timer)
    }, [title, body, open, draftKey])

    // Debounced suggestion fetch
    useEffect(() => {
        if (!open || !user || title.length < 3) {
            setSuggestions({ notes: [], texts: [] })
            return
        }

        setSuggestionsLoading(true)
        const timer = setTimeout(async () => {
            const related = await findRelatedNotes({
                title,
                body,
                type,
                textId: sourceAtom?.text_id || targetText?.id,
                excludeId: sourceAtom?.id,
                userId: user.id,
                limit: 5
            })
            setSuggestions(related)
            setSuggestionsLoading(false)
        }, 500) // Debounce 500ms

        return () => clearTimeout(timer)
    }, [title, body, type, open, user, sourceAtom, targetText])

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

        // Quality Check (unless bypassed)
        if (!bypassedQualityCheck) {
            setIsAnalyzing(true)
            try {
                const analysis = await checkContentQuality({ title, body, type }, 'atom', 50)
                setIsAnalyzing(false)

                if (!analysis.isValid || analysis.quality === 'needs_work') {
                    setQualityAnalysis(analysis)
                    setLoading(false)
                    return // Stop submission to show feedback
                }
            } catch (err) {
                console.error('Quality check failed', err)
                setIsAnalyzing(false)
                // Continue with submission if check fails
            }
        }

        // Check for bad faith / low-effort content
        if (user) {
            setIsAnalyzing(true)
            try {
                const badFaithCheck = await detectBadFaith(body, 'atom', { textId: targetText?.id, atomType: type })
                setIsAnalyzing(false)

                if (badFaithCheck.isBadFaith) {
                    // Show Machine feedback
                    toast.error(badFaithCheck.feedback, {
                        description: badFaithCheck.suggestions.join(' • '),
                        duration: 8000
                    })
                    setLoading(false)
                    return // Stop submission
                }
            } catch (err) {
                console.error('Bad faith check failed', err)
                setIsAnalyzing(false)
                // Continue with submission if check fails
            }
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
            toast.error(MachineMessages.processingFailed)
            setLoading(false)
            return
        }

        const atom = newAtom as any

        // Save tags to note
        for (const tag of selectedTags) {
            await addTagToNote(atom.id, tag.id, user.id)
        }

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

        // 4. Create links to selected suggested atoms
        if (selectedSuggestedNoteIds.size > 0) {
            const linkPromises = Array.from(selectedSuggestedNoteIds).map(async (noteId) => {
                // @ts-ignore
                return supabase.from('links').insert({
                    from_note_id: atom.id,
                    to_note_id: noteId,
                    relation_type: 'supports', // Default relation
                    explanation: 'Connected via suggestion',
                    created_by: user.id
                })
            })

            await Promise.all(linkPromises)
        }

        // 3. Create link to target text if specified (from targetText prop or suggestion)
        const textToLink = targetText?.id || selectedSuggestedText
        if (textToLink) {
            // @ts-ignore
            const { error: textLinkError } = await supabase.from('links').insert({
                from_note_id: atom.id,
                to_text_id: textToLink,
                relation_type: 'supports' as any,
                explanation: explanation || 'Connected to suggested text',
                created_by: user.id
            })

            if (textLinkError) {
                console.error('Error linking to text:', textLinkError)
            } else {
                // Award points for text link (1 SP reading)
                // @ts-ignore
                await supabase.from('actions').insert({
                    user_id: user.id,
                    type: 'LINK_NOTE',
                    xp: 0,
                    sp_thinking: 0,
                    sp_reading: 1,
                    description: targetText ? `Linked atom to text: ${targetText.title}` : 'Linked atom to suggested text',
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

        // 5. Award points for Atom Connections (Expansion Bonus)
        // +1 SP Thinking for each connection to another atom (source or suggested)
        const atomConnectionsCount = (sourceAtom ? 1 : 0) + selectedSuggestedNoteIds.size
        if (atomConnectionsCount > 0) {
            const spReward = atomConnectionsCount * 1 // 1 SP per connection

            // @ts-ignore
            await supabase.from('actions').insert({
                user_id: user.id,
                type: 'LINK_NOTE',
                xp: 0,
                sp_thinking: spReward,
                sp_reading: 0,
                description: `Connected atom to ${atomConnectionsCount} other note(s)`,
                target_id: atom.id
            })

            // Update Character Stats
            if (char) {
                // @ts-ignore
                await supabase.from('characters').update({
                    sp_thinking: char.sp_thinking + spReward,
                }).eq('id', char.id)
            }
        }

        // Define quality check based on atom type for SP awarding
        const qualityCheck = {
            category: type === 'question' ? 'question' :
                type === 'insight' ? 'insight' :
                    type === 'quote' ? 'definition' : 'observation',
            score: 1
        }

        // 6. Award SP based on content classification
        // Use the quality check category to determine SP award
        if (qualityCheck && qualityCheck.category) {
            let spReading = 0
            let spThinking = 0
            let spWriting = 0

            switch (qualityCheck.category) {
                case 'question':
                case 'analysis':
                case 'insight':
                    spThinking = 5
                    break
                case 'definition':
                    spWriting = 5
                    break
                case 'citation':
                    spReading = 8 // Base + bonus for engaging with sources
                    break
            }

            // Award to character
            if (char && (spReading > 0 || spThinking > 0 || spWriting > 0)) {
                // @ts-ignore
                await supabase.from('characters').update({
                    sp_reading: char.sp_reading + spReading,
                    sp_thinking: char.sp_thinking + spThinking,
                    sp_writing: char.sp_writing + spWriting,
                }).eq('id', char.id)

                // Log action
                // @ts-ignore
                await supabase.from('actions').insert({
                    user_id: user.id,
                    type: 'CREATE_ATOM',
                    xp: 0,
                    sp_reading: spReading,
                    sp_thinking: spThinking,
                    sp_writing: spWriting,
                    description: `Created ${qualityCheck.category} atom: ${title}`,
                    target_id: atom.id
                })
            }
        }

        // 7. Check for title award
        if (user) {
            const { calculateAndAwardTitle } = await import('@/lib/actions/calculate-title')
            const newTitle = await calculateAndAwardTitle(user.id)
            if (newTitle) {
                toast.success(`🎭 New title earned: ${newTitle}!`)
            }
        }

        // 9. Detect and award bonuses
        const bonuses = []

        // Update streak and get multiplier
        const streakCount = await updateStreak(user.id)
        const streakMultiplier = getStreakMultiplier(streakCount)

        // Detect Trailblazer bonus (first atom for this text)
        const trailblazerBonus = await detectTrailblazer(atom.id, atom.text_id, user.id)
        if (trailblazerBonus) {
            bonuses.push(trailblazerBonus)
            await awardBonus(user.id, trailblazerBonus, atom.id)
        }

        // Detect Scholar bonus (citation-heavy)
        const scholarBonus = detectScholar(body)
        if (scholarBonus) {
            bonuses.push(scholarBonus)
            await awardBonus(user.id, scholarBonus, atom.id)
        }

        // Show bonus notifications
        if (bonuses.length > 0) {
            bonuses.forEach(bonus => {
                const message = getBonusMessage(bonus)
                toast.success(`${message.icon} ${message.title}`, {
                    description: `${message.description} +${bonus.xp} XP`
                })
            })
        }

        // Show streak notification if active
        if (streakCount >= 3) {
            toast.success(`🔥 ${streakCount}-Day Streak!`, {
                description: `${streakMultiplier}x multiplier active`
            })
        }

        // 11. Check for achievement unlocks
        const unlockedAchievements = await checkAchievements(user.id, 'atom_created', { atomId: atom.id })
        if (unlockedAchievements.length > 0) {
            unlockedAchievements.forEach(achievement => {
                toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
                    description: `${achievement.description} +${achievement.xp_reward} XP`
                })
            })
        }

        // 12. Success - additional XP may be awarded by async moderation

        // Clear draft
        localStorage.removeItem(draftKey)

        setLoading(false)
        setTitle('')
        setBody('')
        setExplanation('')
        setSelectedTags([])
        toast.success(sourceAtom ? MachineMessages.atomBranched : MachineMessages.atomCreated)
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
                    <div className="flex items-center gap-2">
                        {sourceAtom ? `Branch from: ${sourceAtom.title}` : targetText ? `Create Atom for: ${targetText.title}` : 'Create New Atom'}
                        {draftSaved && <span className="text-xs font-normal text-muted-foreground animate-pulse">(Draft saved)</span>}
                    </div>
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

                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags (Optional)</label>
                    {user && (
                        <TagInput
                            selectedTags={selectedTags}
                            onTagsChange={setSelectedTags}
                            userId={user.id}
                            placeholder="Add tags to organize your atom..."
                        />
                    )}
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                {/* Related Notes Suggestions */}
                {title.length >= 3 && (
                    <div className="pt-4 border-t">
                        {targetText && (
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                    <Book className="h-4 w-4" />
                                    Linking to: {targetText.title}
                                </div>
                            </div>
                        )}
                        {selectedSuggestedText && (
                            <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs flex items-center justify-between">
                                <span className="text-blue-600 dark:text-blue-400 font-medium">✓ Text selected from suggestions</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setSelectedSuggestedText(null)}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                        {selectedSuggestedNoteIds.size > 0 && (
                            <div className="mb-3 p-2 bg-primary/10 border border-primary/30 rounded text-xs flex items-center justify-between">
                                <span className="text-primary font-medium">✓ {selectedSuggestedNoteIds.size} atom(s) selected to connect</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setSelectedSuggestedNoteIds(new Set())}
                                >
                                    Clear All
                                </Button>
                            </div>
                        )}
                        <RelatedNotes
                            suggestions={suggestions}
                            loading={suggestionsLoading}
                            onTextClick={(textId) => {
                                setSelectedSuggestedText(textId)
                                toast.success(MachineMessages.textSelected)
                            }}
                            onQuickLink={(noteId) => {
                                const newSet = new Set(selectedSuggestedNoteIds)
                                if (newSet.has(noteId)) {
                                    newSet.delete(noteId)
                                    toast.info('Connection removed')
                                } else {
                                    newSet.add(noteId)
                                    toast.success(MachineMessages.atomSelected)
                                }
                                setSelectedSuggestedNoteIds(newSet)
                            }}
                            selectedNoteIds={selectedSuggestedNoteIds}
                        />
                    </div>
                )}

                {/* Quality Feedback Overlay */}
                {qualityAnalysis && (qualityAnalysis.quality === 'needs_work' || qualityAnalysis.quality === 'good') && (
                    <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                        <QualityFeedbackCard analysis={qualityAnalysis} />
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    {qualityAnalysis && (qualityAnalysis.quality === 'needs_work' || qualityAnalysis.quality === 'good') ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => {
                                setQualityAnalysis(null) // Clear feedback to let them edit
                            }}>
                                Revise
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={(e) => {
                                    setBypassedQualityCheck(true)
                                    handleSubmit(e)
                                }}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Anyway'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || isAnalyzing}>
                                {loading || isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Atom'}
                            </Button>
                        </>
                    )}
                </div>
            </form>
        </Dialog>
    )
}
