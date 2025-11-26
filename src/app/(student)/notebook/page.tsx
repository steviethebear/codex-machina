'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Database } from '@/types/database.types'
import { MarkdownRenderer } from '@/components/markdown/renderer'
import { ChevronRight, Search, Hash, Calendar, ArrowRight, ArrowLeft, Edit, Link as LinkIcon, Book, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EditNoteDialog } from '@/components/graph/edit-note-dialog'
import { LinkDialog } from '@/components/graph/link-dialog'
import { CreateNoteDialog } from '@/components/graph/create-note-dialog'
import { CommandPalette } from '@/components/command-palette'
import { TagFilter } from '@/components/tags/tag-filter'
import ForceGraph from '@/components/graph/force-graph'

type Tag = Database['public']['Tables']['tags']['Row']
type Note = Database['public']['Tables']['atomic_notes']['Row'] & {
    users?: { codex_name: string | null } | null
    tags?: Tag[]
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
    const { user } = useAuth()
    const supabase = createClient()
    const [notes, setNotes] = useState<Note[]>([])
    const [allNotes, setAllNotes] = useState<Note[]>([])
    const [noteLinks, setNoteLinks] = useState<Map<string, { outgoing: Note[], incoming: Note[], texts: TextLink[] }>>(new Map())
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'date' | 'title' | 'connections'>('date')
    const [loading, setLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [selectedTagFilter, setSelectedTagFilter] = useState<Tag[]>([])
    const [availableTags, setAvailableTags] = useState<Tag[]>([])

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
                    )
                `)
                .eq('author_id', user.id)
                .eq('moderation_status', 'approved')
                .order('created_at', { ascending: false })

            if (notesData) {
                // Transform note_tags array to tags array
                const typedNotes = notesData.map((note: any) => ({
                    ...note,
                    tags: note.note_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
                }))
                setNotes(typedNotes)
                setAllNotes(typedNotes)

                // Extract unique tags from all notes
                const tagsMap = new Map<string, Tag>()
                typedNotes.forEach((note: any) => {
                    note.tags?.forEach((tag: Tag) => {
                        if (!tagsMap.has(tag.id)) {
                            tagsMap.set(tag.id, tag)
                        }
                    })
                })
                const uniqueTags = Array.from(tagsMap.values()).sort((a, b) => b.usage_count - a.usage_count)
                setAvailableTags(uniqueTags)

                if (typedNotes.length > 0) {
                    setSelectedNote(typedNotes[0])
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
            }

            setLoading(false)
        }

        fetchNotebook()
    }, [user, supabase])

    const refreshNotebook = () => {
        // Reload all notes and links
        const fetchUpdatedNotebook = async () => {
            if (!user) return

            const { data: notesData } = await supabase
                .from('atomic_notes')
                .select('*, users:users!atomic_notes_author_id_fkey(codex_name)')
                .eq('author_id', user.id)
                .eq('moderation_status', 'approved')
                .order('created_at', { ascending: false })

            if (notesData) {
                const typedNotes = notesData as any[]
                setNotes(typedNotes)
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
                    .select('*, users:users!atomic_notes_author_id_fkey(codex_name)')
                    .eq('id', selectedNote.id)
                    .single()

                if (data) {
                    const updatedNote = data as any
                    setSelectedNote(updatedNote)
                    // Update in the notes list too
                    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
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

    // Filter notes by search and tags
    useEffect(() => {
        if (searchQuery.trim() === '' && selectedTagFilter.length === 0) {
            // No filters, just sort
            const sorted = [...allNotes].sort((a, b) => {
                if (sortBy === 'date') {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                } else if (sortBy === 'title') {
                    return a.title.localeCompare(b.title)
                } else { // connections
                    const aLinks = (noteLinks.get(a.id)?.outgoing.length || 0) + (noteLinks.get(a.id)?.incoming.length || 0)
                    const bLinks = (noteLinks.get(b.id)?.incoming.length || 0) + (noteLinks.get(b.id)?.outgoing.length || 0)
                    return bLinks - aLinks
                }
            })
            setNotes(sorted)
        } else {
            // Apply search filter (only if search query exists)
            let filtered = allNotes
            if (searchQuery.trim()) {
                filtered = filtered.filter(note =>
                    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    note.body.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }

            // Apply tag filter (notes must have ALL selected tags)
            if (selectedTagFilter.length > 0) {
                filtered = filtered.filter(note => {
                    const noteTags = note.tags || []
                    return selectedTagFilter.every(selectedTag =>
                        noteTags.some(noteTag => noteTag.id === selectedTag.id)
                    )
                })
            }

            // Apply sorting to filtered results
            const sorted = [...filtered].sort((a, b) => {
                if (sortBy === 'date') {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                } else if (sortBy === 'title') {
                    return a.title.localeCompare(b.title)
                } else { // connections
                    const aLinks = (noteLinks.get(a.id)?.outgoing.length || 0) + (noteLinks.get(a.id)?.incoming.length || 0)
                    const bLinks = (noteLinks.get(b.id)?.outgoing.length || 0) + (noteLinks.get(b.id)?.incoming.length || 0)
                    return bLinks - aLinks
                }
            })
            setNotes(sorted)
        }
    }, [searchQuery, allNotes, sortBy, noteLinks, selectedTagFilter])

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
                setCreateDialogOpen(true)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    if (loading) return <div className="min-h-screen bg-[#1e1e1e] text-gray-200 p-6">Loading...</div>

    return (
        <div className="min-h-screen bg-[#1e1e1e] text-gray-200 flex">
            {/* Sidebar - File Explorer */}
            <div className="w-64 border-r border-gray-800 bg-[#252525] overflow-y-auto">
                <div className="p-4 border-b border-gray-800 space-y-3">
                    {/* Note count */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">My Notes</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="text-xs bg-gray-800 border-gray-700 rounded px-2 py-1 text-gray-400 hover:text-gray-200"
                        >
                            <option value="date">Date</option>
                            <option value="title">Title</option>
                            <option value="connections">Connections</option>
                        </select>
                    </div>
                    <div className="text-xs text-gray-600">
                        {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#1e1e1e] border-gray-700 text-gray-200 placeholder:text-gray-500"
                        />
                    </div>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="w-full"
                        size="sm"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Note
                    </Button>

                    {availableTags.length > 0 && (
                        <>
                            <div className="my-3 border-t border-gray-700" />
                            <TagFilter
                                availableTags={availableTags}
                                selectedTags={selectedTagFilter}
                                onTagsChange={setSelectedTagFilter}
                            />
                        </>
                    )}
                </div>
                <div className="p-2">
                    {notes.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 space-y-2">
                            <p className="text-sm">
                                {searchQuery ? 'No notes match your search' : 'No notes yet'}
                            </p>
                            {!searchQuery && (
                                <p className="text-xs text-gray-600">
                                    Click "Create Note" to get started
                                </p>
                            )}
                        </div>
                    ) : (
                        notes.map((note) => (
                            <button
                                key={note.id}
                                onClick={() => setSelectedNote(note)}
                                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedNote?.id === note.id
                                    ? 'bg-[#2d2d30] text-white'
                                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
                                    }`}
                            >
                                <div className="space-y-1">
                                    <div className="truncate">
                                        <MarkdownRenderer content={note.title} className="prose-invert prose-sm prose-p:inline prose-p:m-0" />
                                    </div>
                                    {note.tags && note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {note.tags.slice(0, 2).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-1.5 py-0.5 bg-gray-700 rounded text-gray-300"
                                                >
                                                    {tag.display_name}
                                                </span>
                                            ))}
                                            {note.tags.length > 2 && (
                                                <span className="text-xs text-gray-600">+{note.tags.length - 2}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </button>
                        )))
                    }
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {selectedNote ? (
                    <div className="max-w-4xl mx-auto px-12 py-12">
                        {/* Title */}
                        <h1 className="text-4xl font-bold mb-2 text-white">
                            {selectedNote.title}
                        </h1>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditDialogOpen(true)}
                                className="text-xs"
                            >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLinkDialogOpen(true)}
                                className="text-xs"
                            >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Connect
                            </Button>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                <span className="capitalize">{selectedNote.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(selectedNote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="prose prose-invert prose-lg max-w-none mb-12">
                            <MarkdownRenderer content={selectedNote.body} />
                        </div>

                        {/* Linked Notes (Outgoing and Incoming) */}
                        {((noteLinks.get(selectedNote.id)?.outgoing && noteLinks.get(selectedNote.id)!.outgoing.length > 0) ||
                            (noteLinks.get(selectedNote.id)?.incoming && noteLinks.get(selectedNote.id)!.incoming.length > 0)) && (
                                <div className="mb-8 pb-8">
                                    <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">
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
                            )}

                        {/* Linked Texts */}
                        {noteLinks.get(selectedNote.id)?.texts && noteLinks.get(selectedNote.id)!.texts.length > 0 && (
                            <div className="mb-8 pt-8 border-t border-gray-800">
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
                        )}

                        {/* Local Graph */}
                        <div className="mt-8 pt-8 border-t border-gray-800">
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
                onSelectNote={(note) => setSelectedNote(note)}
            />
            <CreateNoteDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                sourceAtom={null}
                onAtomCreated={refreshNotebook}
            />
            {selectedNote && (
                <>
                    <EditNoteDialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        note={selectedNote}
                        onNoteUpdated={refreshNote}
                    />
                    <LinkDialog
                        open={linkDialogOpen}
                        onOpenChange={setLinkDialogOpen}
                        sourceNote={selectedNote}
                        onLinkCreated={refreshNote}
                    />
                </>
            )}
        </div>
    )
}
