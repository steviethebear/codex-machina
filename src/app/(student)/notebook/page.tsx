'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Database } from '@/types/database.types'
import { MarkdownRenderer } from '@/components/markdown/renderer'
import { ChevronRight, Search, Hash, Calendar, ArrowRight, ArrowLeft, Edit, Link as LinkIcon, Book, PlusCircle, Network, Trash, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/command-palette'
import ForceGraph from '@/components/graph/force-graph'
import { useSearchParams } from 'next/navigation'
import { detectBridgeBuilder } from '@/lib/rewards/bonus-detector'
import { awardBonus, getBonusMessage } from '@/lib/rewards/bonus-awards'
import { checkAchievements } from '@/lib/achievements/tracker'
import { toast } from 'sonner'
import { MeaningFeedbackBanner } from '@/components/notebook/meaning-feedback-banner'
import { SPCategorySelector, SPCategory } from '@/components/notebook/sp-category-selector'
import { LinkingModal } from '@/components/notebook/linking-modal'
import { checkMeaningAsync } from '@/lib/actions/check-meaning-async'
import { SuggestionsPanel } from '@/components/notebook/suggestions-panel'
import { SuggestionNote } from '@/lib/llm/get-suggestions'
import { detectHubsFromLink } from '@/lib/rewards/hub-detector'
import { NoteXPDisplay } from '@/components/notebook/note-xp-display'

type Tag = Database['public']['Tables']['tags']['Row']
type Note = Database['public']['Tables']['atomic_notes']['Row'] & {
    users?: { codex_name: string | null } | null
    tags?: Tag[]
    texts?: { title: string } | null
}

type LinkType = {
    id: string
    to_note_id?: string
    from_note_id?: string
    atomic_notes_links_to_note_id_fkey?: Note | null
    atomic_notes_links_from_note_id_fkey?: Note | null
    texts?: { id: string, title: string, author: string } | null
}

type TextLink = {
    id: string
    title: string
    author: string
}

export default function NotebookPage() {
    const searchParams = useSearchParams()
    const noteIdParam = searchParams.get('noteId')
    const { user } = useAuth()
    const supabase = createClient()
    const [allNotes, setAllNotes] = useState<Note[]>([])
    const [texts, setTexts] = useState<{ id: string; title: string }[]>([])
    const [noteLinks, setNoteLinks] = useState<Map<string, { outgoing: Note[], incoming: Note[], texts: TextLink[] }>>(new Map())
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'date' | 'text' | 'type'>('date')
    const [loading, setLoading] = useState(true)
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null)
    const [submissionFilter, setSubmissionFilter] = useState<'pending' | 'approved' | 'rejected' | null>(null)
    const [showTagsSection, setShowTagsSection] = useState(true)
    const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false)


    // Inline creation state
    const [isCreatingNote, setIsCreatingNote] = useState(false)
    const [newNoteTitle, setNewNoteTitle] = useState('')
    const [newNoteBody, setNewNoteBody] = useState('')
    const [newNoteType, setNewNoteType] = useState<'idea' | 'question' | 'text'>('idea')
    const [newNoteTags, setNewNoteTags] = useState<Tag[]>([])
    const [isSavingNewNote, setIsSavingNewNote] = useState(false)

    // Inline editing state
    const [isEditingNote, setIsEditingNote] = useState(false)
    const [editedTitle, setEditedTitle] = useState('')
    const [editedBody, setEditedBody] = useState('')
    const [editedTags, setEditedTags] = useState<string[]>([]) // Combined title + body as markdown
    const [isSavingEdit, setIsSavingEdit] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    // Editor refs
    const editorRef = useRef<HTMLTextAreaElement>(null)
    const titleInputRef = useRef<HTMLTextAreaElement>(null)
    const newAtomRef = useRef<HTMLDivElement>(null)

    // v0.3 state
    const [charCount, setCharCount] = useState(0)
    const [spCategory, setSpCategory] = useState<SPCategory>('thinking')
    const [inferredSPCategory, setInferredSPCategory] = useState<SPCategory>('thinking')
    const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false)
    const [meaningCheckStatus, setMeaningCheckStatus] = useState<'approved' | 'pending' | 'rejected' | null>(null)
    const [meaningCheckResult, setMeaningCheckResult] = useState<string | null>(null)
    const [lastAwards, setLastAwards] = useState<{ xp: number, sp: { thinking: number, reading: number, writing: number, engagement: number } } | undefined>(undefined)
    const [creationAction, setCreationAction] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // v0.3.2 state - Suggestions Panel
    const [isSuggestionsPanelOpen, setIsSuggestionsPanelOpen] = useState(false) // Closed by default
    const [suggestionTargetNote, setSuggestionTargetNote] = useState<{ id: string, title: string } | null>(null)

    useEffect(() => {
        const fetchNotebook = async () => {
            if (!user) return

            // Fetch user's atoms with tags
            const { data: notesData } = await supabase
                .from('atomic_notes')
                .select(`
                    *,
                    users:users!atomic_notes_author_id_fkey(codex_name),
                    note_tags!note_tags_note_id_fkey(
                        tags(id, name, display_name, usage_count)
                    ),
                    texts:texts(title)
                `)
                .eq('author_id', user.id)
                .order('created_at', { ascending: false })

            let typedNotes: Note[] = []

            if (notesData) {
                // Transform note_tags array to tags array
                typedNotes = notesData.map((note: any) => ({
                    ...note,
                    tags: note.note_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
                }))
                setAllNotes(typedNotes)

                if (typedNotes.length > 0 && !selectedNote) {
                    setSelectedNote(typedNotes[0])
                }
            }

            // Fetch all texts
            const { data: textsData } = await supabase
                .from('texts')
                .select('id, title')
                .order('title')

            if (textsData) {
                setTexts(textsData)
            }

            // Fetch links for each note
            const linksMap = new Map<string, { outgoing: Note[], incoming: Note[], texts: TextLink[] }>()
            for (const note of typedNotes) {
                const { data: links } = await supabase
                    .from('links')
                    .select(`
                            id,
                            to_note_id,
                            from_note_id,
                            to_text_id,
                            atomic_notes_links_to_note_id_fkey:atomic_notes!links_to_note_id_fkey(*),
                            atomic_notes_links_from_note_id_fkey:atomic_notes!links_from_note_id_fkey(*),
                            texts:texts(*)
                        `)
                    .or(`from_note_id.eq.${note.id},to_note_id.eq.${note.id}`)

                if (links) {
                    const outgoing: Note[] = []
                    const incoming: Note[] = []
                    const texts: TextLink[] = []

                    links.forEach((link: any) => {
                        if (link.from_note_id === note.id && link.atomic_notes_links_to_note_id_fkey) {
                            outgoing.push(link.atomic_notes_links_to_note_id_fkey)
                        } else if (link.to_note_id === note.id && link.atomic_notes_links_from_note_id_fkey) {
                            incoming.push(link.atomic_notes_links_from_note_id_fkey)
                        } else if (link.from_note_id === note.id && link.texts) {
                            texts.push(link.texts)
                        }
                    })
                    linksMap.set(note.id, { outgoing, incoming, texts })
                }
            }
            setNoteLinks(linksMap)
            setLoading(false)
        }

        fetchNotebook()
    }, [user, supabase])

    // Handle noteId query param


    const refreshNotebook = () => {
        // Reload all notes and links
        const fetchUpdatedNotebook = async () => {
            if (!user) return

            const { data: notesData } = await supabase
                .from('atomic_notes')
                .select('*, users:users!atomic_notes_author_id_fkey(codex_name), note_tags!note_tags_note_id_fkey(tags(id, name, display_name, usage_count)), texts:texts(title)')
                .eq('author_id', user.id)
                .in('moderation_status', ['approved', 'draft', 'pending'])
                .order('created_at', { ascending: false })

            if (notesData) {
                // Transform note_tags array to tags array
                const typedNotes = notesData.map((note: any) => ({
                    ...note,
                    tags: note.note_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
                }))
                setAllNotes(typedNotes)
                // Keep selected note or select first
                if (selectedNote) {
                    const updatedSelected = typedNotes.find(n => n.id === selectedNote.id)
                    if (updatedSelected) {
                        setSelectedNote(updatedSelected)
                    } else if (typedNotes.length > 0) {
                        setSelectedNote(typedNotes[0])
                    }
                } else if (typedNotes.length > 0) {
                    setSelectedNote(typedNotes[0])
                }

                // Refresh links
                const linksMap = new Map<string, { outgoing: Note[], incoming: Note[], texts: TextLink[] }>()
                for (const note of typedNotes) {
                    const { data: links } = await supabase
                        .from('links')
                        .select(`
                            id,
                            to_note_id,
                            from_note_id,
                            to_text_id,
                            atomic_notes_links_to_note_id_fkey:atomic_notes!links_to_note_id_fkey(*),
                            atomic_notes_links_from_note_id_fkey:atomic_notes!links_from_note_id_fkey(*),
                            texts:texts(*)
                        `)
                        .or(`from_note_id.eq.${note.id},to_note_id.eq.${note.id}`)

                    if (links) {
                        const outgoing: Note[] = []
                        const incoming: Note[] = []
                        const texts: TextLink[] = []

                        links.forEach((link: any) => {
                            if (link.from_note_id === note.id && link.atomic_notes_links_to_note_id_fkey) {
                                outgoing.push(link.atomic_notes_links_to_note_id_fkey)
                            } else if (link.to_note_id === note.id && link.atomic_notes_links_from_note_id_fkey) {
                                incoming.push(link.atomic_notes_links_from_note_id_fkey)
                            } else if (link.from_note_id === note.id && link.texts) {
                                texts.push(link.texts)
                            }
                        })
                        linksMap.set(note.id, { outgoing, incoming, texts })
                    }
                }
                setNoteLinks(linksMap)
            }
        }
        fetchUpdatedNotebook()
    }

    const refreshNote = () => {
        // Reload the selected note and links
        if (selectedNote) {
            const fetchUpdatedNote = async () => {
                const { data } = await supabase
                    .from('atomic_notes')
                    .select('*, users:users!atomic_notes_author_id_fkey(codex_name), texts:texts(title)')
                    .eq('id', selectedNote.id)
                    .single()

                if (data) {
                    const updatedNote = data as any
                    setSelectedNote(updatedNote)
                    // Update in the notes list too
                    setAllNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
                    setAllNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))

                    // Fetch updated links
                    const { data: links } = await supabase
                        .from('links')
                        .select(`
                            id,
                            to_note_id,
                            from_note_id,
                            to_text_id,
                            atomic_notes_links_to_note_id_fkey:atomic_notes!links_to_note_id_fkey(*),
                            atomic_notes_links_from_note_id_fkey:atomic_notes!links_from_note_id_fkey(*),
                            texts:texts(*)
                        `)
                        .or(`from_note_id.eq.${updatedNote.id},to_note_id.eq.${updatedNote.id}`)

                    if (links) {
                        const outgoing: Note[] = []
                        const incoming: Note[] = []
                        const texts: TextLink[] = []

                        links.forEach((link: any) => {
                            if (link.from_note_id === updatedNote.id && link.atomic_notes_links_to_note_id_fkey) {
                                outgoing.push(link.atomic_notes_links_to_note_id_fkey)
                            } else if (link.to_note_id === updatedNote.id && link.atomic_notes_links_from_note_id_fkey) {
                                incoming.push(link.atomic_notes_links_from_note_id_fkey)
                            } else if (link.from_note_id === updatedNote.id && link.texts) {
                                texts.push(link.texts)
                            }
                        })

                        setNoteLinks(prev => {
                            const newMap = new Map(prev)
                            newMap.set(updatedNote.id, { outgoing, incoming, texts })
                            return newMap
                        })
                    }
                }
            }
            fetchUpdatedNote()
        }
    }

    const handleCreateNote = async () => {
        if (!user) return

        try {
            // Get character data
            const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
            if (!charData) {
                alert('Character not found')
                return
            }

            // Create a new blank note with markdown template
            const blankContent = ''
            const { data: newNote, error } = await supabase
                .from('atomic_notes')
                .insert({
                    author_id: user.id,
                    character_id: charData.id,
                    title: 'Untitled Note',
                    body: blankContent,
                    type: 'idea',
                    text_id: null,
                    moderation_status: 'draft'
                } as any)
                .select('*, users:users!atomic_notes_author_id_fkey(codex_name), note_tags!note_tags_note_id_fkey(tags(id, name, display_name, usage_count))')
                .single()

            if (error || !newNote) {
                console.error('Error creating note:', error)
                alert('Failed to create note')
                return
            }

            // Transform note to include tags array
            const transformedNote = {
                ...newNote,
                tags: (newNote as any).note_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
            }

            // Add to notes list and immediately select it for editing
            setAllNotes(prev => [transformedNote, ...prev])
            setAllNotes(prev => [transformedNote, ...prev])
            setSelectedNote(transformedNote)
            setIsCreatingNote(false)
        } catch (err) {
            console.error('Error creating note:', err)
            alert('Failed to create note')
        }
    }

    const handleAnswerQuestion = async () => {
        if (!user || !selectedNote || selectedNote.type !== 'question') return

        setIsAnsweringQuestion(true)

        try {
            // Get character data
            const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
            if (!charData) {
                alert('Character not found')
                setIsAnsweringQuestion(false)
                return
            }

            // Create answer note
            const { data: answerNote, error: noteError } = await supabase
                .from('atomic_notes')
                .insert({
                    author_id: user.id,
                    character_id: charData.id,
                    title: `Answer to: ${selectedNote.title}`,
                    body: '# Answer\n\n',
                    type: 'idea',
                    text_id: null,
                    moderation_status: 'draft'
                } as any)
                .select('*')
                .single()

            if (noteError || !answerNote) {
                alert('Failed to create answer')
                setIsAnsweringQuestion(false)
                return
            }

            // Create link from answer to question
            const { error: linkError } = await supabase
                .from('links')
                .insert({
                    from_note_id: answerNote.id,
                    to_note_id: selectedNote.id,
                    relation_type: 'answer',
                    created_by: user.id,
                    explanation: 'Answer to question'
                })

            if (linkError) {
                console.error('Failed to create link:', linkError)
                console.error('Link error details:', JSON.stringify(linkError, null, 2))
                // Don't block on link errors, just log them
            }

            // Refresh notes and select the new answer
            await refreshNotebook()
            const updatedNote = allNotes.find(n => n.id === answerNote.id)
            if (updatedNote) {
                setSelectedNote(updatedNote as any)
            }
        } catch (err) {
            console.error('Error creating answer:', err)
            alert('Failed to create answer')
        } finally {
            setIsAnsweringQuestion(false)
        }
    }

    const handleDeleteNote = async () => {
        if (!selectedNote || !user) return

        if (!confirm(`Delete "${selectedNote.title}"? This cannot be undone.`)) return

        // Store the ID before we start deletion
        const noteIdToDelete = selectedNote.id

        try {
            // Immediately disable editing to prevent autosave from firing
            setIsEditingNote(false)
            setSelectedNote(null)

            console.log('Attempting to delete note:', noteIdToDelete)

            const { data, error } = await supabase
                .from('atomic_notes')
                .delete()
                .eq('id', noteIdToDelete)
                .select() // Add select to see what was deleted

            console.log('Delete result:', { data, error })

            if (error) {
                console.error('Delete error details:', JSON.stringify(error, null, 2))
                alert(`Failed to delete note: ${error.message}`)
                // Restore the note in the UI since delete failed
                const restoredNote = allNotes.find(n => n.id === noteIdToDelete)
                if (restoredNote) {
                    setSelectedNote(restoredNote)
                    setIsEditingNote(true)
                }
                return
            }

            if (!data || data.length === 0) {
                console.warn('No rows deleted - note may not exist or RLS policy blocking')
                alert('Note could not be deleted. It may have already been deleted or you may not have permission.')
                return
            }

            console.log('Successfully deleted note:', noteIdToDelete)

            // Remove from local state
            setAllNotes(prev => prev.filter(n => n.id !== noteIdToDelete))
            setAllNotes(prev => prev.filter(n => n.id !== noteIdToDelete))
        } catch (err) {
            console.error('[Delete Note] Error deleting note:', err)
            // Assuming 'toast' is defined elsewhere, if not, this would cause an error.
            // Keeping it as per the user's provided change.
            // If toast is not defined, it should be `alert('Failed to delete note')`
            // or `console.error('Failed to delete note')`
            // For now, faithfully applying the change.
            // @ts-ignore
            toast.error('Failed to delete note')
        }
    }

    // v0.3.2: Handle connect from suggestions panel
    const handleConnectFromSuggestion = (suggestion: SuggestionNote) => {
        setSuggestionTargetNote({ id: suggestion.id, title: suggestion.title })
        // Small delay to ensure state update propagates before mounting modal
        setTimeout(() => setIsLinkingModalOpen(true), 50)
    }

    const handleSaveEdit = async () => {
        if (!selectedNote || !user) return

        setSaveStatus('saving')

        try {
            // Ensure title and body have content (use defaults if empty)
            const titleToSave = editedTitle.trim() || 'Untitled Note'
            const bodyToSave = editedBody.trim() || ' '

            // Update the note
            const { error } = await supabase
                .from('atomic_notes')
                .update({
                    title: editedTitle,
                    body: editedBody,
                    text_id: selectedNote.text_id, // Persist text_id
                } as any)
                .eq('id', selectedNote.id)

            if (error) {
                console.error('Error saving note:', error)
                console.error('Error details:', JSON.stringify(error, null, 2))
                console.error('Attempted to save:', { title: titleToSave, bodyLength: bodyToSave.length })
                alert(`Failed to save: ${error.message || error.toString() || 'Unknown error'}`)
                setSaveStatus('error')
                return
            }

            // Update tags if changed
            const currentTagNames = (selectedNote.tags as Tag[] | undefined)?.map(t => typeof t === 'string' ? t : t.name) || []

            // Sync links from wikilinks [[Title]]
            const wikilinkMatches = bodyToSave.match(/\[\[(.*?)\]\]/g) || []
            const linkedTitles = [...new Set(wikilinkMatches.map(m => m.slice(2, -2)))] // Unique titles

            // Prepare links to insert
            const linksToInsert: Array<{
                from_note_id: string
                to_note_id?: string
                to_text_id?: string
                relation_type: string
                created_by: string
                explanation: string
            }> = []

            for (const title of linkedTitles) {
                // Check for linked Note
                const targetNote = allNotes.find(n => n.title === title && n.id !== selectedNote.id)
                if (targetNote) {
                    linksToInsert.push({
                        from_note_id: selectedNote.id,
                        to_note_id: targetNote.id,
                        relation_type: 'wikilink',
                        created_by: user.id,
                        explanation: 'Linked via wikilink syntax'
                    })
                    continue
                }

                // Check for linked Text
                const targetText = texts.find(t => t.title === title)
                if (targetText) {
                    linksToInsert.push({
                        from_note_id: selectedNote.id,
                        to_text_id: targetText.id,
                        relation_type: 'wikilink',
                        created_by: user.id,
                        explanation: 'Linked via wikilink syntax'
                    })
                    continue
                }
            }

            // Update links in database (delete existing outgoing and insert new)
            // First delete all outgoing links from this note
            await supabase.from('links').delete().eq('from_note_id', selectedNote.id)

            // Then insert valid links
            if (linksToInsert.length > 0) {
                const { error: linkError } = await supabase.from('links').insert(linksToInsert)
                if (linkError) {
                    console.error('Error syncing links:', linkError)
                }
            }

            const tagsChanged = JSON.stringify([...editedTags].sort()) !== JSON.stringify([...currentTagNames].sort())

            if (tagsChanged) {
                // Remove old tag associations
                await supabase.from('note_tags').delete().eq('note_id', selectedNote.id)

                // Add new tags
                for (const tagName of editedTags) {
                    if (!tagName.trim()) {
                        continue
                    }

                    // Find or create tag
                    let { data: tag } = await supabase
                        .from('tags')
                        .select('*')
                        .eq('name', tagName)
                        .single()

                    if (!tag) {
                        const { data: newTag } = await supabase
                            .from('tags')
                            .insert({ name: tagName, display_name: tagName })
                            .select('*')
                            .single()
                        tag = newTag
                    }

                    if (tag) {
                        await supabase
                            .from('note_tags')
                            .insert({ note_id: selectedNote.id, tag_id: tag.id })
                    }
                }
            }

            setSaveStatus('saved')
            await refreshNotebook()

            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (err) {
            console.error('Error in handleSaveEdit:', err)
            setSaveStatus('error')
        }
    }

    // Auto-save when editing
    useEffect(() => {
        if (!isEditingNote || !selectedNote) return

        // Use the note ID at the time of effect creation
        const noteIdBeingSaved = selectedNote.id
        const noteTitle = selectedNote.title
        const noteBody = selectedNote.body
        const noteTags = (selectedNote.tags as Tag[] | undefined)?.map(t => typeof t === 'string' ? t : t.name) || []

        // Check if there are actual changes to save
        const currentTagNames = [...noteTags].sort()
        const editedTagNames = [...editedTags].sort()

        const hasChanges =
            editedTitle !== noteTitle ||
            editedBody !== noteBody ||
            JSON.stringify(currentTagNames) !== JSON.stringify(editedTagNames)

        if (!hasChanges) return

        const timer = setTimeout(() => {
            // Only save if we're still editing the same note
            if (selectedNote?.id === noteIdBeingSaved) {
                handleSaveEdit()
            }
        }, 1000)

        return () => clearTimeout(timer)
    }, [editedTitle, editedBody, editedTags, isEditingNote])

    // Initialize edit mode when selecting a note
    useEffect(() => {
        if (selectedNote) {
            // Initialize editing state
            setEditedTitle(selectedNote.title || '')
            setEditedBody(selectedNote.body || '')
            const tagNames = (selectedNote.tags as Tag[] | undefined)?.map(t => typeof t === 'string' ? t : t.name) || []
            setEditedTags(tagNames)

            // Auto-enable edit mode
            setIsEditingNote(true)

            // v0.3: Initialize character count
            setCharCount(selectedNote.body?.length || 0)

            // v0.3: Infer and set SP category
            const inferred = inferSPCategory(selectedNote)
            setInferredSPCategory(inferred)
            setSpCategory(inferred)

            // v0.3: Set meaning check status if available
            setMeaningCheckStatus(selectedNote.moderation_status as any)
            setMeaningCheckResult(selectedNote.moderation_result || null)

            // Fetch creation action for rewards display
            const fetchCreationAction = async () => {
                const { data } = await supabase
                    .from('actions')
                    .select('*')
                    .eq('type', 'CREATE_NOTE')
                    .eq('target_id', selectedNote.id) // Assuming target_id was set on creation (need to ensure this in handleSubmitAtom)
                    .maybeSingle() // Use maybeSingle as old notes might not have this

                // Fallback: try to find by description if target_id wasn't set in older versions
                if (!data) {
                    const { data: fallbackData } = await supabase
                        .from('actions')
                        .select('*')
                        .eq('type', 'CREATE_NOTE')
                        .ilike('description', `%${selectedNote.title}%`)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()
                    setCreationAction(fallbackData)
                } else {
                    setCreationAction(data)
                }
            }
            fetchCreationAction()
        } else {
            setCreationAction(null)
        }
    }, [selectedNote?.id])



    const handleAddTag = (tag: string) => {
        const cleanTag = tag.trim().replace(/^#/, '')
        if (cleanTag && !editedTags.includes(cleanTag)) {
            setEditedTags([...editedTags, cleanTag])
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setEditedTags(editedTags.filter(t => t !== tagToRemove))
    }

    const handleAddLink = async (targetTitle: string) => {
        if (!selectedNote || !user) return

        // Find target note by title
        const targetNote = allNotes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase() && n.id !== selectedNote.id)

        if (!targetNote) {
            toast.error('Note not found')
            return
        }

        try {
            // Create Link
            const { data: linkData, error: linkError } = await supabase.from('links').insert({
                from_note_id: selectedNote.id,
                to_note_id: targetNote.id,
                relation_type: 'supports', // Default
                explanation: 'Linked via Quick Link',
                created_by: user.id,
            }).select().single()

            if (linkError) throw linkError

            // Award Points (Simplified for quick link)
            const spThinking = 2
            await supabase.from('actions').insert({
                user_id: user.id,
                type: 'LINK_NOTE',
                xp: 10, // Base XP for linking
                sp_thinking: spThinking,
                description: `Linked atom to atom`,
            })

            // Update Character Stats
            const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
            if (charData) {
                const char = charData as any
                await supabase.from('characters').update({
                    sp_thinking: char.sp_thinking + spThinking,
                }).eq('id', char.id)
            }

            toast.success('Link created!')

            // Detect and award Bridge Builder bonus
            if (linkData) {
                const bridgeBonus = await detectBridgeBuilder(linkData.id, selectedNote.id, targetNote.id)
                if (bridgeBonus) {
                    await awardBonus(user.id, bridgeBonus, linkData.id)
                    const message = getBonusMessage(bridgeBonus)
                    toast.success(`${message.icon} ${message.title}`, {
                        description: `${message.description} +${bridgeBonus.xp} XP`
                    })
                }

                // v0.3.2: Detect and award Hub Formation bonus
                // Wait for DB trigger to update connection_count
                await new Promise(resolve => setTimeout(resolve, 1000))

                const hubBonuses = await detectHubsFromLink(selectedNote.id, targetNote.id)
                for (const hubBonus of hubBonuses) {
                    await awardBonus(user.id, hubBonus, linkData.id)
                    const message = getBonusMessage(hubBonus)
                    toast.success(`${message.icon} ${message.title}`, {
                        description: `A hub has formed around your insight!`
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

            // Preserve selected note and refresh
            const currentNoteId = selectedNote.id
            await refreshNotebook()

            // Restore selected note after refresh
            setSelectedNote(prev => notes.find(n => n.id === currentNoteId) || prev)

        } catch (err) {
            console.error('Error creating link:', err)
            toast.error('Failed to create link')
        }
    }

    // Handle editor body changes
    const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedBody(e.target.value)
        setCharCount(e.target.value.length)
    }

    // v0.3: Infer SP category based on note content and type
    const inferSPCategory = (note: Partial<Note>): SPCategory => {
        // Questions → Thinking SP
        if (note.type === 'question') {
            return 'thinking'
        }

        // Has text_id → Reading SP
        if (note.text_id) {
            return 'reading'
        }

        // Check for reflection keywords in body
        const body = note.body?.toLowerCase() || ''
        const reflectionKeywords = ['i think', 'i feel', 'i believe', 'i wonder', 'in my opinion', 'reflects', 'reflection']
        if (reflectionKeywords.some(keyword => body.includes(keyword))) {
            return 'engagement'
        }

        // Default: Thinking SP
        return 'thinking'
    }

    // v0.3: Submit atom (change from draft to pending, trigger meaning check, award XP/SP)
    const handleSubmitAtom = async () => {
        if (!selectedNote || !user) return
        if (selectedNote.moderation_status !== 'draft') return

        setIsSubmitting(true)

        try {
            // Get character data
            const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
            if (!charData) {
                toast.error('Character not found')
                setIsSubmitting(false)
                return
            }

            // Update note status to pending (triggers moderation)
            const { error: updateError } = await supabase
                .from('atomic_notes')
                .update({ moderation_status: 'pending' } as any)
                .eq('id', selectedNote.id)

            if (updateError) {
                toast.error('Failed to submit atom')
                console.error(updateError)
                setIsSubmitting(false)
                return
            }

            // Determine SP category
            const inferredCategory = inferSPCategory(selectedNote)
            const category = spCategory || inferredCategory

            // Award XP and SP
            const xpAward = 5 // Base XP for creating atom
            const spAwards = {
                sp_thinking: category === 'thinking' ? 2 : 0,
                sp_reading: category === 'reading' ? 1 : 0,
                sp_writing: category === 'writing' ? 1 : 0,
                sp_engagement: category === 'engagement' ? 1 : 0
            }

            // Insert action
            const { data: actionData } = await supabase.from('actions').insert({
                user_id: user.id,
                type: 'CREATE_NOTE',
                xp: xpAward,
                ...spAwards,
                description: `Submitted atom: ${selectedNote.title}`,
                target_id: selectedNote.id
            } as any).select().single()

            if (actionData) {
                setCreationAction(actionData)
            }

            // Update character stats
            const char = charData as any
            await supabase.from('characters').update({
                sp_thinking: char.sp_thinking + spAwards.sp_thinking,
                sp_reading: char.sp_reading + spAwards.sp_reading,
                sp_writing: char.sp_writing + spAwards.sp_writing,
                sp_engagement: char.sp_engagement + spAwards.sp_engagement,
            } as any).eq('id', char.id)

            // Set last awards for feedback banner
            setLastAwards({
                xp: xpAward,
                sp: {
                    thinking: spAwards.sp_thinking,
                    reading: spAwards.sp_reading,
                    writing: spAwards.sp_writing,
                    engagement: spAwards.sp_engagement
                }
            })

            // Show toast
            toast.success('Atom received. The Machine is learning.')

            // Trigger async meaning check
            setMeaningCheckStatus('pending')
            setMeaningCheckResult('Checking meaning...')

            // Call the async meaning check (non-blocking)
            checkMeaningAsync(selectedNote.id).catch(err => {
                console.error('Meaning check error:', err)
            })

            // Poll for meaning check results
            setTimeout(async () => {
                const { data: updatedNote } = await supabase
                    .from('atomic_notes')
                    .select('moderation_status, moderation_result')
                    .eq('id', selectedNote.id)
                    .single()

                if (updatedNote) {
                    setMeaningCheckStatus(updatedNote.moderation_status as any)
                    setMeaningCheckResult(updatedNote.moderation_result)
                }
            }, 3000) // Poll after 3 seconds

            // Refresh notebook to show updated status
            await refreshNotebook()

            // Scroll to show the atom in sidebar
            setTimeout(() => {
                newAtomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 100)

        } catch (error) {
            console.error('Error submitting atom:', error)
            toast.error('Failed to submit atom')
        } finally {
            setIsSubmitting(false)
        }
    }

    // v0.3: Create link from modal
    const handleCreateLinkFromModal = async (targetNoteId: string | null, targetTextId: string | null, explanation: string) => {
        if (!selectedNote || !user) return

        try {
            // Create Link
            const { data: linkData, error: linkError } = await supabase.from('links').insert({
                from_note_id: selectedNote.id,
                to_note_id: targetNoteId,
                to_text_id: targetTextId,
                relation_type: 'connects', // Using generic relation type
                explanation: explanation,
                created_by: user.id,
            } as any).select().single()

            if (linkError) throw linkError

            // Award 1 Thinking SP for linking
            const spThinking = 1
            await supabase.from('actions').insert({
                user_id: user.id,
                type: 'LINK_NOTE',
                xp: 10,
                sp_thinking: spThinking,
                description: `Connected atoms`,
            } as any)

            // Update Character Stats
            const { data: charData } = await supabase.from('characters').select('*').eq('user_id', user.id).single()
            if (charData) {
                const char = charData as any
                await supabase.from('characters').update({
                    sp_thinking: char.sp_thinking + spThinking,
                } as any).eq('id', char.id)
            }

            toast.success('Connection activated. +1 Thinking SP')

            // Detect and award Bridge Builder bonus
            if (linkData && targetNoteId) {
                const bridgeBonus = await detectBridgeBuilder(linkData.id, selectedNote.id, targetNoteId)
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

            await refreshNotebook()

        } catch (err) {
            console.error('Error creating link:', err)
            toast.error('Failed to create link')
        }
    }


    // Get all tags for sidebar
    const allTagsForSidebar = useMemo(() => {
        const tagMap = new Map<string, number>()
        allNotes.forEach(note => {
            (note.tags as Tag[] | undefined)?.forEach(tag => {
                if (typeof tag === 'object' && tag.display_name) {
                    const count = tagMap.get(tag.display_name) || 0
                    tagMap.set(tag.display_name, count + 1)
                }
            })
        })
        return Array.from(tagMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
    }, [allNotes])

    // Get question notes and answer counts
    const questionNotes = useMemo(() => {
        return allNotes.filter(note => note.type === 'question')
    }, [allNotes])

    const getAnswerCount = (questionId: string) => {
        const links = noteLinks.get(questionId)
        if (!links) return 0
        // Count incoming links that are of type 'answer'
        return links.incoming?.length || 0
    }



    // Generate graph data for the selected note (memoized for performance)
    const getGraphData = useMemo(() => {
        if (!selectedNote) return { nodes: [], links: [] }

        const links = noteLinks.get(selectedNote.id)
        if (!links) return { nodes: [], links: [] }

        const nodes: any[] = []
        const graphLinks: any[] = []
        const addedNodeIds = new Set<string>()

        // Helper function for type-based colors (same as main graph)
        const getColor = (type: string) => {
            switch (type) {
                case 'idea': return '#00f0ff' // Cyan
                case 'question': return '#ff003c' // Red
                case 'quote': return '#7000ff' // Purple
                case 'insight': return '#ffe600' // Yellow
                default: return '#888'
            }
        }

        // Add center node (selected note) - slightly larger
        nodes.push({
            id: selectedNote.id,
            name: selectedNote.title,
            val: 12, // Smaller than before
            color: getColor(selectedNote.type),
            type: selectedNote.type
        })
        addedNodeIds.add(selectedNote.id)

        // Add outgoing nodes
        links.outgoing.forEach(note => {
            if (!addedNodeIds.has(note.id)) {
                nodes.push({
                    id: note.id,
                    name: note.title,
                    val: 8, // Smaller
                    color: getColor(note.type),
                    type: note.type
                })
                addedNodeIds.add(note.id)
            }
            graphLinks.push({ source: selectedNote.id, target: note.id })
        })

        // Add incoming nodes
        links.incoming.forEach(note => {
            if (!addedNodeIds.has(note.id)) {
                nodes.push({
                    id: note.id,
                    name: note.title,
                    val: 8, // Smaller
                    color: getColor(note.type),
                    type: note.type
                })
                addedNodeIds.add(note.id)
            }
            graphLinks.push({ source: note.id, target: selectedNote.id })
        })

        // Add text nodes
        links.texts?.forEach(text => {
            if (!addedNodeIds.has(text.id)) {
                nodes.push({
                    id: text.id,
                    name: text.title,
                    val: 10, // Slightly larger
                    color: '#ffffff', // White for texts
                    type: 'text'
                })
                addedNodeIds.add(text.id)
            }
            graphLinks.push({ source: selectedNote.id, target: text.id })
        })

        return { nodes, links: graphLinks }
    }, [selectedNote, noteLinks])

    // Filter notes by search, then organize
    const notes = useMemo(() => {
        let filtered = allNotes

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(query) ||
                note.body.toLowerCase().includes(query)
            )
        }

        if (selectedTagFilter) {
            if (selectedTagFilter === '__questions__') {
                filtered = filtered.filter(note => note.type === 'question')
            } else {
                filtered = filtered.filter(note =>
                    (note.tags as Tag[] | undefined)?.some(tag => tag.name === selectedTagFilter)
                )
            }
        }

        if (submissionFilter) {
            filtered = filtered.filter(note => note.moderation_status === submissionFilter)
        }

        // Sort by created_at descending
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [allNotes, searchQuery, selectedTagFilter, submissionFilter])

    // Handle noteId query param
    useEffect(() => {
        if (noteIdParam && notes.length > 0) {
            const note = notes.find(n => n.id === noteIdParam)
            if (note) {
                setSelectedNote(note)
            }
        }
    }, [noteIdParam, notes])

    // Add Cmd+K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setCommandPaletteOpen(true)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Add additional keyboard shortcuts (/ for search, n for new note)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input or textarea
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

            if (e.key === '/') {
                e.preventDefault()
                searchInputRef.current?.focus()
            } else if (e.key === 'n') {
                e.preventDefault()
                handleCreateNote() // Call the new note creation function
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Restore scroll position on mount
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('notebookScroll')
        if (savedScroll) {
            window.scrollTo(0, parseInt(savedScroll))
            sessionStorage.removeItem('notebookScroll')
        }
    }, [])

    if (loading) return <div className="min-h-screen bg-[#1e1e1e] text-gray-200 p-6">Loading...</div>

    return (
        <div className="min-h-screen bg-[#1e1e1e] text-gray-200 flex gap-0">
            {/* Single Consolidated Sidebar */}
            <div className="w-72 border-r border-gray-800 bg-[#252525] flex flex-col">
                {/* New Note Button */}
                <div className="p-3 border-b border-gray-800">
                    <Button
                        onClick={handleCreateNote}
                        className="w-full"
                        size="sm"
                        variant="outline"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Note
                    </Button>
                </div>

                {/* Search Field */}
                <div className="p-3 border-b border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#1e1e1e] border-gray-700 text-gray-200 placeholder:text-gray-500 text-sm h-9"
                        />
                    </div>
                </div>

                {/* All Notes & Questions Filters */}
                <div className="p-2 border-b border-gray-800 space-y-0.5">
                    <button
                        onClick={() => {
                            setSelectedTagFilter(null)
                            setSubmissionFilter(null)
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${selectedTagFilter === null && submissionFilter === null
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-gray-400 hover:bg-gray-700/50'
                            }`}
                    >
                        <span>All Notes</span>
                        <span className="text-xs opacity-70">{allNotes.length}</span>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedTagFilter('__questions__')
                            setSubmissionFilter(null)
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${selectedTagFilter === '__questions__'
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-gray-400 hover:bg-gray-700/50'
                            }`}
                    >
                        <span>Questions</span>
                        <span className="text-xs opacity-70">{questionNotes.length}</span>
                    </button>
                </div>

                {/* My Submissions Filters */}
                <div className="p-2 border-b border-gray-800 space-y-0.5">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        My Submissions
                    </div>
                    {['pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => {
                                setSubmissionFilter(status as any)
                                setSelectedTagFilter(null)
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between capitalize ${submissionFilter === status
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'text-gray-400 hover:bg-gray-700/50'
                                }`}
                        >
                            <span>{status}</span>
                            {/* We'll need to calculate counts for these */}
                        </button>
                    ))}
                </div>

                {/* Tags Section (Collapsible) */}
                <div className="border-b border-gray-800">
                    <button
                        onClick={() => setShowTagsSection(!showTagsSection)}
                        className="w-full p-3 flex items-center justify-between text-sm font-semibold text-gray-400 hover:bg-gray-700/30 transition-colors"
                    >
                        <span>TAGS</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${showTagsSection ? 'rotate-90' : ''}`} />
                    </button>
                    {showTagsSection && (
                        <div className="p-2 pb-3 space-y-0.5">
                            {allTagsForSidebar.map(tag => (
                                <button
                                    key={tag.name}
                                    onClick={() => setSelectedTagFilter(tag.name)}
                                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${selectedTagFilter === tag.name
                                        ? 'bg-blue-600/20 text-blue-400'
                                        : 'text-gray-300 hover:bg-gray-700/50'
                                        }`}
                                >
                                    <span>#{tag.name}</span>
                                    <span className="text-xs opacity-70">{tag.count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto">
                    {notes.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            {selectedTagFilter ? `No notes with #${selectedTagFilter}` : 'No notes yet'}
                        </div>
                    ) : (
                        notes.map(note => (
                            <button
                                key={note.id}
                                onClick={() => setSelectedNote(note)}
                                className={`w-full text-left p-3 border-b border-gray-800/50 hover:bg-gray-700/30 transition-colors ${selectedNote?.id === note.id ? 'bg-gray-700/50' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-medium text-sm truncate text-gray-200">{note.title}</div>
                                            {note.type && (
                                                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 flex-shrink-0">
                                                    {note.type}
                                                </span>
                                            )}
                                            {note.type === 'question' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600/20 text-green-400 flex-shrink-0">
                                                    {getAnswerCount(note.id)} answers
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {note.body.substring(0, 60)}...
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {selectedNote ? (
                    <div className="max-w-4xl mx-auto px-12 py-12">
                        {/* Action Toolbar */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800 sticky top-0 bg-[#1e1e1e] z-10 pt-2">
                            <div className="text-xs text-gray-500 flex items-center gap-4">
                                <span>
                                    {saveStatus === 'saving' && <span className="animate-pulse">Saving...</span>}
                                    {saveStatus === 'saved' && <span className="text-green-500">✓ Saved</span>}
                                    {saveStatus === 'error' && <span className="text-red-500">Error saving</span>}
                                </span>
                                {selectedNote.moderation_status === 'draft' && (
                                    <span className="text-gray-600">
                                        {charCount} / 280 chars (recommended)
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSuggestionTargetNote(null)
                                        setIsLinkingModalOpen(true)
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                >
                                    <LinkIcon className="h-3 w-3 mr-1" />
                                    Connect
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-gray-400 hover:text-white"
                                    onClick={() => {
                                        // Save scroll position
                                        sessionStorage.setItem('notebookScroll', window.scrollY.toString())

                                        // Build graph URL
                                        const params = new URLSearchParams()
                                        params.set('highlightNode', selectedNote.id)

                                        // If note is very new (< 5 mins), treat as new insight
                                        const isNew = (Date.now() - new Date(selectedNote.created_at).getTime()) < 300000
                                        if (isNew) params.set('newInsight', 'true')

                                        window.location.href = `/graph?${params.toString()}`
                                    }}
                                >
                                    <Network className="h-3 w-3 mr-1" />
                                    Graph
                                </Button>

                                {selectedNote.type === 'question' && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleAnswerQuestion}
                                        disabled={isAnsweringQuestion}
                                        className="text-xs bg-green-600 hover:bg-green-700"
                                    >
                                        {isAnsweringQuestion ? 'Creating...' : 'Answer'}
                                    </Button>
                                )}

                                {selectedNote.moderation_status === 'draft' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSubmitAtom}
                                        disabled={isSubmitting}
                                        className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 border border-blue-500/30"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Atom'
                                        )}
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDeleteNote}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    <Trash className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Meaning Feedback Banner (v0.3) */}
                        <MeaningFeedbackBanner
                            status={meaningCheckStatus}
                            result={meaningCheckResult}
                            awards={lastAwards}
                            onDismiss={() => {
                                setMeaningCheckStatus(null)
                                setMeaningCheckResult(null)
                                setLastAwards(undefined)
                            }}
                        />
                        {/* Bear-Style Editor */}
                        {isEditingNote ? (
                            <div className="max-w-4xl mx-auto px-2">

                                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500 bg-[#252525] p-3 rounded-lg border border-gray-800">
                                    {/* Status Badge */}
                                    <div className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${selectedNote.moderation_status === 'draft'
                                        ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                                        : selectedNote.moderation_status === 'rejected'
                                            ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                                            : 'bg-green-500/20 text-green-200 border border-green-500/30'
                                        }`}>
                                        {selectedNote.moderation_status || 'Approved'}
                                    </div>

                                    {/* Rejection Reason */}
                                    {selectedNote.moderation_status === 'rejected' && selectedNote.moderation_result && (
                                        <div className="w-full mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-200 text-sm">
                                            <span className="font-semibold">Rejection Reason: </span>
                                            {selectedNote.moderation_result}
                                        </div>
                                    )}

                                    {/* SP Category Selector (v0.3) */}
                                    {selectedNote.moderation_status === 'draft' && (
                                        <SPCategorySelector
                                            category={spCategory}
                                            onChange={setSpCategory}
                                            inferredCategory={inferredSPCategory}
                                        />
                                    )}

                                    {/* Source Text Selector */}
                                    {selectedNote.moderation_status === 'draft' && (
                                        <div className="relative group">
                                            <select
                                                value={selectedNote.text_id || ''}
                                                onChange={(e) => {
                                                    const newTextId = e.target.value || null
                                                    setSelectedNote({ ...selectedNote, text_id: newTextId })
                                                    // Trigger autosave if needed, or rely on manual save/submit
                                                    // For now, we rely on the user editing title/body to trigger save, 
                                                    // OR we should trigger a save here. 
                                                    // Let's trigger a save immediately for metadata changes.
                                                    const updateTextId = async () => {
                                                        await supabase
                                                            .from('atomic_notes')
                                                            .update({ text_id: newTextId } as any)
                                                            .eq('id', selectedNote.id)
                                                    }
                                                    updateTextId()
                                                }}
                                                className="appearance-none bg-[#2d2d30] text-gray-300 text-xs rounded-md px-2 py-1 pr-6 border border-transparent hover:border-gray-600 focus:outline-none cursor-pointer max-w-[150px] truncate"
                                            >
                                                <option value="">Select Source Text...</option>
                                                {texts.map(text => (
                                                    <option key={text.id} value={text.id}>
                                                        {text.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <Book className="w-3 h-3 text-gray-500 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                        <span>{new Date(selectedNote.created_at).toLocaleDateString()}</span>
                                        {selectedNote.users?.codex_name && (
                                            <span>by {selectedNote.users.codex_name}</span>
                                        )}
                                        <span>•</span>
                                        <span className="text-blue-400">
                                            {selectedNote.is_hub ? '🌐 Hub' : '📝 Note'}
                                            {selectedNote.is_hub && ` (${selectedNote.connection_count} connections)`}
                                        </span>
                                    </div>

                                    {/* XP Earned Display */}
                                    <NoteXPDisplay noteId={selectedNote.id} userId={user?.id || ''} />

                                    <div className="border-b border-gray-800 mb-4"></div>
                                    {/* Tags */}
                                    <div className="flex items-center gap-2 flex-wrap border-l border-gray-700 pl-4">
                                        <Hash className="w-3.5 h-3.5" />
                                        {editedTags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-[#2d2d30] text-gray-300 text-xs rounded-md flex items-center gap-1 group"
                                            >
                                                #{tag}
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            placeholder="Add tag..."
                                            className="bg-transparent border-none focus:ring-0 text-xs text-gray-400 placeholder:text-gray-600 w-24 p-0"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddTag(e.currentTarget.value)
                                                    e.currentTarget.value = ''
                                                }
                                            }}
                                            list="tag-suggestions"
                                        />
                                        <datalist id="tag-suggestions">
                                            {Array.from(new Set(allNotes.flatMap(n => (n.tags as Tag[] | undefined)?.map(t => typeof t === 'string' ? t : t.name) || []))).sort().map(tag => (
                                                <option key={tag} value={tag} />
                                            ))}
                                        </datalist>
                                    </div>
                                    {/* Persistent Rewards Display */}
                                    {creationAction && (
                                        <div className="flex items-center gap-3 ml-auto text-xs font-medium bg-black/20 px-2 py-1 rounded">
                                            <span className="text-green-400">+{creationAction.xp} XP</span>
                                            {creationAction.sp_thinking > 0 && <span className="text-blue-400">+{creationAction.sp_thinking} Thinking</span>}
                                            {creationAction.sp_reading > 0 && <span className="text-emerald-400">+{creationAction.sp_reading} Reading</span>}
                                            {creationAction.sp_writing > 0 && <span className="text-amber-400">+{creationAction.sp_writing} Writing</span>}
                                            {creationAction.sp_engagement > 0 && <span className="text-purple-400">+{creationAction.sp_engagement} Engagement</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Title Input - Large, prominent */}
                                <textarea
                                    ref={titleInputRef}
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    placeholder="Note Title"
                                    className="w-full text-4xl font-bold bg-transparent border-none focus:ring-0 p-0 resize-none overflow-hidden placeholder:text-gray-600 focus:outline-none mb-4"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            editorRef.current?.focus()
                                        }
                                    }}
                                    style={{ lineHeight: '1.2' }}
                                />
                                {/* Markdown Body - Borderless, clean */}
                                <div className="relative">
                                    <textarea
                                        ref={editorRef}
                                        value={editedBody}
                                        onChange={handleEditorChange}
                                        className="w-full min-h-[500px] bg-transparent border-none text-gray-200 text-base focus:outline-none resize-none leading-relaxed"
                                        placeholder="Start writing..."
                                        style={{ lineHeight: '1.7' }}
                                    />

                                    {/* Bottom Submit Button (only for draft notes) */}
                                    {selectedNote.moderation_status === 'draft' && (
                                        <div className="mt-8 mb-8 flex justify-end">
                                            <Button
                                                onClick={handleSubmitAtom}
                                                disabled={isSubmitting}
                                                variant="ghost"
                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 border border-blue-500/30 px-6"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Submitting Atom...
                                                    </>
                                                ) : (
                                                    'Submit Atom'
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div
                                className="max-w-4xl mx-auto px-8 py-6 cursor-text"
                                onClick={() => setIsEditingNote(true)}
                            >
                                {/* View Mode - Rendered Markdown */}
                                <h1 className="text-3xl font-bold text-gray-100 mb-4">{selectedNote.title}</h1>

                                {/* Tags in View Mode */}
                                {selectedNote.tags && selectedNote.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {selectedNote.tags.map((tag: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-gray-700/50 rounded text-sm text-gray-300"
                                            >
                                                #{typeof tag === 'string' ? tag : tag.display_name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Rendered Markdown Content */}
                                <div className="prose prose-invert prose-lg max-w-none">
                                    <MarkdownRenderer content={selectedNote.body} />
                                </div>

                                {/* Edit hint */}
                                <div className="mt-8 text-center text-xs text-gray-600">
                                    Click anywhere to edit
                                </div>
                            </div>
                        )}

                        {/* Linked Notes Section */}
                        {((noteLinks.get(selectedNote.id)?.outgoing && noteLinks.get(selectedNote.id)!.outgoing.length > 0) ||
                            (noteLinks.get(selectedNote.id)?.incoming && noteLinks.get(selectedNote.id)!.incoming.length > 0)) && (
                                <div className="max-w-4xl mx-auto px-8 py-6 border-t border-gray-800 mt-8">
                                    <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-3 font-semibold">
                                        Linked Notes
                                    </h3>
                                    <div className="space-y-2">
                                        {/* Outgoing Links */}
                                        {noteLinks.get(selectedNote.id)?.outgoing?.map((linkedNote) => (
                                            <button
                                                key={`outgoing-${linkedNote.id}`}
                                                onClick={() => setSelectedNote(linkedNote)}
                                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors group"
                                            >
                                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                                <span>{linkedNote.title}</span>
                                            </button>
                                        ))}
                                        {/* Incoming Links (Backlinks) */}
                                        {noteLinks.get(selectedNote.id)?.incoming?.map((linkedNote) => (
                                            <button
                                                key={`incoming-${linkedNote.id}`}
                                                onClick={() => setSelectedNote(linkedNote)}
                                                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors group"
                                            >
                                                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                                                <span>{linkedNote.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        }

                        {/* Linked Texts */}
                        {
                            noteLinks.get(selectedNote.id)?.texts && noteLinks.get(selectedNote.id)!.texts.length > 0 && (
                                <div className="max-w-4xl mx-auto px-8 py-6 border-t border-gray-800">
                                    <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">
                                        Linked Texts
                                    </h3>
                                    <div className="space-y-2">
                                        {noteLinks.get(selectedNote.id)!.texts.map((text) => (
                                            <div key={text.id} className="flex items-center gap-2 text-sm text-emerald-400">
                                                <Book className="h-3 w-3" />
                                                <span>{text.title}</span>
                                                <span className="text-gray-500 text-xs">by {text.author}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }

                        {/* Local Graph */}
                        <div className="max-w-4xl mx-auto px-8 py-6 border-t border-gray-800">
                            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">
                                Local Graph
                            </h3>
                            <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-800">
                                <ForceGraph
                                    data={getGraphData}
                                    nodeRelSize={4}
                                    onNodeClick={(node) => {
                                        if (node.type !== 'text') {
                                            const targetNote = allNotes.find(n => n.id === node.id)
                                            if (targetNote) setSelectedNote(targetNote)
                                        }
                                    }}
                                />
                            </div>
                            {/* Legend */}
                            <div className="mt-3 flex flex-wrap gap-3 text-xs">
                                {[
                                    { type: 'idea', color: '#00f0ff', label: 'Idea' },
                                    { type: 'question', color: '#ff003c', label: 'Question' },
                                    { type: 'quote', color: '#7000ff', label: 'Quote' },
                                    { type: 'insight', color: '#ffe600', label: 'Insight' },
                                    { type: 'text', color: '#ffffff', label: 'Text' }
                                ].map(item => (
                                    <div key={item.type} className="flex items-center gap-1.5">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-gray-400">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                        <div className="text-6xl">📝</div>
                        <p className="text-lg">Select a note to view</p>
                        <p className="text-sm text-gray-600">Or press ⌘K to search</p>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <CommandPalette
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
                notes={allNotes}
                onSelectNote={(note) => {
                    setSelectedNote(note)
                    setCommandPaletteOpen(false)
                }}
            />

            {isLinkingModalOpen && (
                <LinkingModal
                    isOpen={isLinkingModalOpen}
                    onClose={() => setIsLinkingModalOpen(false)}
                    currentNoteId={selectedNote?.id || ''}
                    currentNoteTitle={selectedNote?.title || ''}
                    allNotes={allNotes}
                    allTexts={texts}
                    onCreateLink={handleCreateLinkFromModal}
                    preselectedTarget={suggestionTargetNote}
                />
            )}

            {/* v0.3.2: Suggestions Panel */}
            {selectedNote && (selectedNote.moderation_status === 'draft' || selectedNote.moderation_status === 'approved') && (
                <SuggestionsPanel
                    noteId={selectedNote.id}
                    noteText={`${selectedNote.title}\n${selectedNote.body}`}
                    tags={editedTags}
                    isOpen={isSuggestionsPanelOpen}
                    onToggle={() => setIsSuggestionsPanelOpen(!isSuggestionsPanelOpen)}
                    onConnect={handleConnectFromSuggestion}
                />
            )}
        </div>
    )
}
