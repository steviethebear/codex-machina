'use client'

import { Search, PlusCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import ForceGraph from '@/components/graph/force-graph'
import { useAuth } from '@/components/auth-provider'
import Link from 'next/link'

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
                // If it's a note, check user_id. Texts (type=text) usually don't have user_id like notes.
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

        // 2. Fetch Connections
        const { data: connections } = await supabase
            .from('connections')
            .select('*')

        // 3. Fetch Texts (Books/Films) - Optional but good for hub structure
        const { data: texts } = await supabase
            .from('texts')
            .select('*')
            .eq('archived', false)

        if (notes && connections) {
            const nodes: any[] = notes.map((note) => ({
                id: note.id,
                name: note.title,
                val: 1, // Size
                type: note.type, // 'fleeting', 'literature', 'permanent'
                note: note,
                connection_count: 0 // calculate later?
            }))

            if (texts) {
                texts.forEach(t => {
                    nodes.push({
                        id: t.id,
                        name: t.title,
                        val: 2,
                        type: 'text',
                        color: '#ffffff',
                        text: t
                    })
                })
            }

            // Create Set of Node IDs
            const nodeIds = new Set(nodes.map(n => n.id))

            // Filter valid links
            const validLinks = connections.map(c => ({
                source: c.source_note_id,
                target: c.target_note_id,
                explanation: c.explanation
            })).filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))

            // Add text links? Since we don't have direct text-links table anymore (replaced by connections to notes?), 
            // but maybe we can link Literature Notes to Texts via some convention or if we added a `text_id` to notes (we didn't yet).
            // For v0.5 MVP, we might treat Texts as standalone hubs if we link them, OR if we strictly follow schema, 
            // Literature Notes citation string is the "link". 
            // Let's just visualize Notes and Connections for now to keep it clean.
            // We can visualize Texts as disconnected for now or just hide them if not used. 
            // Actually, seed data didn't link notes to texts via ID, just citation string.
            // So let's keep Texts out of the main graph or just show them. 
            // For Zettelkasten, the graph is mostly about Notes. 
            // I'll keep texts in `nodes` array but they might be disconnected unless we link them. 
            // Actually, old schema had `links` table with `to_text_id`. New `connections` is `source_note_id` -> `target_note_id`.
            // So we lost direct graph edges to Texts unless we treat Texts as "Notes" or add a field.
            // Given instructions: "Literature notes... Citation." 
            // Ideally we'd fuzzy match citation to Text title to draw a line, but that's complex.
            // Result: Texts will appear as floating nodes or we should hide them for now to avoid clutter.
            // Let's hide Texts for now unless we need them.

            // Re-filtering nodes to remove Texts if we aren't linking them
            // actually, let's just show Notes for the Zettelkasten Graph.
            const finalNodes = nodes.filter(n => n.type !== 'text')
            const finalNodeIds = new Set(finalNodes.map(n => n.id))
            const finalLinks = validLinks.filter(l => finalNodeIds.has(l.source) && finalNodeIds.has(l.target))

            // Calculate connection counts for sizing
            finalLinks.forEach(link => {
                const source = finalNodes.find(n => n.id === link.source)
                const target = finalNodes.find(n => n.id === link.target)
                if (source) source.connection_count = (source.connection_count || 0) + 1
                if (target) target.connection_count = (target.connection_count || 0) + 1
            })

            setData({ nodes: finalNodes, links: finalLinks })
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="h-[calc(100vh-4rem)] w-full relative group bg-black">
            <ForceGraph
                data={data}
                onNodeClick={(node) => {
                    // Simple navigation or alert for MVP
                    // TODO: Open sidebar detail view
                    console.log('Clicked', node)
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

            <div className="absolute bottom-8 right-8 z-10">
                <Link href="/my-notes">
                    <Button size="lg" className="shadow-lg">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        New Note
                    </Button>
                </Link>
            </div>
        </div>
    )
}
