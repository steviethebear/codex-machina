'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, Search, Filter, BookOpen, Users } from 'lucide-react'
import { fetchClassFeed } from '@/lib/actions/notes'
import { FeedCard } from '@/components/pkm/FeedCard'
import { NoteSlideOver } from '@/components/NoteSlideOver'
import { Database } from '@/types/database.types'
import { Skeleton } from '@/components/ui/skeleton'

type Note = Database['public']['Tables']['notes']['Row']

export default function FeedPage() {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'teacher' | 'students'>('all')
    const [search, setSearch] = useState('')
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const res = await fetchClassFeed(filter)
            if (res.success && res.data) {
                setNotes(res.data as Note[])
            }
            setLoading(false)
        }
        load()
    }, [filter])

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
            {/* Header */}
            <div className="border-b p-6 flex flex-col gap-4 bg-muted/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-amber-500" />
                            Class Feed
                        </h1>
                        <p className="text-muted-foreground">Discover what your peers are thinking about.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search topics..."
                            className="pl-9 bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-background p-1 rounded-md border shadow-sm">
                        <Button
                            variant={filter === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('all')}
                            className="text-xs"
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'teacher' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('teacher')}
                            className="text-xs gap-1"
                        >
                            <BookOpen className="h-3 w-3" />
                            Sources
                        </Button>
                        <Button
                            variant={filter === 'students' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('students')}
                            className="text-xs gap-1"
                        >
                            <Users className="h-3 w-3" />
                            Peers
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-[125px] w-full rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <p>No notes found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {filteredNotes.map(note => (
                            <FeedCard
                                key={note.id}
                                note={note}
                                onClick={() => setSelectedNote(note)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* SlideOver */}
            <NoteSlideOver
                open={!!selectedNote}
                note={selectedNote}
                onClose={() => setSelectedNote(null)}
                // Drilling down logic
                onNavigate={(n) => setSelectedNote(n)}
                // Open in full notebook
                onOpenNote={(n) => window.location.href = `/my-notes?noteId=${n.id}`}
            />
        </div>
    )
}
