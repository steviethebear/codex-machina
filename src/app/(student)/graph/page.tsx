'use client'

import { PlusCircle, Search, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import ForceGraph from '@/components/graph/force-graph'
import { GraphSidebar } from '@/components/graph/graph-sidebar'
import { LinkingModal } from '@/components/notebook/linking-modal'
import { NodeMenu } from '@/components/graph/node-menu'
import { TextMenu } from '@/components/graph/text-menu'
import { CreateNoteDialog } from '@/components/graph/create-note-dialog'
import { EditNoteDialog } from '@/components/graph/edit-note-dialog'
import { QuestionComposer } from '@/components/questions/question-composer'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Database } from '@/types/database.types'
import { useAuth } from '@/components/auth-provider'
import { TagFilter } from '@/components/tags/tag-filter'
import { toast } from 'sonner'
import { useSignalDiscovery } from '@/hooks/use-signal-discovery'

type Note = Database['public']['Tables']['atomic_notes']['Row']
type Text = Database['public']['Tables']['texts']['Row']
type LinkType = Database['public']['Tables']['links']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

export default function GraphPage() {
    const searchParams = useSearchParams()
    const highlightNodeId = searchParams.get('highlightNode')
    const newInsight = searchParams.get('newInsight') === 'true'
    const supabase = createClient()
    const { user } = useAuth()
    const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)
    const { checkDiscovery } = useSignalDiscovery()

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
    const [createQuestionOpen, setCreateQuestionOpen] = useState(false)

    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [selectedText, setSelectedText] = useState<Text | null>(null)

    // Calculate Highlighted Nodes
    const highlightedNodeIds = useMemo(() => {
        const ids = new Set<string>()
        if (highlightNodeId) {
            ids.add(highlightNodeId)
        }

        if (!searchText && !showMyAtomsOnly && !highlightNodeId) return ids

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
    }, [data.nodes, searchText, showMyAtomsOnly, user, activeTypeFilter, selectedTagFilter, highlightNodeId])

    const fetchData = async () => {
        // Fetch notes with connection data
        const { data: notes } = await supabase
            .from('atomic_notes')
            .select(`
                *,
                note_tags!note_tags_note_id_fkey(
                    tags(id, name, display_name, usage_count)
                )
            `)
            .eq('hidden', false)
            .neq('moderation_status', 'rejected')


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
                val: 1,
                note: note,
                isPending: note.moderation_status === 'pending',
                connection_count: note.connection_count || 0, // v0.3.2: Add connection count
                is_hub: note.is_hub || false // v0.3.2: Add hub status
            }))

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
                        text: t,
                        connection_count: 0, // Texts don't have connection counts
                        is_hub: false
                    })
                })
            }

            // Add Questions
            const { data: questions } = await supabase
                .from('questions')
                .select('*')
                .eq('moderation_status', 'approved')
                .eq('is_resolved', false) // Only show unresolved questions? Or all? Let's show all but maybe dim resolved.

            if (questions) {
                questions.forEach((q: any) => {
                    nodes.push({
                        id: q.id,
                        name: q.title,
                        val: 1.5,
                        type: 'question',
                        color: '#ff003c',
                        question: q,
                        connection_count: q.view_count || 0,
                        is_hub: false
                    })
                })
            }

            // Create a set of all valid node IDs for fast lookup
            const nodeIds = new Set(nodes.map(n => n.id))

            const graphLinks = links.map((l: any) => ({
                source: l.from_note_id || l.from_question_id,
                target: l.to_note_id || l.to_text_id || l.to_question_id,
            })).filter(l => {
                // Ensure both source and target exist in our filtered node set
                return l.source && l.target && nodeIds.has(l.source) && nodeIds.has(l.target)
            })

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
        // Trigger signal discovery check
        checkDiscovery(node.id, node.type === 'text' ? 'text' : 'note')

        if (node.type === 'text') {
            setSelectedText(node.text)
            setSelectedNote(null)
            setTextMenuOpen(true)
        } else if (node.note) {
            setSelectedNote(node.note)
            setSelectedText(null)
            setMenuOpen(true)
        } else if (node.question) {
            // Open question details? Or just navigate to notebook?
            // For now, let's navigate to notebook with questionId
            window.location.href = `/notebook?questionId=${node.id}`
        }
    }

    const handleRefresh = () => {
        // Refresh graph data
        fetchData()
    }

    const selectedNodeForSidebar = selectedNote
        ? { id: selectedNote.id, name: selectedNote.title, note: selectedNote, type: 'note' }
        : selectedText
            ? { id: selectedText.id, name: selectedText.title, text: selectedText, type: 'text' }
            : null

    return (
        <div className="h-[calc(100vh-4rem)] w-full relative group">
            <ForceGraph
                data={data}
                onNodeClick={handleNodeClick}
                onNodeHover={setHoveredNode}
                highlightNodes={highlightedNodeIds}
                filterType={activeTypeFilter}
                newInsight={newInsight}
            />

            <GraphSidebar
                searchText={searchText}
                onSearchChange={setSearchText}
                activeTypeFilter={activeTypeFilter}
                onTypeFilterChange={setActiveTypeFilter}
                showMyAtomsOnly={showMyAtomsOnly}
                onShowMyAtomsOnlyChange={setShowMyAtomsOnly}
                availableTags={availableTags}
                selectedTags={selectedTagFilter}
                onTagsChange={setSelectedTagFilter}

                selectedNode={selectedNodeForSidebar}
                onClosePreview={() => {
                    setSelectedNote(null)
                    setSelectedText(null)
                }}
                onConnect={() => setLinkDialogOpen(true)}
                onOpenInNotebook={() => {
                    if (selectedNote) {
                        window.location.href = `/notebook?noteId=${selectedNote.id}`
                    }
                }}
                onCreateAtom={() => setCreateDialogOpen(true)}
            />

            {/* Hover Preview (Only show if no node selected) */}
            {hoveredNode && !selectedNodeForSidebar && (
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
            {/* Create Question Dialog */}
            <Dialog open={createQuestionOpen} onOpenChange={setCreateQuestionOpen}>
                <DialogHeader>
                    <DialogTitle>Ask a Question</DialogTitle>
                </DialogHeader>
                <QuestionComposer
                    onSuccess={() => {
                        setCreateQuestionOpen(false)
                        toast.success('Question posted!')
                    }}
                    onCancel={() => setCreateQuestionOpen(false)}
                />
            </Dialog>

            <NodeMenu
                open={menuOpen}
                onOpenChange={setMenuOpen}
                note={selectedNote}
                onConnect={() => setLinkDialogOpen(true)}
                onBranch={() => setCreateDialogOpen(true)}
                onExpand={() => setEditDialogOpen(true)}
                onAskQuestion={() => setCreateQuestionOpen(true)}
            />

            <TextMenu
                open={textMenuOpen}
                onOpenChange={setTextMenuOpen}
                text={selectedText}
                onCreateLinkedAtom={() => setCreateDialogOpen(true)}
                onAskQuestion={() => setCreateQuestionOpen(true)}
            />

            {selectedNote && (
                <LinkingModal
                    isOpen={linkDialogOpen}
                    onClose={() => setLinkDialogOpen(false)}
                    currentNoteId={selectedNote.id}
                    currentNoteTitle={selectedNote.title}
                    allNotes={data.nodes.filter(n => n.type !== 'text').map(n => n.note).filter(Boolean)}
                    allTexts={data.nodes.filter(n => n.type === 'text').map(n => n.text).filter(Boolean)}
                    onCreateLink={async (targetNoteId: string | null, targetTextId: string | null, explanation: string) => {
                        const { error } = await supabase.from('links').insert({
                            from_note_id: selectedNote.id,
                            to_note_id: targetNoteId,
                            to_text_id: targetTextId,
                            relation_type: 'connects_to',
                            explanation: explanation,
                            created_by: user?.id
                        } as any)

                        if (error) {
                            console.error('Error creating link:', error)
                            toast.error('Failed to create link')
                        } else {
                            fetchData()
                            toast.success('Connection strengthened', {
                                description: '+1 SP'
                            })
                            setLinkDialogOpen(false)
                        }
                    }}
                />
            )}

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
