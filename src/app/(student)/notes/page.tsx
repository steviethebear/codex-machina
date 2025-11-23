'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Database } from '@/types/database.types'
import Link from 'next/link'
import { PlusCircle, Filter, GitBranch, Link as LinkIcon, Edit3, X } from 'lucide-react'
import { CreateNoteDialog } from '@/components/graph/create-note-dialog'
import { LinkDialog } from '@/components/graph/link-dialog'
import { EditNoteDialog } from '@/components/graph/edit-note-dialog'
import { Combobox } from '@/components/ui/combobox'

type Note = Database['public']['Tables']['atomic_notes']['Row'] & {
    users: { codex_name: string | null } | null
    texts: { title: string | null } | null
}

export default function NotesPage() {
    const supabase = createClient()
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [userFilter, setUserFilter] = useState<string>('all')
    const [textFilter, setTextFilter] = useState<string>('all')

    // Filter Options
    const [authors, setAuthors] = useState<{ id: string, name: string }[]>([])
    const [texts, setTexts] = useState<{ id: string, title: string }[]>([])

    // Dialog States
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        let query = supabase
            .from('atomic_notes')
            .select(`
                *,
                users (codex_name),
                texts (title)
            `)
            .eq('hidden', false)
            .neq('moderation_status', 'rejected') // Exclude rejected atoms
            .order('created_at', { ascending: false })

        if (typeFilter !== 'all') {
            query = query.eq('type', typeFilter)
        }
        if (userFilter !== 'all') {
            query = query.eq('author_id', userFilter)
        }
        if (textFilter !== 'all') {
            query = query.eq('text_id', textFilter)
        }

        const { data } = await query
        if (data) setNotes(data as unknown as Note[])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [supabase, typeFilter, userFilter, textFilter])

    // Fetch filter options on mount
    useEffect(() => {
        const fetchOptions = async () => {
            const { data: users } = await supabase.from('users').select('id, codex_name')
            if (users) setAuthors((users as any[]).map(u => ({ id: u.id, name: u.codex_name || 'Unknown' })))

            const { data: txts } = await supabase.from('texts').select('id, title')
            if (txts) setTexts((txts as any[]).map(t => ({ id: t.id, title: t.title })))
        }
        fetchOptions()
    }, [supabase])

    const handleAction = (note: Note, action: 'branch' | 'connect' | 'expand') => {
        setSelectedNote(note)
        if (action === 'branch') setCreateDialogOpen(true)
        if (action === 'connect') setLinkDialogOpen(true)
        if (action === 'expand') setEditDialogOpen(true)
    }

    const handleResetFilters = () => {
        setTypeFilter('all')
        setUserFilter('all')
        setTextFilter('all')
    }

    const hasActiveFilters = typeFilter !== 'all' || userFilter !== 'all' || textFilter !== 'all'

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Atoms</h2>
                    <p className="text-muted-foreground">The collective knowledge base.</p>
                </div>
                <Link href="/notes/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Atom
                    </Button>
                </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <Combobox
                    options={[
                        { value: 'all', label: 'All Types' },
                        { value: 'idea', label: 'Idea' },
                        { value: 'question', label: 'Question' },
                        { value: 'quote', label: 'Quote' },
                        { value: 'insight', label: 'Insight' }
                    ]}
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                    placeholder="Select type..."
                />

                <Combobox
                    options={[
                        { value: 'all', label: 'All Authors' },
                        ...authors.map(a => ({ value: a.id, label: a.name }))
                    ]}
                    value={userFilter}
                    onValueChange={setUserFilter}
                    placeholder="Select author..."
                />

                <Combobox
                    options={[
                        { value: 'all', label: 'All Texts' },
                        ...texts.map(t => ({ value: t.id, label: t.title }))
                    ]}
                    value={textFilter}
                    onValueChange={setTextFilter}
                    placeholder="Select text..."
                />

                {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={handleResetFilters}>
                        <X className="mr-1 h-3 w-3" />
                        Reset Filters
                    </Button>
                )}
            </div>

            {loading ? (
                <div>Loading atoms...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {notes.length === 0 ? (
                        <p className="text-muted-foreground col-span-full">No atoms found.</p>
                    ) : (
                        notes.map((note) => (
                            <Card key={note.id} className="flex flex-col h-full hover:bg-muted/50 transition-colors">
                                <Link href={`/notes/${note.id}`} className="flex-1">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
                                            <span
                                                className="text-xs font-mono px-2 py-0.5 rounded border"
                                                style={{
                                                    borderColor:
                                                        note.type === 'idea' ? '#00f0ff' :
                                                            note.type === 'question' ? '#ff003c' :
                                                                note.type === 'quote' ? '#7000ff' :
                                                                    note.type === 'insight' ? '#ffe600' : '#888',
                                                    color:
                                                        note.type === 'idea' ? '#00f0ff' :
                                                            note.type === 'question' ? '#ff003c' :
                                                                note.type === 'quote' ? '#7000ff' :
                                                                    note.type === 'insight' ? '#ffe600' : '#888',
                                                    backgroundColor:
                                                        note.type === 'idea' ? '#00f0ff1a' :
                                                            note.type === 'question' ? '#ff003c1a' :
                                                                note.type === 'quote' ? '#7000ff1a' :
                                                                    note.type === 'insight' ? '#ffe6001a' : '#8888881a'
                                                }}
                                            >
                                                {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>by {note.users?.codex_name || 'Unknown'}</span>
                                            {note.texts?.title && <span className="italic truncate max-w-[120px]">{note.texts.title}</span>}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {note.body}
                                        </p>
                                    </CardContent>
                                </Link>
                                <CardFooter className="pt-2 border-t flex justify-between bg-muted/20">
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleAction(note, 'connect')}>
                                        <LinkIcon className="mr-1 h-3 w-3" /> Connect
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleAction(note, 'branch')}>
                                        <GitBranch className="mr-1 h-3 w-3" /> Branch
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleAction(note, 'expand')}>
                                        <Edit3 className="mr-1 h-3 w-3" /> Expand
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Action Dialogs */}
            <CreateNoteDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                sourceAtom={selectedNote}
                onAtomCreated={fetchData}
            />
            <LinkDialog
                open={linkDialogOpen}
                onOpenChange={setLinkDialogOpen}
                sourceNote={selectedNote}
                onLinkCreated={fetchData}
            />
            <EditNoteDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                note={selectedNote}
                onNoteUpdated={fetchData}
            />
        </div>
    )
}
