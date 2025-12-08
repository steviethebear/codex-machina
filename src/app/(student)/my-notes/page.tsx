'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createNote, updateNote, deleteNote } from '@/lib/actions/notes'
import { FileText, Lightbulb, BookOpen, Brain, PlusCircle, Trash2, Search, Save, MoreVertical, Layout } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Note {
    id: string
    title: string
    content: string
    type: 'fleeting' | 'literature' | 'permanent'
    is_public: boolean
    citation?: string
    page_number?: string
    created_at: string
    updated_at: string
}

export default function NotebookPage() {
    const { user } = useAuth()
    const supabase = createClient()

    // Data State
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)

    // UI State
    const [activeTab, setActiveTab] = useState<'fleeting' | 'permanent' | 'literature'>('fleeting')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Editor State
    const [editTitle, setEditTitle] = useState('')
    const [editContent, setEditContent] = useState('')
    const [editCitation, setEditCitation] = useState('')

    // Mention State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [cursorPosition, setCursorPosition] = useState(0)

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setEditContent(val)

        // Check for menton
        const cursor = e.target.selectionStart
        setCursorPosition(cursor)

        const textBefore = val.slice(0, cursor)
        const match = textBefore.match(/@(\w*)$/)

        if (match) {
            setMentionQuery(match[1])
        } else {
            setMentionQuery(null)
        }
    }

    const insertMention = (note: Note) => {
        if (mentionQuery === null) return

        const before = editContent.slice(0, cursorPosition - (mentionQuery.length + 1))
        const after = editContent.slice(cursorPosition)
        // Markdown link format: [Title](/notes/id)
        const link = `[${note.title}](/notes/${note.id})`

        const newContent = before + link + after
        setEditContent(newContent)
        setMentionQuery(null)

        // TODO: ideally move cursor to end of link
    }

    useEffect(() => {
        if (!user) return
        const fetchNotes = async () => {
            const { data } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
            if (data) setNotes(data as Note[])
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

    // Actions
    const handleSelectNote = (note: Note) => {
        setSelectedNoteId(note.id)
        setEditTitle(note.title)
        setEditContent(note.content)
        setEditCitation(note.citation || '')
        setIsEditing(false)
    }

    const handleCreateNew = async () => {
        if (!user) return

        // Define new note defaults
        const newNoteType = activeTab
        const isPublic = newNoteType !== 'fleeting'

        // Generate timestamp ID for fleeting notes
        let initialTitle = 'Untitled Note'
        if (newNoteType === 'fleeting') {
            const now = new Date()
            const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14)
            initialTitle = timestamp
        }

        const result = await createNote({
            user_id: user.id,
            title: newNoteType === 'fleeting' ? initialTitle : 'Untitled Note',
            content: '',
            type: newNoteType,
            is_public: isPublic
        })

        if (!result.error && result.data) {
            const newNote = result.data as Note
            setNotes([newNote, ...notes])
            handleSelectNote(newNote)
            setIsEditing(true) // focus editor immediately?
        }
    }

    const handleSave = async () => {
        if (!selectedNoteId) return
        setIsSaving(true)

        // Generate fleeting title if needed
        let finalTitle = editTitle
        if (activeTab === 'fleeting') finalTitle = ''

        const result = await updateNote(selectedNoteId, {
            title: finalTitle,
            content: editContent,
            citation: activeTab === 'literature' ? editCitation : undefined
        })

        if (!result.error && result.data) {
            setNotes(notes.map(n => n.id === selectedNoteId ? (result.data as Note) : n))
            setIsEditing(false)
        }
        setIsSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return
        await deleteNote(id)
        setNotes(notes.filter(n => n.id !== id))
        if (selectedNoteId === id) setSelectedNoteId(null)
    }

    const handlePromote = async (note: Note) => {
        // Create new permanent note with this content
        if (!user) return
        const result = await createNote({
            user_id: user.id,
            title: '', // User will fill this in
            content: note.content,
            type: 'permanent',
            is_public: true
        })

        if (!result.error && result.data) {
            // Delete old fleeting note
            await deleteNote(note.id)

            // Update local state
            setNotes(prev => [result.data as Note, ...prev.filter(n => n.id !== note.id)])

            // Switch tab and select new note
            setActiveTab('permanent')
            handleSelectNote(result.data as Note)
        }
    }

    if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground">Loading Codex...</div>

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
            {/* Sidebar: Navigation & List */}
            <div className="w-80 flex flex-col border-r bg-muted/10">
                {/* Header / Tabs */}
                <div className="p-4 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg tracking-tight flex items-center gap-2">
                            <Layout className="h-5 w-5" />
                            Codex
                        </h2>
                        <Button onClick={handleCreateNew} size="sm" variant="default">
                            <PlusCircle className="h-4 w-4 mr-1" />
                            New
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => {
                        setActiveTab(v as any)
                        setSelectedNoteId(null)
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-9">
                            <TabsTrigger value="fleeting" className="text-xs">Inbox</TabsTrigger>
                            <TabsTrigger value="permanent" className="text-xs">Notes</TabsTrigger>
                            <TabsTrigger value="literature" className="text-xs">Sources</TabsTrigger>
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
                                        "flex flex-col items-start gap-1 p-3 rounded-md text-left transition-all hover:bg-muted",
                                        selectedNoteId === note.id ? "bg-muted shadow-sm ring-1 ring-border" : "text-muted-foreground"
                                    )}
                                >
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <span className={cn("font-medium text-sm truncate flex-1 min-w-0", !note.title && "italic text-muted-foreground")}>
                                            {note.title || "Untitled"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-auto">
                                            {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <span className="text-xs line-clamp-2 w-full text-muted-foreground/80">
                                        {note.content || "No content"}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Area: Editor / Viewer */}
            <div className="flex-1 flex flex-col bg-background relative">
                {selectedNote ? (
                    <>
                        {/* Editor Toolbar */}
                        <div className="h-14 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {activeTab === 'fleeting' && <Badge variant="secondary"><Lightbulb className="h-3 w-3 mr-1" /> Inbox</Badge>}
                                {activeTab === 'permanent' && <Badge variant="secondary"><Brain className="h-3 w-3 mr-1" /> Note</Badge>}
                                {activeTab === 'literature' && <Badge variant="secondary"><BookOpen className="h-3 w-3 mr-1" /> Source</Badge>}
                                <span className="text-xs ml-2 opacity-50">Last edited {new Date(selectedNote.updated_at).toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Promote Button for Inbox */}
                                {activeTab === 'fleeting' && (
                                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handlePromote(selectedNote)}>
                                        <Brain className="h-4 w-4 mr-2" />
                                        Promote to Note
                                    </Button>
                                )}

                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(selectedNote.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-3xl mx-auto py-12 px-8 space-y-6">
                                {/* Title (Hidden for Inbox) */}
                                {activeTab !== 'fleeting' && (
                                    <Input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="text-4xl font-bold border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto"
                                        placeholder="Note Title..."
                                    />
                                )}

                                {/* Citation Field (Sources only) */}
                                {activeTab === 'literature' && (
                                    <div className="bg-muted/30 p-4 rounded-lg -mx-4 border border-border/50">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Source Citation</Label>
                                        <Input
                                            value={editCitation}
                                            onChange={(e) => setEditCitation(e.target.value)}
                                            className="bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto font-mono text-sm"
                                            placeholder="Author. Title. Publisher, Year."
                                        />
                                    </div>
                                )}

                                <div className="relative">
                                    <Textarea
                                        value={editContent}
                                        onChange={handleContentChange}
                                        className="min-h-[500px] resize-none border-none shadow-none focus-visible:ring-0 px-0 text-lg leading-relaxed placeholder:text-muted-foreground/30 font-mono"
                                        placeholder="Start writing..."
                                    />
                                    {/* Mention Popup */}
                                    {mentionQuery !== null && (
                                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border rounded-md shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="p-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                                                Link to Note
                                            </div>
                                            <ScrollArea className="h-48">
                                                <div className="p-1">
                                                    {notes
                                                        .filter(n => n.title.toLowerCase().includes(mentionQuery.toLowerCase()) && n.id !== selectedNoteId)
                                                        .map(n => (
                                                            <button
                                                                key={n.id}
                                                                onClick={() => insertMention(n)}
                                                                className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground truncate flex items-center gap-2"
                                                            >
                                                                <FileText className="h-3 w-3 opacity-50" />
                                                                {n.title || n.id}
                                                            </button>
                                                        ))
                                                    }
                                                    {notes.filter(n => n.title.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
                                                        <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                                                            No matching notes found
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-16 w-16 mb-4 opacity-20" />
                        <p>Select a note to view or edit</p>
                    </div>
                )}
            </div>
        </div>
    )
}
