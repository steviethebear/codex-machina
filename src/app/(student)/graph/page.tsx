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

    // Helper to calculate highlighted nodes
    const highlightedNodeIds = useMemo(() => {
        const ids = new Set<string>()
        if (highlightNodeId) ids.add(highlightNodeId)

        if (!searchText && !showMyNotesOnly && !highlightNodeId) return ids

        data.nodes.forEach(node => {
            let matches = true

            if (searchText) {
                const searchLower = searchText.toLowerCase()
                // Check title and content if available
                const titleMatch = node.name?.toLowerCase().includes(searchLower)
                const contentMatch = node.note?.content?.toLowerCase().includes(searchLower)
                if (!titleMatch && !contentMatch) matches = false
            }

            if (showMyNotesOnly && user) {
                if (node.note && node.note.user_id !== user.id) matches = false
            }

            if (matches) ids.add(node.id)
        })
        return ids
    }, [data.nodes, searchText, showMyNotesOnly, user, highlightNodeId])

    const fetchData = async () => {
        setLoading(true)

        // 1. Fetch Notes
        const { data: notes } = await supabase
            .from('notes')
            .select('*')
            .returns<Database['public']['Tables']['notes']['Row'][]>()

        // 2. Fetch Connections
        const { data: connections } = await supabase
            .from('connections')
            .select('*')
            .returns<Database['public']['Tables']['connections']['Row'][]>()

        if (notes && connections) {
            const nodes: any[] = notes.map((note) => ({
                id: note.id,
                name: note.title,
                val: 1, // Size
                type: note.type, // 'fleeting', 'source', 'permanent'
                note: note,
                connection_count: 0
            }))

            // Create Set of Node IDs
            const nodeIds = new Set(nodes.map(n => n.id))

            // Filter valid links
            const validLinks = connections.map(c => ({
                source: c.source_note_id,
                target: c.target_note_id,
                explanation: c.context // Renamed to context in v0.5
            })).filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))

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

    useEffect(() => {
        fetchData()
    }, [])

    const [slideOverNote, setSlideOverNote] = useState<any>(null)

    return (
        <div className="h-[calc(100vh-4rem)] w-full relative group bg-black">
            <ForceGraph
                data={data}
                onNodeClick={(node) => {
                    if (node.note) setSlideOverNote(node.note)
                }}
                highlightNodes={highlightedNodeIds}
            // filterType={activeTypeFilter}
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
            />
        </div>
    )
}
