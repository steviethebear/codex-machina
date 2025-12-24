'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createNote } from '@/lib/actions/notes'
import { Lightbulb, BookOpen, Brain, PlusCircle, Search, Layout } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { NoteSlideOver } from '@/components/NoteSlideOver'
import { NoteEditor } from '@/components/pkm/NoteEditor'
import { ConnectionsPanel } from '@/components/pkm/ConnectionsPanel'
import { Database } from '@/types/database.types'

const ForceGraph = dynamic(() => import('@/components/graph/force-graph'), {
    ssr: false,
    loading: () => <div className="p-4 text-sm text-muted-foreground">Loading Graph...</div>
})

type Note = Database['public']['Tables']['notes']['Row']

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
    const [slideOverNote, setSlideOverNote] = useState<Note | null>(null)
    const [showPromotionDialog, setShowPromotionDialog] = useState(false)

    // Graph Data
    const [backlinks, setBacklinks] = useState<any[]>([])
    const [outgoingLinks, setOutgoingLinks] = useState<any[]>([])
    const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })

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
                supabase.from('connections').select('*, target_note:target_note_id(*)').eq('source_note_id', selectedNoteId),
                supabase.from('connections').select('*, source_note:source_note_id(*)').eq('target_note_id', selectedNoteId)
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
    const currentList = activeTab === 'source'
        ? publicNotes.filter(n => n.type === 'source')
        : notes.filter(n => n.type === activeTab)

    const filteredNotes = currentList.filter(n =>
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedNote = notes.find(n => n.id === selectedNoteId) || publicNotes.find(n => n.id === selectedNoteId)

    // Actions
    const handleSelectNote = (note: Note) => {
        setSelectedNoteId(note.id)
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
        }
    }

    // Handle URL Actions (New Note / Open Specific Note)
    useEffect(() => {
        if (!user || !searchParams) return
        const action = searchParams.get('action')
        const noteId = searchParams.get('noteId')

        const run = async () => {
            // Handle "New Note"
            if (action === 'new' && !hasHandledNewRef.current) {
                hasHandledNewRef.current = true
                await handleCreateNew()
                // Clear query param to prevent duplicate creation on refresh
                router.replace('/my-notes')
            }

            // Handle "Open Note" (Deep Link)
            if (noteId && notes.length > 0) {
                const target = notes.find(n => n.id === noteId) || publicNotes.find(n => n.id === noteId)
                if (target) {
                    handleSelectNote(target)
                    router.replace('/my-notes')
                }
            }
        }
        run()
    }, [user, searchParams, notes, publicNotes])

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
                        <NoteEditor
                            key={selectedNote.id}
                            note={selectedNote as Note}
                            onUpdate={(updatedNote) => {
                                setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
                                setPublicNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
                            }}
                            onDelete={() => {
                                setSelectedNoteId(null)
                                setNotes(prev => prev.filter(n => n.id !== selectedNote.id))
                            }}
                            onLinkClick={async (title) => {
                                // Find Note and Open SlideOver
                                const n = notes.find(n => n.title === title) || publicNotes.find(p => p.title === title)
                                if (n) setSlideOverNote(n)
                                else {
                                    // Fetch if not in list (though publicNotes usually has all)
                                    const { data } = await supabase.from('notes').select('*').eq('title', title).single()
                                    if (data) setSlideOverNote(data as Note)
                                }
                            }}
                            className="flex-1 overflow-hidden"
                        />

                        {/* Bottom Panel for Permanent & Source Notes: Backlinks & Local Graph */}
                        {(activeTab === 'permanent' || activeTab === 'source') && (
                            <div className="h-[400px] flex gap-4 border-t bg-muted/10 p-4 shrink-0 overflow-hidden">
                                {/* Left: Connections List */}
                                <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
                                    <ConnectionsPanel
                                        noteId={selectedNote.id}
                                        onNoteClick={(n) => setSlideOverNote(n)}
                                    />
                                </div>

                                {/* Right: Local Graph */}
                                <div className="flex-1 border rounded bg-background overflow-hidden relative shadow-inner">
                                    <div className="absolute top-2 left-2 z-10 text-[10px] font-bold text-muted-foreground bg-background/80 px-2 py-1 rounded border">LOCAL GRAPH</div>
                                    <ForceGraph
                                        data={graphData}
                                        onNodeClick={async (node) => {
                                            let n = notes.find(n => n.id === node.id) || publicNotes.find(p => p.id === node.id)
                                            if (!n) {
                                                const { data } = await supabase.from('notes').select('*').eq('id', node.id).single()
                                                if (data) n = data as Note
                                            }
                                            if (n) setSlideOverNote(n)
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <Brain className="h-16 w-16 mb-4 opacity-20" />
                        <p>Select a note to view or edit</p>
                    </div>
                )}
            </div>

            <NoteSlideOver
                open={!!slideOverNote}
                note={slideOverNote as Note}
                onClose={() => setSlideOverNote(null)}
                // Open Full Page
                onOpenNote={(n) => handleSelectNote(n as Note)}
                // Drill Down
                onNavigate={(n) => setSlideOverNote(n as Note)}
            />
        </div>
    )
}
