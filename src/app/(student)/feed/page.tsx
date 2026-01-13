'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, Search, Filter, BookOpen, Users } from 'lucide-react'
import { fetchClassFeed, fetchPeers, fetchSources } from '@/lib/actions/notes'
import { FeedCard } from '@/components/pkm/FeedCard'
import { NoteSlideOver } from '@/components/NoteSlideOver'
import { SourceSlideOver } from '@/components/SourceSlideOver'
import { Database } from '@/types/database.types'
import { Skeleton } from '@/components/ui/skeleton'

type Note = Database['public']['Tables']['notes']['Row']

export default function FeedPage() {
    const [notes, setNotes] = useState<Note[]>([])
    const [peers, setPeers] = useState<any[]>([])
    const [sources, setSources] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'teacher' | 'students'>('all')
    const [search, setSearch] = useState('')
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [slideOverSource, setSlideOverSource] = useState<any>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            if (filter === 'students') {
                const res = await fetchPeers()
                if (res.success && res.data) setPeers(res.data)
            } else if (filter === 'teacher') {
                const res = await fetchSources()
                if (res.success && res.data) setSources(res.data as Note[])
            } else {
                const res = await fetchClassFeed('all')
                if (res.success && res.data) setNotes(res.data as Note[])
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
                ) : filter === 'students' ? (
                    // PEERS VIEW
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
                        {peers.map((peer: any) => (
                            <div
                                key={peer.id}
                                className="group relative flex flex-col items-center p-6 bg-card rounded-lg border hover:shadow-md transition-all cursor-pointer"
                                onClick={() => window.location.href = `/user/${peer.id}`}
                            >
                                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-secondary-foreground mb-4 group-hover:scale-110 transition-transform">
                                    {peer.codex_name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <h3 className="font-semibold text-lg">{peer.codex_name}</h3>
                                <p className="text-sm text-muted-foreground">{peer.email}</p>
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                    <span title="Public Notes">Notes: {peer.stats?.notes || 0}</span>
                                    <span title="Connections">Links: {peer.stats?.connections || 0}</span>
                                </div>
                                <Button variant="ghost" className="mt-4 w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                    View Profile
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : filter === 'teacher' ? (
                    // SOURCES VIEW
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {sources.map((source: any) => (
                            <FeedCard
                                key={source.id}
                                note={source}
                                onClick={() => setSlideOverSource(source)}
                            // highlight source styling? FeedCard handles it via type check usually
                            />
                        ))}
                    </div>
                ) : (
                    // ALL NOTES VIEW
                    filteredNotes.length === 0 ? (
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
                    )
                )}
            </div>

            {/* Note SlideOver */}
            <NoteSlideOver
                open={!!selectedNote}
                note={selectedNote}
                onClose={() => setSelectedNote(null)}
                // Drilling down logic
                onNavigate={(n) => {
                    if ((n as any).type === 'source') {
                        // Switch to Source SlideOver
                        setSelectedNote(null)
                        // The 'n' object now contains full source data due to NoteSlideOver update
                        // We might want to cast it or just set it, assume it matches shape close enough
                        // or just use it as 'any' for the state.
                        setSlideOverSource(n)
                    } else {
                        setSelectedNote(n)
                    }
                }}
                // Open in full notebook
                onOpenNote={(n) => window.location.href = `/my-notes?noteId=${n.id}`}
            />

            {/* Source SlideOver */}
            <SourceSlideOver
                open={!!slideOverSource}
                source={slideOverSource}
                onClose={() => setSlideOverSource(null)}
                onNavigate={(note) => {
                    setSlideOverSource(null)
                    setSelectedNote(note)
                }}
            />
        </div>
    )
}
