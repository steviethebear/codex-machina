'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Database } from '@/types/database.types'
import { MarkdownRenderer } from '@/components/markdown/renderer'
import { ChevronRight, Search, Hash, Calendar, ArrowRight, Edit, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EditNoteDialog } from '@/components/graph/edit-note-dialog'
import { LinkDialog } from '@/components/graph/link-dialog'

type Note = Database['public']['Tables']['atomic_notes']['Row'] & {
    users?: { codex_name: string | null } | null
}

type LinkType = {
    id: string
    to_note_id?: string
    from_note_id?: string
    atomic_notes_links_to_note_id_fkey?: Note | null
    atomic_notes_links_from_note_id_fkey?: Note | null
}

export default function NotebookPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const [notes, setNotes] = useState<Note[]>([])
    const [allNotes, setAllNotes] = useState<Note[]>([])
    const [noteLinks, setNoteLinks] = useState<Map<string, { outgoing: Note[], incoming: Note[] }>>(new Map())
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)

    useEffect(() => {
        const fetchNotebook = async () => {
            if (!user) return

            // Fetch user's atoms
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
                if (typedNotes.length > 0) {
                    setSelectedNote(typedNotes[0])
                }

                // Fetch links for each note
                const linksMap = new Map<string, { outgoing: Note[], incoming: Note[] }>()
                for (const note of typedNotes) {
                    const { data: links } = await supabase
                        .from('links')
                        .select(`
                            id,
                            to_note_id,
                            from_note_id,
                            atomic_notes_links_to_note_id_fkey:atomic_notes!links_to_note_id_fkey(*),
                            atomic_notes_links_from_note_id_fkey:atomic_notes!links_from_note_id_fkey(*)
                        `)
                        .or(`from_note_id.eq.${note.id},to_note_id.eq.${note.id}`)

                    if (links) {
                        const outgoing: Note[] = []
                        const incoming: Note[] = []

                        links.forEach((link: any) => {
                            if (link.from_note_id === note.id && link.atomic_notes_links_to_note_id_fkey) {
                                outgoing.push(link.atomic_notes_links_to_note_id_fkey)
                            } else if (link.to_note_id === note.id && link.atomic_notes_links_from_note_id_fkey) {
                                incoming.push(link.atomic_notes_links_from_note_id_fkey)
                            }
                        })
                        linksMap.set(note.id, { outgoing, incoming })
                    }
                }
                setNoteLinks(linksMap)
            }

            setLoading(false)
        }

        fetchNotebook()
    }, [user, supabase])

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
                    setSelectedNote(data as any)
                    // Update in the notes list too
                    setNotes(prev => prev.map(n => n.id === data.id ? data as any : n))
                    setAllNotes(prev => prev.map(n => n.id === data.id ? data as any : n))
                }
            }
            fetchUpdatedNote()
        }
    }

    // Filter notes by search
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setNotes(allNotes)
        } else {
            const filtered = allNotes.filter(note =>
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.body.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setNotes(filtered)
        }
    }, [searchQuery, allNotes])

    if (loading) return <div className="min-h-screen bg-[#1e1e1e] text-gray-200 p-6">Loading...</div>

    return (
        <div className="min-h-screen bg-[#1e1e1e] text-gray-200 flex">
            {/* Sidebar - File Explorer */}
            <div className="w-64 border-r border-gray-800 bg-[#252525] overflow-y-auto">
                <div className="p-4 border-b border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#1e1e1e] border-gray-700 text-gray-200 placeholder:text-gray-500"
                        />
                    </div>
                </div>
                <div className="p-2">
                    {notes.map((note) => (
                        <button
                            key={note.id}
                            onClick={() => setSelectedNote(note)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedNote?.id === note.id
                                ? 'bg-[#2d2d30] text-white'
                                : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200'
                                }`}
                        >
                            <div className="truncate">
                                <MarkdownRenderer content={note.title} className="prose-invert prose-sm prose-p:inline prose-p:m-0" />
                            </div>
                        </button>
                    ))}
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

                        {/* Outgoing Links */}
                        {noteLinks.get(selectedNote.id)?.outgoing && noteLinks.get(selectedNote.id)!.outgoing.length > 0 && (
                            <div className="mb-8 pb-8 border-b border-gray-800">
                                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">
                                    Linked Notes
                                </h3>
                                <div className="space-y-2">
                                    {noteLinks.get(selectedNote.id)!.outgoing.map((linkedNote) => (
                                        <button
                                            key={linkedNote.id}
                                            onClick={() => setSelectedNote(linkedNote)}
                                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors group"
                                        >
                                            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                            <span>{linkedNote.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Backlinks */}
                        {noteLinks.get(selectedNote.id)?.incoming && noteLinks.get(selectedNote.id)!.incoming.length > 0 && (
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-semibold">
                                    Backlinks ({noteLinks.get(selectedNote.id)!.incoming.length})
                                </h3>
                                <div className="space-y-2">
                                    {noteLinks.get(selectedNote.id)!.incoming.map((linkedNote) => (
                                        <button
                                            key={linkedNote.id}
                                            onClick={() => setSelectedNote(linkedNote)}
                                            className="block text-sm text-gray-400 hover:text-gray-200 transition-colors"
                                        >
                                            <div className="font-medium text-gray-300">{linkedNote.title}</div>
                                            <div className="text-xs text-gray-600 mt-1 truncate">{linkedNote.body.substring(0, 100)}...</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select a note to view</p>
                    </div>
                )}
            </div>

            {/* Dialogs */}
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
