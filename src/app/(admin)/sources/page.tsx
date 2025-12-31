'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Library, Link as LinkIcon, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Source = Database['public']['Tables']['sources']['Row']

export default function SourcesPage() {
    const supabase = createClient()
    const [sources, setSources] = useState<Source[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [newSource, setNewSource] = useState({
        title: '',
        author: '',
        url: '',
        type: 'article', // article, book, video, website
        metadata: '{}' // JSON string for flexibility
    })

    const fetchSources = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('sources')
            .select('*')
            .order('created_at', { ascending: false })
            .returns<Source[]>()

        if (error) {
            toast.error("Failed to load sources")
        } else {
            setSources(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSources()
    }, [])

    const handleCreate = async () => {
        if (!newSource.title || !newSource.author) {
            toast.error("Title and Author are required")
            return
        }

        setIsSubmitting(true)
        const { error } = await supabase.from('sources').insert({
            title: newSource.title,
            author: newSource.author,
            url: newSource.url || null,
            type: newSource.type,
            metadata: newSource.metadata ? JSON.parse(newSource.metadata) : null
        })

        if (error) {
            toast.error("Failed to create source: " + error.message)
        } else {
            toast.success("Source created successfully")
            setNewSource({ title: '', author: '', url: '', type: 'article', metadata: '{}' })
            setIsDialogOpen(false)
            fetchSources() // Refresh list
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this source? This will not remove existing links in student notes.")) return

        const { error } = await supabase.from('sources').delete().eq('id', id)
        if (error) {
            toast.error("Failed to delete source")
        } else {
            toast.success("Source deleted")
            setSources(prev => prev.filter(s => s.id !== id))
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
                    <p className="text-muted-foreground mt-1">Manage shared reference anchors and resources for the Codex.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Source
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Source</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={newSource.title}
                                    onChange={e => setNewSource({ ...newSource, title: e.target.value })}
                                    placeholder="e.g. The Medium is the Message"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="author">Author</Label>
                                <Input
                                    id="author"
                                    value={newSource.author}
                                    onChange={e => setNewSource({ ...newSource, author: e.target.value })}
                                    placeholder="e.g. Marshall McLuhan"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        value={newSource.type}
                                        onValueChange={v => setNewSource({ ...newSource, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="article">Article</SelectItem>
                                            <SelectItem value="book">Book</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="website">Website</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="url">URL (Optional)</Label>
                                    <Input
                                        id="url"
                                        value={newSource.url}
                                        onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Source"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
                </div>
            ) : (
                <div className="grid gap-4">
                    {sources.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-muted/10">
                            <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No sources yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                Add foundational texts, videos, or articles for students to reference.
                            </p>
                        </div>
                    ) : (
                        sources.map(source => (
                            <Card key={source.id} className="group hover:border-primary/50 transition-colors">
                                <CardContent className="p-4 flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                        {source.type === 'book' ? <BookOpen className="h-5 w-5" /> :
                                            source.type === 'video' ? <div className="font-bold text-xs">VID</div> :
                                                <LinkIcon className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold truncate">{source.title}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                                {source.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80">{source.author}</p>
                                        {source.url && (
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 truncate"
                                            >
                                                <LinkIcon className="h-3 w-3" /> {source.url}
                                            </a>
                                        )}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(source.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
