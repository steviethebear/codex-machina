'use client'

import { Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import ForceGraph from '@/components/graph/force-graph'
import { useAuth } from '@/components/auth-provider'
import { NoteSlideOver } from '@/components/NoteSlideOver'
import { SourceSlideOver } from '@/components/SourceSlideOver'

export default function GraphPage() {
    const searchParams = useSearchParams()
    const highlightNodeId = searchParams.get('highlightNode')
    const supabase = createClient()
    const { user } = useAuth()
    const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)

    // Control States
    const [searchText, setSearchText] = useState('')
    const [showMyNotesOnly, setShowMyNotesOnly] = useState(false)
    const [selectedTag, setSelectedTag] = useState('all')
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [slideOverNote, setSlideOverNote] = useState<any>(null)
    const [slideOverSource, setSlideOverSource] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [])

    // Helper to calculate highlighted nodes
    const highlightedNodeIds = useMemo(() => {
        const ids = new Set<string>()
        if (highlightNodeId) ids.add(highlightNodeId)

        if (!searchText && !showMyNotesOnly && !highlightNodeId && selectedTag === 'all') return ids

        data.nodes.forEach(node => {
            let matches = true

            if (searchText) {
                const searchLower = searchText.toLowerCase()
                const titleMatch = node.name?.toLowerCase().includes(searchLower)
                const contentMatch = node.note?.content?.toLowerCase().includes(searchLower)
                // Also check source description/author
                const sourceMatch = node.source?.author?.toLowerCase().includes(searchLower) || node.source?.description?.toLowerCase().includes(searchLower)

                if (!titleMatch && !contentMatch && !sourceMatch) matches = false
            }

            if (showMyNotesOnly && user) {
                if (node.note && node.note.user_id !== user.id) matches = false
            }

            if (selectedTag !== 'all') {
                if (!node.tags || !node.tags.includes(selectedTag)) matches = false
            }

            if (matches) ids.add(node.id)
        })
        return ids
    }, [data.nodes, searchText, showMyNotesOnly, user, highlightNodeId, selectedTag])

    const fetchData = async () => {
        setLoading(true)

        // 1. Fetch Notes
        const { data: notes } = await supabase
            .from('notes')
            .select('*')
            .returns<Database['public']['Tables']['notes']['Row'][]>()

        // 1b. Fetch Sources
        const { data: sources } = await supabase
            .from('texts')
            .select('*')
            .eq('status', 'approved')
            .returns<Database['public']['Tables']['texts']['Row'][]>()

        // 2. Fetch Connections
        const { data: connections } = await supabase
            .from('connections')
            .select('*')
            .returns<Database['public']['Tables']['connections']['Row'][]>()

        // 3. Fetch Tags
        const { data: tagsData } = await supabase
            .from('note_tags')
            .select('note_id, tag')

        if (notes && connections) {
            // Process Tags
            const tagMap = new Map<string, string[]>()
            const uniqueTags = new Set<string>()

            if (tagsData) {
                tagsData.forEach(t => {
                    const current = tagMap.get(t.note_id) || []
                    current.push(t.tag)
                    tagMap.set(t.note_id, current)
                    uniqueTags.add(t.tag)
                })
            }
            setAvailableTags(Array.from(uniqueTags).sort())

            const nodes: any[] = notes.map((note) => ({
                id: note.id,
                name: note.title,
                val: 1,
                type: note.type,
                note: note,
                tags: tagMap.get(note.id) || [],
                connection_count: 0
            }))

            if (sources) {
                sources.forEach(source => {
                    nodes.push({
                        id: source.id,
                        name: source.title,
                        val: 1, // Sources can be bigger?
                        type: 'source',
                        source: source,
                        tags: ['source', source.type], // Add source type as tag
                        color: '#f59e0b', // Force amber for sources
                        connection_count: 0
                    })
                    uniqueTags.add('source')
                    uniqueTags.add(source.type)
                })
            }

            // Create Set of Node IDs
            const nodeIds = new Set(nodes.map(n => n.id))

            // Filter valid links
            // Filter valid links from DB
            const validLinks = connections.map(c => ({
                source: c.source_note_id,
                target: c.target_note_id,
                explanation: c.context
            })).filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))

            // Add implicit links based on citations/content
            const regex = /\[\[(.*?)\]\]/g
            notes.forEach(note => {
                let match
                // Reset regex lastIndex just in case
                regex.lastIndex = 0
                while ((match = regex.exec(note.content)) !== null) {
                    const title = match[1]
                    // Find node with this title (Note or Source)
                    const targetNode = nodes.find(n => n.name === title)
                    if (targetNode && targetNode.id !== note.id) {
                        validLinks.push({
                            source: note.id,
                            target: targetNode.id,
                            explanation: 'Citation'
                        })
                    }
                }
            })

            // Calculate connection counts for sizing
            validLinks.forEach(link => {
                const source = nodes.find(n => n.id === link.source)
                const target = nodes.find(n => n.id === link.target)
                if (source) source.connection_count = (source.connection_count || 0) + 1
                if (target) target.connection_count = (target.connection_count || 0) + 1
            })

            setData({ nodes: nodes, links: validLinks })
        }
        setLoading(false)
    }

    // ... (rest of code) ...

    return (
        <div className="h-[calc(100vh-4rem)] w-full relative group bg-black">
            <ForceGraph
                data={data}
                onNodeClick={(node) => {
                    if (node.note) {
                        setSlideOverNote(node.note)
                    } else if (node.source) {
                        setSlideOverSource(node.source)
                    }
                }}
                highlightNodes={highlightedNodeIds}
            />

            {/* Overlay Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-64">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            className="w-full pl-8 pr-4 py-2 bg-background/80 backdrop-blur border rounded-md text-sm"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tag Filter */}
                {availableTags.length > 0 && (
                    <select
                        className="w-full p-2 bg-background/80 backdrop-blur border rounded-md text-sm cursor-pointer"
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                    >
                        <option value="all">All Tags</option>
                        {availableTags.map(tag => (
                            <option key={tag} value={tag}>#{tag}</option>
                        ))}
                    </select>
                )}

                <div className="flex items-center space-x-2 bg-background/80 p-2 rounded-md border">
                    <input
                        type="checkbox"
                        id="my-notes"
                        checked={showMyNotesOnly}
                        onChange={e => setShowMyNotesOnly(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <label htmlFor="my-notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        My Notes Only
                    </label>
                </div>
            </div>

            <NoteSlideOver
                open={!!slideOverNote}
                note={slideOverNote}
                onClose={() => setSlideOverNote(null)}
                // Refresh graph data if note changes (optional, but good for title updates)
                onUpdate={() => fetchData()}
                onNavigate={(n) => {
                    if ((n as any).type === 'source') {
                        // Find the real source object from our data if possible, or use the mapped one
                        const source = data.nodes.find(node => node.id === n.id)?.source || n
                        setSlideOverNote(null)
                        setSlideOverSource(source)
                    } else {
                        // Normal note drill down
                        setSlideOverNote(n)
                    }
                }}
            />

            <SourceSlideOver
                open={!!slideOverSource}
                source={slideOverSource}
                onClose={() => setSlideOverSource(null)}
                onNavigate={(note) => {
                    setSlideOverSource(null)
                    setSlideOverNote(note)
                }}
            />
        </div>
    )
}
