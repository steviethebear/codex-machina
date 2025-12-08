'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createNote, deleteNote } from '@/lib/actions/notes'
import { FileText, Lightbulb, BookOpen, Brain, PlusCircle, Trash2, Eye, Search, Filter } from 'lucide-react'
import Link from 'next/link'

interface Note {
    id: string
    title: string
    content: string
    type: 'fleeting' | 'literature' | 'permanent'
    is_public: boolean
    citation?: string
    page_number?: string
    created_at: string
    updated_at: string
}

export default function MyNotesPage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    // Create Note State
    const [isCreating, setIsCreating] = useState(false)
    const [createType, setCreateType] = useState<'fleeting' | 'literature' | 'permanent'>('fleeting')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [citation, setCitation] = useState('')
    const [pageNumber, setPageNumber] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!user) return

        const fetchNotes = async () => {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })

            if (data) setNotes(data as Note[])
            setLoading(false)
        }

        fetchNotes()
    }, [user, supabase])

    const filteredNotes = notes.filter(note => {
        const matchesTab = activeTab === 'all' || note.type === activeTab
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesTab && matchesSearch
    })

    const handleCreate = async () => {
        if (!user || !title.trim() || !content.trim()) return
        setIsSubmitting(true)

        const result = await createNote({
            user_id: user.id,
            title,
            content,
            type: createType,
            is_public: createType !== 'fleeting',
            citation: createType === 'literature' ? citation : null,
            page_number: createType === 'literature' ? pageNumber : null,
        })

        if (!result.error && result.data) {
            setNotes([result.data as Note, ...notes])
            resetForm()
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (noteId: string) => {
        if (!confirm('Delete this note? This cannot be undone.')) return

        const result = await deleteNote(noteId)
        if (!result.error) {
            setNotes(notes.filter(n => n.id !== noteId))
        }
    }

    const resetForm = () => {
        setIsCreating(false)
        setTitle('')
        setContent('')
        setCitation('')
        setPageNumber('')
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'fleeting': return <Lightbulb className="h-4 w-4" />
            case 'literature': return <BookOpen className="h-4 w-4" />
            case 'permanent': return <Brain className="h-4 w-4" />
            default: return <FileText className="h-4 w-4" />
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'fleeting': return 'bg-zinc-500/20 text-zinc-400'
            case 'literature': return 'bg-blue-500/20 text-blue-400'
            case 'permanent': return 'bg-green-500/20 text-green-400'
            default: return ''
        }
    }

    if (loading) return <div className="p-8">Loading notes...</div>

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
                    <p className="text-muted-foreground mt-1">
                        {notes.length} note{notes.length !== 1 ? 's' : ''} in your Zettelkasten
                    </p>
                </div>
                <Button onClick={() => setIsCreating(true)} size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Note
                </Button>
            </div>

            {/* Create Note Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <div className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Create New Note</DialogTitle>
                    </DialogHeader>

                    {/* Type Selector */}
                    <div className="flex gap-2">
                        {(['fleeting', 'literature', 'permanent'] as const).map(type => (
                            <Button
                                key={type}
                                variant={createType === type ? 'default' : 'outline'}
                                onClick={() => setCreateType(type)}
                                className="flex-1 capitalize"
                            >
                                {getTypeIcon(type)}
                                <span className="ml-2">{type}</span>
                            </Button>
                        ))}
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {createType === 'literature' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Source Citation (MLA)</Label>
                                    <Input
                                        placeholder="Author, Title, Publisher, Year..."
                                        value={citation}
                                        onChange={e => setCitation(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Page Number (Optional)</Label>
                                    <Input
                                        placeholder="p. 42"
                                        value={pageNumber}
                                        onChange={e => setPageNumber(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label>{createType === 'permanent' ? 'Claim / Title' : 'Title'}</Label>
                            <Input
                                placeholder={createType === 'permanent' ? 'State your claim clearly...' : 'Short summary...'}
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                {createType === 'fleeting' ? 'Content' :
                                    createType === 'literature' ? 'Paraphrased Content' :
                                        'Reasoning & Evidence'}
                            </Label>
                            <Textarea
                                placeholder={
                                    createType === 'fleeting' ? "What's on your mind? Capture it quick." :
                                        createType === 'literature' ? 'Summarize the idea in your own words.' :
                                            'Explain your reasoning. Connect ideas from your literature notes.'
                                }
                                className="min-h-[200px]"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {createType === 'fleeting' ? '🔒 Private - Only you can see this' : '🌍 Public - Visible to your class'}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={resetForm}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isSubmitting || !title.trim() || !content.trim()}>
                            {isSubmitting ? 'Creating...' : 'Create Note'}
                        </Button>
                    </DialogFooter>
                </div>
            </Dialog>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="fleeting" className="gap-1">
                            <Lightbulb className="h-3 w-3" /> Fleeting
                        </TabsTrigger>
                        <TabsTrigger value="literature" className="gap-1">
                            <BookOpen className="h-3 w-3" /> Literature
                        </TabsTrigger>
                        <TabsTrigger value="permanent" className="gap-1">
                            <Brain className="h-3 w-3" /> Permanent
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                        <p className="text-muted-foreground mb-4">
                            {activeTab === 'all'
                                ? 'Start building your Zettelkasten by creating your first note.'
                                : `You don't have any ${activeTab} notes yet.`}
                        </p>
                        <Button onClick={() => setIsCreating(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Your First Note
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredNotes.map(note => (
                        <Card key={note.id} className="group hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Badge variant="secondary" className={getTypeColor(note.type)}>
                                            {getTypeIcon(note.type)}
                                        </Badge>
                                        <CardTitle className="text-base truncate">{note.title}</CardTitle>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/notes/${note.id}`}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(note.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                {note.citation && (
                                    <p className="text-xs text-muted-foreground italic truncate">{note.citation}</p>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <p className="text-xs text-muted-foreground">
                                    {new Date(note.updated_at).toLocaleDateString()}
                                </p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
