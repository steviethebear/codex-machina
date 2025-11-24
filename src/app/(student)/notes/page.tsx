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

    const [recentNotes, setRecentNotes] = useState<Note[]>([])

    // Fetch filter options and recent notes on mount
    useEffect(() => {
        const fetchOptions = async () => {
            const { data: users } = await supabase.from('users').select('id, codex_name')
            if (users) setAuthors((users as any[]).map(u => ({ id: u.id, name: u.codex_name || 'Unknown' })))

            const { data: txts } = await supabase.from('texts').select('id, title')
            if (txts) setTexts((txts as any[]).map(t => ({ id: t.id, title: t.title })))

            // Fetch recent notes (last 10)
            const { data: recent } = await supabase
                .from('atomic_notes')
                .select('*, users(codex_name)')
                .eq('hidden', false)
                .neq('moderation_status', 'rejected')
                .order('created_at', { ascending: false })
                .limit(10)

            if (recent) setRecentNotes(recent as unknown as Note[])
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
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Atomic Notes</h2>
                    <p className="text-muted-foreground">Explore the collective knowledge of the Codex.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Button onClick={() => {
                            setSelectedNote(null) // Clear selection for new atom
                            setCreateDialogOpen(true)
                        }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Atom
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant={typeFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter('all')}
                        className="rounded-full"
                    >
                        All
                    </Button>
                    <Button
                        variant={typeFilter === 'idea' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter(typeFilter === 'idea' ? 'all' : 'idea')}
                        className={`rounded-full ${typeFilter === 'idea' ? 'bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90' : 'text-[#00f0ff] border-[#00f0ff] hover:bg-[#00f0ff]/10'}`}
                    >
                        Idea
                    </Button>
                    <Button
                        variant={typeFilter === 'question' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter(typeFilter === 'question' ? 'all' : 'question')}
                        className={`rounded-full ${typeFilter === 'question' ? 'bg-[#ff003c] text-white hover:bg-[#ff003c]/90' : 'text-[#ff003c] border-[#ff003c] hover:bg-[#ff003c]/10'}`}
                    >
                        Question
                    </Button>
                    <Button
                        variant={typeFilter === 'quote' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter(typeFilter === 'quote' ? 'all' : 'quote')}
                        className={`rounded-full ${typeFilter === 'quote' ? 'bg-[#7000ff] text-white hover:bg-[#7000ff]/90' : 'text-[#7000ff] border-[#7000ff] hover:bg-[#7000ff]/10'}`}
                    >
                        Quote
                    </Button>
                    <Button
                        variant={typeFilter === 'insight' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter(typeFilter === 'insight' ? 'all' : 'insight')}
                        className={`rounded-full ${typeFilter === 'insight' ? 'bg-[#ffe600] text-black hover:bg-[#ffe600]/90' : 'text-[#ffe600] border-[#ffe600] hover:bg-[#ffe600]/10'}`}
                    >
                        Insight
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Combobox
                        options={[
                            { value: 'all', label: 'All Authors' },
                            ...authors.map(a => ({ value: a.id, label: a.name }))
                        ]}
                        value={userFilter}
                        onValueChange={setUserFilter}
                        placeholder="Filter by author..."
                    />

                    <Combobox
                        options={[
                            { value: 'all', label: 'All Texts' },
                            ...texts.map(t => ({ value: t.id, label: t.title }))
                        ]}
                        value={textFilter}
                        onValueChange={setTextFilter}
                        placeholder="Filter by text..."
                    />

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                            <X className="mr-1 h-3 w-3" />
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Main Content */}
                <div className="lg:col-span-3">
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
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Recent Signals
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {recentNotes.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No recent activity.</div>
                            ) : (
                                recentNotes.map(note => (
                                    <Link key={note.id} href={`/notes/${note.id}`} className="block group">
                                        <div className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                                            {note.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex justify-between mt-1">
                                            <span>{note.users?.codex_name || 'Unknown'}</span>
                                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
