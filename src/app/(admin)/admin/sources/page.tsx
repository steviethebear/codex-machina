'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Library, Link as LinkIcon, BookOpen, Search, Plus, FileText, Video, MoreHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { createSource } from '@/lib/actions/sources'

export default function SourcesPage() {
    const [sources, setSources] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const supabase = createClient()

    // Add Source State
    const [showAdd, setShowAdd] = useState(false)
    const [newSource, setNewSource] = useState({ title: '', author: '', type: 'book', url: '', description: '' })

    const fetchSources = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('texts')
            .select('*')
            .in('status', ['approved'])
            .order('title')

        if (error) {
            console.error(error)
            toast.error('Failed to load sources')
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
            toast.error('Title and Author are required')
            return
        }

        const result = await createSource(newSource)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Source added to library')
            setShowAdd(false)
            setNewSource({ title: '', author: '', type: 'book', url: '', description: '' })
            fetchSources()
        }
    }

    const filtered = sources.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.author.toLowerCase().includes(search.toLowerCase())
        const matchesType = typeFilter === 'all' || s.type === typeFilter
        return matchesSearch && matchesType
    })

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Source Library</h1>
                    <p className="text-muted-foreground mt-1">Manage approved texts and media for the class.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/sources/pending">
                            Review Pending
                        </Link>
                    </Button>
                    <Dialog open={showAdd} onOpenChange={setShowAdd}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Source
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add to Library</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={newSource.title}
                                        onChange={e => setNewSource({ ...newSource, title: e.target.value })}
                                        placeholder="e.g. The Myth of Sisyphus"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Author</Label>
                                    <Input
                                        value={newSource.author}
                                        onChange={e => setNewSource({ ...newSource, author: e.target.value })}
                                        placeholder="e.g. Albert Camus"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Type</Label>
                                        <Select
                                            value={newSource.type}
                                            onValueChange={v => setNewSource({ ...newSource, type: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="book">Book</SelectItem>
                                                <SelectItem value="article">Article</SelectItem>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="paper">Paper</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>URL (Optional)</Label>
                                        <Input
                                            value={newSource.url}
                                            onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description (Optional)</Label>
                                    <Input
                                        value={newSource.description}
                                        onChange={e => setNewSource({ ...newSource, description: e.target.value })}
                                        placeholder="Brief context..."
                                    />
                                </div>
                            </div>
                            <Button onClick={handleCreate}>Add Source</Button>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 bg-card p-4 rounded-lg border">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search title or author..."
                        className="pl-8"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="book">Books</SelectItem>
                        <SelectItem value="article">Articles</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                        <SelectItem value="paper">Papers</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No sources found matching your filters.
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(source => (
                        <Card key={source.id} className="hover:bg-accent/5 transition-colors">
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-1">
                                    {source.type === 'book' ? <BookOpen className="h-5 w-5" /> :
                                        source.type === 'video' ? <Video className="h-5 w-5" /> :
                                            source.type === 'paper' ? <FileText className="h-5 w-5" /> :
                                                <LinkIcon className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg leading-none">{source.title}</h3>
                                        <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                            {source.type}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm mt-1">{source.author}</p>
                                    {source.description && (
                                        <p className="text-sm mt-2 text-foreground/80 bg-muted/30 p-2 rounded inline-block">
                                            {source.description}
                                        </p>
                                    )}
                                    {source.url && (
                                        <a href={source.url} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-2">
                                            <LinkIcon className="h-3 w-3" /> {source.url}
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
