'use client'

import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ForceGraph from '@/components/graph/force-graph'
import { LinkDialog } from '@/components/graph/link-dialog'
import { NodeMenu } from '@/components/graph/node-menu'
import { TextMenu } from '@/components/graph/text-menu'
import { CreateNoteDialog } from '@/components/graph/create-note-dialog'
import { EditNoteDialog } from '@/components/graph/edit-note-dialog'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['atomic_notes']['Row']
type Text = Database['public']['Tables']['texts']['Row']
type LinkType = Database['public']['Tables']['links']['Row']

export default function GraphPage() {
    const supabase = createClient()
    const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)

    // Dialog States
    const [menuOpen, setMenuOpen] = useState(false)
    const [textMenuOpen, setTextMenuOpen] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [selectedText, setSelectedText] = useState<Text | null>(null)

    const fetchData = async () => {
        // Only show approved and pending atoms (not rejected)
        const { data: notes } = await supabase
            .from('atomic_notes')
            .select('*')
            .eq('hidden', false)
            .neq('moderation_status', 'rejected') // Exclude rejected atoms


        const { data: links } = await supabase.from('links').select('*')

        if (notes && links) {
            const nodes: any[] = notes.map((n: any) => ({
                id: n.id,
                name: n.title,
                val: 1, // Size based on connections?
                type: n.type,
                color: getColor(n.type),
                note: n, // Store full atom for dialog
                isPending: n.moderation_status === 'pending' // Mark pending for visual indicator
            }))

            const graphLinks = links.map((l: any) => ({
                source: l.from_note_id,
                target: l.to_note_id || l.to_text_id, // Handle text nodes if we include them
            })).filter(l => l.target) // Filter out null targets

            // Add all active (non-archived) text nodes
            const { data: texts } = await supabase
                .from('texts')
                .select('*')
                .eq('archived', false)

            if (texts) {
                texts.forEach((t: any) => {
                    nodes.push({
                        id: t.id,
                        name: t.title,
                        val: 2,
                        type: 'text',
                        color: '#ffffff',
                        text: t // Store full text object
                    })
                })
            }

            setData({ nodes, links: graphLinks as any })
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [supabase])

    function getColor(type: string) {
        switch (type) {
            case 'idea': return '#00f0ff' // Cyan
            case 'question': return '#ff003c' // Red
            case 'quote': return '#7000ff' // Purple
            case 'insight': return '#ffe600' // Yellow
            default: return '#888'
        }
    }

    const handleNodeClick = (node: any) => {
        if (node.note) {
            // This is an atom node
            setSelectedNote(node.note)
            setMenuOpen(true)
        } else if (node.text) {
            // This is a text node
            setSelectedText(node.text)
            setTextMenuOpen(true)
        }
    }

    const handleRefresh = () => {
        // Refresh graph data
        fetchData()
    }

    return (
        <div className="flex flex-col flex-1 h-full">
            <div className="flex justify-between items-center p-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Knowledge Graph</h2>
                    <p className="text-muted-foreground">Visualizing the collective mind. Click an atom to interact.</p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedNote(null) // No source note for standalone creation
                        setSelectedText(null) // No target text for standalone creation
                        setCreateDialogOpen(true)
                    }}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Atom
                </Button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">Loading simulation...</div>
            ) : (
                <div className="flex-1 flex justify-center relative border rounded-lg overflow-hidden bg-card">
                    <ForceGraph data={data} onNodeClick={handleNodeClick} width="100%" height="100%" />

                    {/* Legend Overlay */}
                    <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-md border shadow-sm text-xs space-y-2">
                        <div className="font-semibold mb-1">Legend</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00f0ff]"></div><span>Idea</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ff003c]"></div><span>Question</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#7000ff]"></div><span>Quote</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ffe600]"></div><span>Insight</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ffffff] border border-gray-500"></div><span>Text</span></div>
                    </div>
                </div>
            )}

            {/* 1. The Atom Menu */}
            <NodeMenu
                open={menuOpen}
                onOpenChange={setMenuOpen}
                note={selectedNote}
                onConnect={() => setLinkDialogOpen(true)}
                onBranch={() => setCreateDialogOpen(true)}
                onExpand={() => setEditDialogOpen(true)}
            />

            {/* Text Menu */}
            <TextMenu
                open={textMenuOpen}
                onOpenChange={setTextMenuOpen}
                text={selectedText}
                onCreateLinkedAtom={() => setCreateDialogOpen(true)}
            />

            {/* 2. The Actions */}
            <LinkDialog
                open={linkDialogOpen}
                onOpenChange={setLinkDialogOpen}
                sourceNote={selectedNote}
                onLinkCreated={handleRefresh}
            />

            <CreateNoteDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                sourceAtom={selectedNote}
                targetText={selectedText}
                onAtomCreated={handleRefresh}
            />

            <EditNoteDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                note={selectedNote}
                onNoteUpdated={handleRefresh}
            />
        </div>
    )
}
