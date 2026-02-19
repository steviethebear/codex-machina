'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    MiniMap,
    Panel,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ArrowLeft, Download, Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getUserTags } from '@/lib/actions/notes'

import {
    getThread,
    addNoteToThread,
    removeNoteFromThread,
    updateNotePosition,
    createThreadConnection,
    deleteThreadConnection,
    deleteThread,
    exportThreadAsMarkdown,
    type ThreadWithNotes
} from '@/lib/actions/threads'

import NoteNode from '@/components/threads/NoteNode'
import { NoteDetailSheet } from '@/components/threads/NoteDetailSheet'

export default function ThreadWorkspacePage() {
    const router = useRouter()
    const params = useParams()
    const threadId = params.id as string
    const supabase = createClient()

    // React Flow State
    const [nodes, setNodes] = useNodesState<Node>([])
    const [edges, setEdges] = useEdgesState<Edge>([])
    const nodeTypes = useMemo(() => ({ note: NoteNode }), [])

    // Application State
    const [thread, setThread] = useState<ThreadWithNotes | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedNote, setSelectedNote] = useState<any | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Add Note Dialog State
    const [showAddNotes, setShowAddNotes] = useState(false)
    const [availableNotes, setAvailableNotes] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [tagFilter, setTagFilter] = useState<string>('all')
    const [userTags, setUserTags] = useState<string[]>([])

    // Load Initial Data
    useEffect(() => {
        const init = async () => {
            await loadThread()
            await loadAvailableNotes()
            await loadTags()
        }
        init()
    }, [threadId])

    const loadTags = async () => {
        const tags = await getUserTags()
        if (tags) setUserTags(tags)
    }

    const loadAvailableNotes = async () => {
        const { data } = await supabase
            .from('notes')
            .select(`*, note_tags ( tag )`)
            .in('type', ['permanent', 'source'])
            .order('title')

        if (data) {
            const enriched = data.map((n: any) => ({
                ...n,
                tags: n.note_tags?.map((t: any) => t.tag) || []
            }))
            setAvailableNotes(enriched)
        }
    }

    const loadThread = async () => {
        const result = await getThread(threadId)
        if (result.data) {
            const t = result.data
            setThread(t)

            // Map ThreadNotes to React Flow Nodes
            const flowNodes: Node[] = t.notes.map((tn) => ({
                id: tn.note_id,
                type: 'note',
                position: { x: tn.x || 0, y: tn.y || 0 },
                data: {
                    ...tn.note,
                    author: tn.note.author_name,
                    groupLabel: tn.group_label,
                    onLabelClick: () => console.log('Label clicked', tn.id)
                }
            }))
            console.log('Loaded nodes:', flowNodes)
            setNodes(flowNodes)

            // Map Connections to React Flow Edges
            if (t.connections) {
                const flowEdges: Edge[] = t.connections.map(c => ({
                    id: c.id,
                    source: c.source_note_id,
                    target: c.target_note_id,
                    label: c.label,
                    type: 'default',
                    animated: false,
                    className: 'stroke-2',
                    style: { stroke: 'hsl(var(--primary))' }
                }))
                setEdges(flowEdges)
            }
        } else if (result.error) {
            toast.error(`Failed to load thread: ${result.error}`)
        }
        setLoading(false)
    }

    // Handlers
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    )

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    )

    const onConnect = useCallback(
        async (params: Connection) => {
            if (!params.source || !params.target) return

            // Optimistic update
            setEdges((eds) => addEdge({ ...params, animated: true }, eds))

            // Persist
            const result = await createThreadConnection(threadId, params.source, params.target)
            if (result.error || !result.data) {
                toast.error('Failed to create connection')
                // Revert would go here
            } else {
                const newId = result.data.id
                // Update edge ID with real one
                setEdges(eds => eds.map(e => {
                    if (e.source === params.source && e.target === params.target && !e.id.includes('-')) {
                        return { ...e, id: newId }
                    }
                    return e
                }))
            }
        },
        [threadId, setEdges]
    )

    const onNodeDragStop = useCallback(
        async (_: any, node: Node) => {
            // Persist position
            await updateNotePosition(threadId, node.id, node.position.x, node.position.y)
        },
        [threadId]
    )

    const onEdgeClick = useCallback(
        async (_: any, edge: Edge) => {
            // Simple delete on click for now (could be context menu)
            if (confirm('Delete this connection?')) {
                setEdges((es) => es.filter((e) => e.id !== edge.id))
                await deleteThreadConnection(edge.id)
            }
        },
        [setEdges]
    )

    const onNodeClick = useCallback(
        (_: any, node: Node) => {
            setSelectedNote(node.data)
            setIsSheetOpen(true)
        },
        []
    )

    // Action wrappers
    const handleAddNote = async (noteId: string) => {
        const result = await addNoteToThread(threadId, noteId, 999) // Position handled by randomness in action
        if (result.error) {
            toast.error('Failed to add note')
        } else {
            toast.success('Note added')
            loadThread() // Reload to get the new node placement
        }
    }

    const handleDelete = async () => {
        if (!confirm('Delete this thread? This cannot be undone.')) return
        const result = await deleteThread(threadId)
        if (result.success) {
            router.push('/threads')
        }
    }

    const handleExport = async () => {
        const result = await exportThreadAsMarkdown(threadId)
        if (result.data) {
            const blob = new Blob([result.data], { type: 'text/markdown' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${thread?.title || 'thread'}.md`
            a.click()
            toast.success('Thread exported')
        }
    }

    // Filter available notes
    const notesInThread = new Set(nodes.map(n => n.id))
    const notesToAdd = availableNotes.filter(n =>
        !notesInThread.has(n.id) &&
        (tagFilter === 'all' || n.tags?.includes(tagFilter)) &&
        (searchTerm === '' || n.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>

    return (
        <div className="h-[calc(100vh-4rem)] w-full flex flex-col">
            {/* Header / Toolbar */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-background z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/threads')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold">{thread?.title}</h1>
                        {thread?.description && <p className="text-xs text-muted-foreground">{thread.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 w-full bg-muted/20 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDragStop={onNodeDragStop}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-neutral-50 dark:bg-neutral-900"
                >
                    <Background color="#999" gap={16} />
                    <Controls />
                    <MiniMap zoomable pannable />
                    <Panel position="top-right">
                        <Button onClick={() => setShowAddNotes(true)} className="shadow-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Note
                        </Button>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Slide-out Sheet */}
            <NoteDetailSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                note={selectedNote}
            />

            {/* Add Notes Dialog (Reused logic) */}
            <Dialog open={showAddNotes} onOpenChange={setShowAddNotes}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Notes to Thread</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center gap-2 mt-2">
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Select value={tagFilter} onValueChange={setTagFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tags</SelectItem>
                                {userTags.map(t => <SelectItem key={t} value={t}>#{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2 mt-4 max-h-[400px] overflow-y-auto">
                        {notesToAdd.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">No notes found.</p>
                        ) : (
                            notesToAdd.map(note => (
                                <Card
                                    key={note.id}
                                    className="cursor-pointer hover:bg-accent"
                                    onClick={() => handleAddNote(note.id)}
                                >
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm">{note.title}</CardTitle>
                                    </CardHeader>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
