'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createNote, updateNote, deleteNote, promoteNote } from '@/lib/actions/notes'
import { FileText, Lightbulb, BookOpen, Brain, PlusCircle, Trash2, Search, Save, MoreVertical, Layout, CheckCircle, AlertCircle, Network, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import dynamic from 'next/dynamic'

const ForceGraph = dynamic(() => import('@/components/graph/force-graph'), {
    ssr: false,
    loading: () => <div className="p-4 text-sm text-muted-foreground">Loading Graph...</div>
})

interface Note {
    id: string
    title: string
    content: string
    type: 'fleeting' | 'source' | 'permanent'
    is_public: boolean
    citation?: string
    page_number?: string
    created_at: string
    updated_at: string
}

interface UserProfile {
    id: string
    email: string
    codex_name?: string
}

export default function NotebookPage() {
    const { user } = useAuth()
    const supabase = createClient()

    // Data State
    const [notes, setNotes] = useState<Note[]>([])
    const [publicNotes, setPublicNotes] = useState<Note[]>([])
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)

    // UI State
    const [activeTab, setActiveTab] = useState<'fleeting' | 'permanent' | 'source'>('fleeting')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [promotionResult, setPromotionResult] = useState<{ success: boolean, feedback: string, score: number } | null>(null)
    const [showPromotionDialog, setShowPromotionDialog] = useState(false)

    // Editor State
    const [editTitle, setEditTitle] = useState('')
    const [editContent, setEditContent] = useState('')

    // Autocomplete State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [mentionType, setMentionType] = useState<'wiki' | 'mention' | null>(null)
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const titleRef = useRef<HTMLTextAreaElement>(null)
    const [backlinks, setBacklinks] = useState<any[]>([])
    const [outgoingLinks, setOutgoingLinks] = useState<any[]>([])
    const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })

    // Auto-resize title
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto'
            titleRef.current.style.height = titleRef.current.scrollHeight + 'px'
        }
    }, [editTitle])

    const router = useRouter()
    const searchParams = useSearchParams()
    const hasHandledNewRef = useRef(false)

    // Fetch Backlinks & Graph Data
    useEffect(() => {
        if (!selectedNoteId) {
            setBacklinks([])
            setOutgoingLinks([])
            setGraphData({ nodes: [], links: [] })
            return
        }

        const selectedNote = notes.find(n => n.id === selectedNoteId)
        if (!selectedNote) return

        const fetchData = async () => {
            const [outRes, inRes] = await Promise.all([
                supabase.from('connections').select('*, target_note:target_note_id(id, title, type)').eq('source_note_id', selectedNoteId),
                supabase.from('connections').select('*, source_note:source_note_id(id, title, type)').eq('target_note_id', selectedNoteId)
            ])

            const outLinks = outRes.data || []
            const inLinks = inRes.data || []

            setOutgoingLinks(outLinks)
            setBacklinks(inLinks)

            // Construct Local Graph
            const uniqueNodes = new Map<string, any>()
            const links: any[] = []

            // Center Node
            uniqueNodes.set(selectedNoteId, {
                id: selectedNoteId,
                name: selectedNote.title || 'Current Note',
                type: 'permanent',
                val: 20,
                color: '#ffffff'
            })

            // Outgoing
            outLinks.forEach((l: any) => {
                if (l.target_note) {
                    uniqueNodes.set(l.target_note.id, { id: l.target_note.id, name: l.target_note.title, type: l.target_note.type, val: 5 })
                    links.push({ source: selectedNoteId, target: l.target_note.id })
                }
            })

            // Incoming
            inLinks.forEach((l: any) => {
                if (l.source_note) {
                    uniqueNodes.set(l.source_note.id, { id: l.source_note.id, name: l.source_note.title, type: l.source_note.type, val: 5 })
                    links.push({ source: l.source_note.id, target: selectedNoteId })
                }
            })

            setGraphData({ nodes: Array.from(uniqueNodes.values()), links })
        }
        fetchData()
    }, [selectedNoteId, notes, supabase])

    // Autosave
    useEffect(() => {
        if (!selectedNoteId || !editTitle) return

        const timer = setTimeout(async () => {
            // Only save if changed (simple check could be added, but for now just save to ensure safely)
            // Ideally check against 'notes' find.
            const currentOriginal = notes.find(n => n.id === selectedNoteId)
            if (currentOriginal && (currentOriginal.content !== editContent || currentOriginal.title !== editTitle)) {

                // Silent save
                const result = await updateNote(selectedNoteId, {
                    title: editTitle,
                    content: editContent,
                })

                if (!result.error && result.data) {
                    setNotes(prev => prev.map(n => n.id === selectedNoteId ? (result.data as Note) : n))
                }
            }
        }, 2000) // 2s debounce

        return () => clearTimeout(timer)
    }, [editContent, editTitle, selectedNoteId])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mentionQuery !== null && mentionType) {
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                if (mentionType === 'wiki') {
                    const match = publicNotes.find(n => n.title.toLowerCase().includes(mentionQuery.toLowerCase()) && n.id !== selectedNoteId)
                    if (match) insertLink(match)
                } else if (mentionType === 'mention') {
                    const match = users.find(u =>
                        u.email.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                        (u.codex_name && u.codex_name.toLowerCase().includes(mentionQuery.toLowerCase()))
                    )
                    if (match) insertLink(match)
                }
            } else if (e.key === 'Escape') {
                setMentionQuery(null)
                setMentionType(null)
            }
        }
    }

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setEditContent(val)

        // Check triggers
        const cursor = e.target.selectionStart
        setCursorPosition(cursor)

        const textBefore = val.slice(0, cursor)
        const matchWiki = textBefore.match(/\[\[([\w\s]*)$/)
        const matchMention = textBefore.match(/@([\w]*)$/) // Simple mention: @name (no spaces for now)

        if (matchWiki) {
            setMentionQuery(matchWiki[1])
            setMentionType('wiki')
        } else if (matchMention) {
            setMentionQuery(matchMention[1])
            setMentionType('mention')
        } else {
            setMentionQuery(null)
            setMentionType(null)
        }
    }

    const insertLink = (item: Note | UserProfile) => {
        if (mentionQuery === null || !mentionType) return

        let prefix = ''
        let suffix = ''
        let text = ''

        if (mentionType === 'wiki') {
            prefix = '[['
            suffix = ']]'
            text = (item as Note).title
        } else {
            prefix = '@'
            suffix = ' ' // Add space after mention
            const u = item as UserProfile
            text = u.codex_name?.replace(/\s+/g, '') || u.email.split('@')[0]
        }

        const before = editContent.slice(0, cursorPosition - (mentionQuery.length + prefix.length))
        const after = editContent.slice(cursorPosition)

        const insertion = `${prefix}${text}${suffix}`
        const newContent = before + insertion + after

        setEditContent(newContent)
        setMentionQuery(null)
        setMentionType(null)

        const newCursorPos = before.length + insertion.length

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
            }
        }, 0)
    }

    const renderWikiContent = (content: string) => {
        if (!content) return null
        const parts = content.split(/(\[\[.*?\]\]|@\S+)/g)
        return parts.map((part, index) => {
            // Wiki Links
            if (part.startsWith('[[') && part.endsWith(']]')) {
                const title = part.slice(2, -2)
                const linkedNote = notes.find(n => n.title === title) || publicNotes.find(n => n.title === title)

                if (linkedNote) {
                    return (
                        <span
                            key={index}
                            className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleSelectNote(linkedNote)
                            }}
                        >
                            {title}
                        </span>
                    )
                }
                return <span key={index} className="text-muted-foreground opacity-70">{part}</span>
            }
            // Mentions
            if (part.startsWith('@')) {
                const handle = part.slice(1)
                // Just highlight valid looking mentions (or verify against users list if we want strictness)
                // For now, highlighting all @handle is robust enough for display
                return <span key={index} className="text-green-600 dark:text-green-400 font-semibold">{part}</span>
            }
            return <span key={index}>{part}</span>
        })
    }

    useEffect(() => {
        if (!user) return
        const fetchNotes = async () => {
            // Fetch my notes
            const { data } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
            if (data) setNotes(data as Note[])

            // Fetch ALL public notes for autocomplete (sources + permanent)
            const { data: pubData } = await supabase
                .from('notes')
                .select('*')
                .eq('is_public', true)
            if (pubData) setPublicNotes(pubData as Note[])

            // Fetch Users
            const { data: userData } = await supabase.from('users').select('id, email, codex_name')
            if (userData) setUsers(userData as UserProfile[])

            setLoading(false)
        }
        fetchNotes()
    }, [user, supabase])

    // Derived State
    const filteredNotes = notes.filter(n =>
        n.type === activeTab &&
        (n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.content.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const selectedNote = notes.find(n => n.id === selectedNoteId)
    // Also consider showing details for a selected PUBLIC note if we are browsing sources?
    // For now, My Notes page focuses on MY notes.

    // Actions
    const handleSelectNote = (note: Note) => {
        setSelectedNoteId(note.id)
        setEditTitle(note.title)
        setEditContent(note.content)
        setIsEditing(false)
        if (['fleeting', 'permanent', 'source'].includes(note.type)) {
            setActiveTab(note.type as any)
        }
    }

    const handleCreateNew = async () => {
        if (!user) return

        // Always force to Fleeting/Inbox
        setActiveTab('fleeting')
        const newNoteType = 'fleeting'
        const isPublic = false

        // Generate timestamp ID for fleeting notes
        const now = new Date()
        const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14)
        const initialTitle = timestamp

        const result = await createNote({
            user_id: user.id,
            title: initialTitle,
            content: '',
            type: newNoteType,
            is_public: isPublic
        })

        if (!result.error && result.data) {
            const newNote = result.data as Note
            setNotes([newNote, ...notes])
            handleSelectNote(newNote)
            setIsEditing(true)
        }
    }

    // Handle "New Note" action from URL
    useEffect(() => {
        if (!user || !searchParams) return
        const action = searchParams.get('action')

        const run = async () => {
            if (action === 'new' && !hasHandledNewRef.current) {
                hasHandledNewRef.current = true
                await handleCreateNew()
                router.replace('/my-notes')
            }
        }
        run()
    }, [user, searchParams, router])

    const handleSave = async () => {
        if (!selectedNoteId) return
        setIsSaving(true)

        // Generate fleeting title if needed (usually timestamp, but if user edits it? Fleeting notes usually don't have titles edit? 
        // "Fleeting notes: 1 point... Low stakes"
        // Let's allow editing title for Permanent. Fleeting usually keeps timestamp or auto-title?
        // Spec: "Fleeting note title is timestamp or auto-generated".
        // Let's assume user CAN edit it if they want, but default is timestamp.

        let finalTitle = editTitle
        if (activeTab === 'fleeting' && !finalTitle) finalTitle = 'Untitled'

        const result = await updateNote(selectedNoteId, {
            title: finalTitle,
            content: editContent,
        })

        if (!result.error && result.data) {
            setNotes(notes.map(n => n.id === selectedNoteId ? (result.data as Note) : n))
            setIsEditing(false)
            toast.success("Note saved")
        } else {
            toast.error("Failed to save note")
        }
        setIsSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return
        await deleteNote(id)
        setNotes(notes.filter(n => n.id !== id))
        if (selectedNoteId === id) setSelectedNoteId(null)
    }

    const handlePromoteAction = async (note: Note) => {
        // Validation: descriptive title required
        const titleToCheck = selectedNoteId === note.id ? editTitle : note.title
        const isTimestamp = /^\d+$/.test(titleToCheck.replace(/[-:T]/g, '')) || /^\d{4}-\d{2}-\d{2}/.test(titleToCheck)

        if (!titleToCheck || titleToCheck.trim() === 'Untitled' || titleToCheck.trim() === 'Untitled Note' || isTimestamp) {
            toast.error("Please give your note a descriptive title before promoting.")
            return
        }

        // Auto-save before promote if this is the active note
        if (selectedNoteId === note.id) {
            const saveResult = await updateNote(note.id, {
                title: editTitle,
                content: editContent,
                updated_at: new Date().toISOString()
            })
            if (saveResult.error) {
                toast.error("Failed to save changes before promotion.")
                return
            }
            // Update local state to reflect save
            setNotes(prev => prev.map(n => n.id === note.id ? (saveResult.data as Note) : n))
        }

        const result = await promoteNote(note.id)

        if (result.error) {
            toast.error(result.error)
            return
        }

        if (result.success) {
            // Note is now permanent!
            // Update local state
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, type: 'permanent', is_public: true } : n))

            setPromotionResult({
                success: true,
                feedback: result.feedback!,
                score: result.score!
            })
            setShowPromotionDialog(true)

            // Switch to permanent tab logic? Or just let it disappear from Fleeting tab?
            // Better to switch interaction:
            setActiveTab('permanent')
        } else {
            // Check failed (quality/coherence)
            setPromotionResult({
                success: false,
                feedback: result.feedback!,
                score: result.score!
            })
            setShowPromotionDialog(true)
        }
    }

    if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground">Loading Codex...</div>

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
            {/* Sidebar: Navigation & List */}
            <div className="w-80 flex-none flex flex-col border-r bg-muted/10">
                {/* Header / Tabs */}
                <div className="p-4 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg tracking-tight flex items-center gap-2">
                            <Layout className="h-5 w-5" />
                            Codex
                        </h2>
                        {activeTab !== 'source' && (
                            <Button onClick={handleCreateNew} size="sm" variant="default">
                                <PlusCircle className="h-4 w-4 mr-1" />
                                New
                            </Button>
                        )}
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => {
                        setActiveTab(v as any)
                        setSelectedNoteId(null)
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-9">
                            <TabsTrigger value="fleeting" className="text-xs">Inbox</TabsTrigger>
                            <TabsTrigger value="permanent" className="text-xs">Notes</TabsTrigger>
                            <TabsTrigger value="source" className="text-xs">Sources</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Note List */}
                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-1 p-2">
                        {filteredNotes.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No {activeTab === 'fleeting' ? 'inbox items' : activeTab === 'permanent' ? 'notes' : 'sources'} found.
                            </div>
                        ) : (
                            filteredNotes.map(note => (
                                <button
                                    key={note.id}
                                    onClick={() => handleSelectNote(note)}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-2 rounded-md text-left transition-all hover:bg-muted w-full overflow-hidden",
                                        selectedNoteId === note.id ? "bg-muted shadow-sm ring-1 ring-border" : "text-muted-foreground"
                                    )}
                                >
                                    <div className="flex w-full items-start justify-between gap-2 overflow-hidden">
                                        <span className={cn("font-semibold text-xs line-clamp-2 break-words leading-tight flex-1 min-w-0", !note.title && "italic text-muted-foreground")}>
                                            {note.title || "Untitled"}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground whitespace-nowrap flex-shrink-0 ml-auto pt-0.5">
                                            {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <span className="text-[10px] line-clamp-2 w-full text-muted-foreground/80">
                                        {note.content || "No content"}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Area: Editor / Viewer */}
            <div className="flex-1 flex flex-col bg-background relative min-w-0">
                {selectedNote ? (
                    <>
                        {/* Editor Toolbar */}
                        <div className="h-14 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {activeTab === 'fleeting' && <Badge variant="secondary"><Lightbulb className="h-3 w-3 mr-1" /> Inbox</Badge>}
                                {activeTab === 'permanent' && <Badge variant="secondary"><Brain className="h-3 w-3 mr-1" /> Note</Badge>}
                                {activeTab === 'source' && <Badge variant="secondary"><BookOpen className="h-3 w-3 mr-1" /> Source</Badge>}
                                <span className="text-xs ml-2 opacity-50">Last edited {new Date(selectedNote.updated_at).toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Promote Button for Inbox */}
                                {activeTab === 'fleeting' && (
                                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handlePromoteAction(selectedNote)}>
                                        <Brain className="h-4 w-4 mr-2" />
                                        Promote to Note
                                    </Button>
                                )}

                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(selectedNote.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                {isEditing ? (
                                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-3xl mx-auto py-12 px-8 space-y-6">
                                {/* Title - Always visible to allow renaming for promotion */}
                                <Textarea
                                    ref={titleRef}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="text-4xl font-bold border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50 resize-none overflow-hidden min-h-[3.5rem] py-2 whitespace-pre-wrap break-words"
                                    placeholder={activeTab === 'fleeting' ? "Note Title (Required for Promotion)..." : "Note Title..."}
                                    rows={1}
                                />
                                {activeTab === 'fleeting' && (
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Fleeting notes are private. Give it a descriptive title when you are ready to promote it.
                                    </p>
                                )}

                                <div className="relative min-h-[500px]">
                                    {isEditing ? (
                                        <>
                                            <Textarea
                                                ref={textareaRef}
                                                value={editContent}
                                                onChange={handleContentChange}
                                                onKeyDown={handleKeyDown}
                                                className="min-h-[500px] resize-none border-none shadow-none focus-visible:ring-0 px-0 text-lg leading-relaxed placeholder:text-muted-foreground/30 font-mono"
                                                placeholder="Start writing... Use [[ to link notes."
                                            />
                                            {/* Autocomplete Popup - Fixed to bottom right to avoid blocking text */}
                                            {mentionQuery !== null && (
                                                <div className="fixed bottom-8 right-8 w-72 bg-popover border rounded-md shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                                                    <div className="p-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                                                        {mentionType === 'wiki' ? 'Link to Note' : 'Mention User'}
                                                    </div>
                                                    <ScrollArea className="h-48">
                                                        <div className="p-1">
                                                            {mentionType === 'wiki' ? (
                                                                // Wiki Options
                                                                <>
                                                                    {publicNotes
                                                                        .filter(n => n.title.toLowerCase().includes(mentionQuery!.toLowerCase()) && n.id !== selectedNoteId)
                                                                        .map(n => (
                                                                            <button
                                                                                key={n.id}
                                                                                onClick={() => insertLink(n)}
                                                                                className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground truncate flex items-center gap-2 group"
                                                                            >
                                                                                {n.type === 'source' ? <BookOpen className="h-3 w-3 opacity-50 group-hover:opacity-100" /> : <Brain className="h-3 w-3 opacity-50 group-hover:opacity-100" />}
                                                                                <span className="truncate">{n.title}</span>
                                                                            </button>
                                                                        ))
                                                                    }
                                                                    {publicNotes.filter(n => n.title.toLowerCase().includes(mentionQuery!.toLowerCase())).length === 0 && (
                                                                        <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                                                                            No matching notes found
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                // Mention Options
                                                                <>
                                                                    {users
                                                                        .filter(u =>
                                                                            u.email.toLowerCase().includes(mentionQuery!.toLowerCase()) ||
                                                                            (u.codex_name && u.codex_name.toLowerCase().includes(mentionQuery!.toLowerCase()))
                                                                        )
                                                                        .map(u => (
                                                                            <button
                                                                                key={u.id}
                                                                                onClick={() => insertLink(u)}
                                                                                className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground truncate flex items-center gap-2 group"
                                                                            >
                                                                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mr-2">
                                                                                    {(u.codex_name || u.email)[0].toUpperCase()}
                                                                                </div>
                                                                                <span className="truncate">{u.codex_name || u.email.split('@')[0]}</span>
                                                                            </button>
                                                                        ))
                                                                    }
                                                                    {users.filter(u => u.email.toLowerCase().includes(mentionQuery!.toLowerCase()) || (u.codex_name && u.codex_name.toLowerCase().includes(mentionQuery!.toLowerCase()))).length === 0 && (
                                                                        <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                                                                            No matching users found
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-lg leading-relaxed font-mono whitespace-pre-wrap break-words py-2 cursor-text min-h-[500px]" onClick={() => setIsEditing(true)}>
                                            {renderWikiContent(selectedNote.content)}
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'permanent' && (
                                    <>
                                        <div className="mt-12 pt-8 border-t grid grid-cols-2 gap-8">
                                            {/* Backlinks */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                                    <Network className="h-4 w-4" />
                                                    Incoming Links
                                                </h3>
                                                {backlinks.length > 0 ? (
                                                    <div className="grid gap-2">
                                                        {backlinks.map(link => (
                                                            <button key={link.id} className="text-left text-sm bg-muted/30 p-2 rounded border hover:bg-muted" onClick={() => handleSelectNote(link.source_note)}>
                                                                <div className="font-medium text-primary text-xs">[[{link.source_note?.title}]]</div>
                                                                <p className="text-muted-foreground text-[10px] italic line-clamp-2">"{link.context}"</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : <p className="text-xs text-muted-foreground italic">No incoming links</p>}
                                            </div>

                                            {/* Outgoing Links */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                                    <ArrowRight className="h-4 w-4" />
                                                    Outgoing Links
                                                </h3>
                                                {outgoingLinks.length > 0 ? (
                                                    <div className="grid gap-2">
                                                        {outgoingLinks.map(link => (
                                                            <button key={link.id} className="text-left text-sm bg-muted/30 p-2 rounded border hover:bg-muted" onClick={() => handleSelectNote(link.target_note)}>
                                                                <div className="font-medium text-primary text-xs">[[{link.target_note?.title}]]</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : <p className="text-xs text-muted-foreground italic">No outgoing links</p>}
                                            </div>
                                        </div>

                                        {/* Local Graph */}
                                        <div className="mt-8 pt-8 border-t">
                                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                                <Brain className="h-4 w-4" />
                                                Local Graph
                                            </h3>
                                            <div className="h-[300px] w-full border rounded-lg overflow-hidden relative">
                                                {graphData.nodes.length > 0 && (
                                                    <ForceGraph
                                                        data={graphData}
                                                        nodeRelSize={8}
                                                        onNodeClick={(node) => {
                                                            const n = notes.find(n => n.id === node.id) || publicNotes.find(p => p.id === node.id)
                                                            if (n) handleSelectNote(n)
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-16 w-16 mb-4 opacity-20" />
                        <p>Select a note to view or edit</p>
                    </div>
                )
                }
            </div >

            <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={promotionResult?.success ? "text-green-600 flex items-center gap-2" : "text-amber-600 flex items-center gap-2"}>
                            {promotionResult?.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            {promotionResult?.success ? "Promotion Successful!" : "Promotion Failed"}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            <div className="space-y-2">
                                <p className="font-medium text-foreground">Score: {promotionResult?.score}/4</p>
                                <p className="text-sm bg-muted p-3 rounded-md">{promotionResult?.feedback}</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setShowPromotionDialog(false)}>
                            {promotionResult?.success ? "Continue" : "Revise Note"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
