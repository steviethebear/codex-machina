'use client'

import { PlusCircle, Search, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import ForceGraph from '@/components/graph/force-graph'
import { LinkDialog } from '@/components/graph/link-dialog'
import { NodeMenu } from '@/components/graph/node-menu'
import { TextMenu } from '@/components/graph/text-menu'
import { CreateNoteDialog } from '@/components/graph/create-note-dialog'
import { EditNoteDialog } from '@/components/graph/edit-note-dialog'
import { Database } from '@/types/database.types'
import { useAuth } from '@/components/auth-provider'
import { TagFilter } from '@/components/tags/tag-filter'

type Note = Database['public']['Tables']['atomic_notes']['Row']
type Text = Database['public']['Tables']['texts']['Row']
type LinkType = Database['public']['Tables']['links']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

export default function GraphPage() {
    const supabase = createClient()
    const { user } = useAuth()
    const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)

    // Control States
    const [searchText, setSearchText] = useState('')
    const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null)
    const [showMyAtomsOnly, setShowMyAtomsOnly] = useState(false)
    const [selectedTagFilter, setSelectedTagFilter] = useState<Tag[]>([])
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [hoveredNode, setHoveredNode] = useState<any | null>(null)

    // Dialog States
    const [menuOpen, setMenuOpen] = useState(false)
    const [textMenuOpen, setTextMenuOpen] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [selectedText, setSelectedText] = useState<Text | null>(null)

    // Calculate Highlighted Nodes
    const highlightedNodeIds = useMemo(() => {
        const ids = new Set<string>()
        if (!searchText && !showMyAtomsOnly) return ids

        data.nodes.forEach(node => {
            let matches = true

            // Search Text Filter
            if (searchText) {
                const searchLower = searchText.toLowerCase()
                const titleMatch = node.name.toLowerCase().includes(searchLower)
                // Could search body too if we had it in node data, but name is fast
                if (!titleMatch) matches = false
            }

            // My Atoms Filter
            if (showMyAtomsOnly && user) {
                // Check if node author matches current user
                // Note: Text nodes might not have author_id or it might be null
                if (node.note?.author_id !== user.id) matches = false
            }

            // Tag Filter (notes must have ALL selected tags)
            if (selectedTagFilter.length > 0 && node.note) {
                const noteTags = node.note.tags || []
                const hasAllTags = selectedTagFilter.every(selectedTag =>
                    noteTags.some((noteTag: any) => noteTag.id === selectedTag.id)
                )
                if (!hasAllTags) matches = false
            }

            if (matches) ids.add(node.id)
        })

        return ids
    }, [data.nodes, searchText, showMyAtomsOnly, user, activeTypeFilter, selectedTagFilter])

    const fetchData = async () => {
        // Only show approved and pending atoms (not rejected)
        const { data: notes } = await supabase
            .from('atomic_notes')
            .select(`
                *,
                note_tags!note_tags_note_id_fkey(
                    tags(id, name, display_name, usage_count)
                )
            `)
            .eq('hidden', false)
            .neq('moderation_status', 'rejected') // Exclude rejected atoms


        const { data: links } = await supabase.from('links').select('*')

        if (notes && links) {
            // Transform notes to include tags array
            const transformedNotes = (notes || []).map((note: any) => ({
                ...note,
                tags: (note.note_tags || []).map((noteTag: any) => noteTag.tags).filter(Boolean) || []
            }))

            // Extract unique tags
            const tagsMap = new Map()
            transformedNotes.forEach((note: any) => {
                note.tags?.forEach((tag: any) => {
                    if (!tagsMap.has(tag.id)) {
                        tagsMap.set(tag.id, tag)
                    }
                })
            })
            setAvailableTags(Array.from(tagsMap.values()).sort((a: any, b: any) => b.usage_count - a.usage_count))

            const nodes: any[] = transformedNotes.map((note: any) => ({
                id: note.id,
                name: note.title,
                val: 1, // Size based on connections?
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
        <div className="h-[calc(100vh-4rem)] w-full relative group">
            <ForceGraph
                data={data}
                onNodeClick={handleNodeClick}
                onNodeHover={setHoveredNode}
                highlightNodes={highlightedNodeIds}
                filterType={activeTypeFilter}
            />

            {/* Control Panel */}
            <div className="absolute top-4 left-4 z-10 w-80 space-y-4">
                <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl">
                    <div className="p-4 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search atoms..."
                                className="pl-8 bg-black/40 border-white/20 focus:border-primary"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>

                        {/* Type Filters */}
                        <div className="flex flex-wrap gap-2">
                            {['idea', 'question', 'quote', 'insight'].map(type => {
                                const typeColors = {
                                    idea: '#00f0ff',
                                    question: '#ff003c',
                                    quote: '#7000ff',
                                    insight: '#ffe600'
                                }
                                const color = typeColors[type as keyof typeof typeColors]
                                const isActive = activeTypeFilter === type

                                return (
                                    <Button
                                        key={type}
                                        variant="outline"
                                        size="sm"
                                        className={`h-7 text-xs capitalize ${isActive ? '' : 'bg-transparent hover:bg-white/5'
                                            }`}
                                        style={{
                                            borderColor: color,
                                            backgroundColor: isActive ? color : undefined,
                                            color: isActive ? '#000' : color
                                        }}
                                        onClick={() => setActiveTypeFilter(activeTypeFilter === type ? null : type)}
                                    >
                                        {type}
                                    </Button>
                                )
                            })}
                        </div>

                        {/* My Atoms Toggle */}
                        <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                            <Switch
                                id="my-atoms"
                                checked={showMyAtomsOnly}
                                onCheckedChange={setShowMyAtomsOnly}
                            />
                            <Label htmlFor="my-atoms" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                                <User className="h-3 w-3" />
                                My Atoms Only
                            </Label>
                        </div>

                        {/* Tag Filter */}
                        {availableTags.length > 0 && (
                            <div className="pt-3 border-t border-white/10 mt-3">
                                <TagFilter
                                    availableTags={availableTags}
                                    selectedTags={selectedTagFilter}
                                    onTagsChange={setSelectedTagFilter}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hover Preview */}
            {hoveredNode && (
                <div
                    className="absolute z-20 pointer-events-none top-4 right-4"
                >
                    <div
                        className="w-64 border-l-4 shadow-2xl bg-black/40 backdrop-blur-md border border-white/10 rounded-lg animate-in fade-in slide-in-from-top-2"
                        style={{ borderLeftColor: hoveredNode.color }}
                    >
                        <div className="p-3">
                            <div className="font-bold text-sm line-clamp-2">{hoveredNode.name}</div>
                            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                <span className="capitalize">{hoveredNode.type}</span>
                                {hoveredNode.note?.users?.codex_name && (
                                    <span>by {hoveredNode.note.users.codex_name}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-8 right-8 z-10">
                <Button
                    size="lg"
                    className="shadow-lg"
                    onClick={() => {
                        setSelectedNote(null)
                        setCreateDialogOpen(true)
                    }}
                >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Atom
                </Button>
            </div>
            {/* Dialogs */}
            <NodeMenu
                open={menuOpen}
                onOpenChange={setMenuOpen}
                note={selectedNote}
                onConnect={() => setLinkDialogOpen(true)}
                onBranch={() => setCreateDialogOpen(true)}
                onExpand={() => setEditDialogOpen(true)}
            />

            <TextMenu
                open={textMenuOpen}
                onOpenChange={setTextMenuOpen}
                text={selectedText}
                onCreateLinkedAtom={() => setCreateDialogOpen(true)}
            />

            <LinkDialog
                open={linkDialogOpen}
                onOpenChange={setLinkDialogOpen}
                sourceNote={selectedNote}
                onLinkCreated={fetchData}
            />

            <CreateNoteDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                sourceAtom={selectedNote}
                targetText={selectedText}
                onAtomCreated={fetchData}
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
