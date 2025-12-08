'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { getOutline, updateOutlineStructure } from '@/lib/actions/outlines'
import { getNotes } from '@/lib/actions/notes' // I need getNotes that returns all my notes. I'll use user_id filter.
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, Save, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner' // Assuming sonner is installed as per package.json

interface OutlineItem {
    id: string // unique instance id
    note_id: string
    title: string
    level: number // 0, 1, 2...
}

export default function OutlineBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { user } = useAuth()
    const router = useRouter()

    const [outline, setOutline] = useState<any>(null)
    const [availableNotes, setAvailableNotes] = useState<any[]>([])
    const [structure, setStructure] = useState<OutlineItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const load = async () => {
            if (!user) return

            // Load Outline
            const { data: outlineData } = await getOutline(id)
            if (outlineData) {
                setOutline(outlineData)
                setStructure((outlineData.structure || []) as unknown as OutlineItem[])
            }

            // Load Notes (using supabase client directly for simpler query or existing action?)
            // I'll use supabase client here to just get 'my notes' roughly 
            const supabase = createClient()
            const { data: notesData } = await supabase
                .from('notes')
                .select('id, title, content, type')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })

            if (notesData) setAvailableNotes(notesData)

            setLoading(false)
        }
        load()
    }, [id, user])

    const filteredNotes = availableNotes.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAdd = (note: any) => {
        const newItem: OutlineItem = {
            id: crypto.randomUUID(),
            note_id: note.id,
            title: note.title,
            level: 0
        }
        setStructure([...structure, newItem])
    }

    const handleRemove = (index: number) => {
        const newStructure = [...structure]
        newStructure.splice(index, 1)
        setStructure(newStructure)
    }

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === structure.length - 1) return

        const newStructure = [...structure]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const temp = newStructure[targetIndex]
        newStructure[targetIndex] = newStructure[index]
        newStructure[index] = temp
        setStructure(newStructure)
    }

    const handleIndent = (index: number, direction: 'in' | 'out') => {
        const newStructure = [...structure]
        const item = { ...newStructure[index] }
        if (direction === 'in') item.level = Math.min(item.level + 1, 3) // Max depth 3
        if (direction === 'out') item.level = Math.max(item.level - 1, 0)
        newStructure[index] = item
        setStructure(newStructure)
    }

    const handleSave = async () => {
        setIsSaving(true)
        const result = await updateOutlineStructure(id, structure)
        if (result.error) {
            toast.error('Failed to save outline')
        } else {
            toast.success('Outline saved')
        }
        setIsSaving(false)
    }

    if (loading) return <div className="p-8">Loading builder...</div>
    if (!outline) return <div className="p-8">Outline not found</div>

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b bg-card px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/outlines" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold leading-none mb-1">{outline.title}</h1>
                        <p className="text-xs text-muted-foreground">Outline Builder</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Source Notes */}
                <div className="w-1/3 border-r bg-muted/10 flex flex-col min-w-[300px]">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search your notes..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredNotes.map(note => (
                            <Card key={note.id} className="cursor-pointer hover:border-primary transition-colors group" onClick={() => handleAdd(note)}>
                                <CardContent className="p-3">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-sm line-clamp-1">{note.title}</div>
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="h-4 w-4 text-primary" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {note.content}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
                                        {note.type}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Outline Structure */}
                <div className="flex-1 bg-background flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8">
                        {structure.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4">
                                <p>Drag (or click) notes from the left to build your outline.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-w-3xl mx-auto">
                                {structure.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 group"
                                        style={{ marginLeft: `${item.level * 2}rem` }}
                                    >
                                        <div className="flex items-center bg-card border rounded-md p-3 flex-1 shadow-sm">
                                            <div className="w-6 text-muted-foreground font-mono text-xs">
                                                {index + 1}.
                                            </div>
                                            <div className="font-medium flex-1">
                                                {item.title}
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-md shadow-sm p-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleIndent(index, 'out')}>
                                                <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleIndent(index, 'in')}>
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                            <div className="w-px h-4 bg-border mx-1" />
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'up')}>
                                                <ArrowUp className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(index, 'down')}>
                                                <ArrowDown className="h-3 w-3" />
                                            </Button>
                                            <div className="w-px h-4 bg-border mx-1" />
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleRemove(index)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
