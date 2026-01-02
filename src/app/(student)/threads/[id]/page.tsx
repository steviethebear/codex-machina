'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download, Plus, MoveUp, MoveDown, X, Edit2, Trash2 } from 'lucide-react'
import {
    getThread,
    addNoteToThread,
    removeNoteFromThread,
    reorderThreadNotes,
    updateNoteGroupLabel,
    exportThreadAsMarkdown,
    deleteThread,
    updateThread,
    type ThreadWithNotes
} from '@/lib/actions/threads'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { getUserTags } from '@/lib/actions/notes'
// ...

export default function ThreadWorkspacePage() {
    const router = useRouter()
    const params = useParams()
    const threadId = params.id as string
    const supabase = createClient()

    const [thread, setThread] = useState<ThreadWithNotes | null>(null)
    const [availableNotes, setAvailableNotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddNotes, setShowAddNotes] = useState(false)
    const [editingLabel, setEditingLabel] = useState<string | null>(null)
    const [labelInput, setLabelInput] = useState('')
    const [userTags, setUserTags] = useState<string[]>([])
    const [tagFilter, setTagFilter] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadThread()
        loadAvailableNotes()
        loadTags()
    }, [threadId])

    const loadTags = async () => {
        const tags = await getUserTags()
        if (tags) setUserTags(tags)
    }

    const loadAvailableNotes = async () => {
        const { data, error } = await supabase
            .from('notes')
            .select(`
                *,
                note_tags ( tag )
            `)
            .in('type', ['permanent', 'source'])
            .order('title')

        if (data) {
            // Transform tags
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
            setThread(result.data)
        }
        setLoading(false)
    }

    const handleAddNote = async (noteId: string) => {
        if (!thread) return

        const maxPosition = thread.notes.length > 0
            ? Math.max(...thread.notes.map(n => n.position))
            : -1

        const result = await addNoteToThread(threadId, noteId, maxPosition + 1)
        if (result.error) {
            toast.error('Failed to add note')
        } else {
            toast.success('Note added')
            loadThread()
        }
    }

    const handleRemoveNote = async (noteId: string) => {
        const result = await removeNoteFromThread(threadId, noteId)
        if (result.error) {
            toast.error('Failed to remove note')
        } else {
            toast.success('Note removed')
            loadThread()
        }
    }

    const handleMoveNote = async (index: number, direction: 'up' | 'down') => {
        if (!thread) return

        const notes = [...thread.notes]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= notes.length) return

            // Swap
            ;[notes[index], notes[targetIndex]] = [notes[targetIndex], notes[index]]

        // Update positions
        const updates = notes.map((note, i) => ({
            note_id: note.note_id,
            position: i,
            group_label: note.group_label
        }))

        await reorderThreadNotes(threadId, updates)
        loadThread()
    }

    const handleUpdateLabel = async (noteId: string, newLabel: string | null) => {
        await updateNoteGroupLabel(threadId, noteId, newLabel)
        setEditingLabel(null)
        setLabelInput('')
        loadThread()
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

    const handleDelete = async () => {
        if (!confirm('Delete this thread? This cannot be undone.')) return

        const result = await deleteThread(threadId)
        if (result.success) {
            toast.success('Thread deleted')
            router.push('/threads')
        }
    }

    const notesInThread = new Set(thread.notes.map(n => n.note_id))
    const notesToAdd = availableNotes.filter(n =>
        !notesInThread.has(n.id) &&
        (tagFilter === 'all' || n.tags?.includes(tagFilter)) &&
        (searchTerm === '' || n.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="flex flex-col gap-6 p-8 max-w-5xl mx-auto">
            {/* ... */}
            <div className="flex gap-2">
                <Dialog open={showAddNotes} onOpenChange={setShowAddNotes}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Notes
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Notes to Thread</DialogTitle>
                        </DialogHeader>

                        <div className="flex items-center gap-2 mt-2">
                            <Input
                                placeholder="Search notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                            <Select value={tagFilter} onValueChange={setTagFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by tag" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tags</SelectItem>
                                    {userTags.map(t => (
                                        <SelectItem key={t} value={t}>#{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 mt-4">
                            {notesToAdd.length === 0 ? (

                                <p className="text-muted-foreground text-center py-8">
                                    All permanent notes have been added
                                </p>
                            ) : (
                                notesToAdd.map(note => (
                                    <Card
                                        key={note.id}
                                        className="cursor-pointer hover:bg-accent"
                                        onClick={() => {
                                            handleAddNote(note.id)
                                            setShowAddNotes(false)
                                        }}
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-base">{note.title}</CardTitle>
                                        </CardHeader>
                                    </Card>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Thread Notes */}
            <div className="space-y-4">
                {thread.notes.length === 0 ? (
                    <Card>
                        <CardContent className="pt-12 pb-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                            <p>No notes in this thread yet. Add some to begin weaving.</p>
                            <Button variant="secondary" onClick={() => setShowAddNotes(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Note
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    thread.notes.map((threadNote, index) => (
                        <Card key={threadNote.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Group Label */}
                                        {editingLabel === threadNote.id ? (
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    value={labelInput}
                                                    onChange={(e) => setLabelInput(e.target.value)}
                                                    placeholder="Group label (e.g., Tension, Context)"
                                                    className="h-8 text-sm"
                                                    autoFocus
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdateLabel(threadNote.note_id, labelInput)}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingLabel(null)
                                                        setLabelInput('')
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : threadNote.group_label ? (
                                            <div
                                                className="inline-flex items-center gap-2 bg-muted px-2 py-1 rounded text-xs font-medium mb-2 cursor-pointer"
                                                onClick={() => {
                                                    setEditingLabel(threadNote.id)
                                                    setLabelInput(threadNote.group_label || '')
                                                }}
                                            >
                                                {threadNote.group_label}
                                                <Edit2 className="h-3 w-3" />
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs mb-2"
                                                onClick={() => setEditingLabel(threadNote.id)}
                                            >
                                                + Add Label
                                            </Button>
                                        )}

                                        <CardTitle>{threadNote.note.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                            {threadNote.note.content}
                                        </p>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleMoveNote(index, 'up')}
                                            disabled={index === 0}
                                        >
                                            <MoveUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleMoveNote(index, 'down')}
                                            disabled={index === thread.notes.length - 1}
                                        >
                                            <MoveDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveNote(threadNote.note_id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>
        </div >
    )
}
