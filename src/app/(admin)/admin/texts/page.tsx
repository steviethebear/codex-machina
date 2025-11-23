'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database } from '@/types/database.types'
import { Trash2, Archive } from 'lucide-react'
import { SimpleTooltip } from '@/components/ui/simple-tooltip'
import { toast } from 'sonner'

type Text = Database['public']['Tables']['texts']['Row']

export default function TextsPage() {
    const supabase = createClient()
    const [texts, setTexts] = useState<Text[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [type, setType] = useState('book')

    const fetchTexts = async () => {
        const { data } = await supabase.from('texts').select('*').order('created_at', { ascending: false })
        if (data) setTexts(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchTexts()
    }, [supabase])

    const handleAddText = async (e: React.FormEvent) => {
        e.preventDefault()
        // @ts-ignore
        const { error } = await supabase.from('texts').insert({ title, author, type })

        if (error) {
            toast.error('Failed to add text: ' + error.message)
            return
        }

        toast.success('Text added successfully')
        setTitle('')
        setAuthor('')
        fetchTexts()
    }

    const handleArchive = async (id: string, currentStatus: boolean) => {
        // @ts-ignore
        const { error } = await supabase.from('texts').update({ archived: !currentStatus }).eq('id', id)

        if (error) {
            toast.error('Failed to update text status: ' + error.message)
            return
        }

        toast.success(currentStatus ? 'Text restored' : 'Text archived')
        fetchTexts()
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Text Management</h2>
                <p className="text-muted-foreground">Manage academic sources.</p>
            </div>

            <div className="p-4 border rounded-lg bg-card">
                <h3 className="text-lg font-medium mb-4">Add New Text</h3>
                <form onSubmit={handleAddText} className="grid gap-4 md:grid-cols-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Author</label>
                        <Input required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="book">Book</option>
                            <option value="article">Article</option>
                            <option value="film">Film</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <Button type="submit">Add Text</Button>
                </form>
            </div>

            <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Author</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {texts.map((text) => (
                            <tr key={text.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle font-medium">{text.title}</td>
                                <td className="p-4 align-middle">{text.author}</td>
                                <td className="p-4 align-middle capitalize">{text.type}</td>
                                <td className="p-4 align-middle">
                                    {text.archived ? <span className="text-muted-foreground">Archived</span> : <span className="text-green-500">Active</span>}
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <SimpleTooltip content={text.archived ? 'Restore this text' : 'Archive this text'}>
                                        <Button variant="ghost" size="icon" onClick={() => handleArchive(text.id, text.archived || false)}>
                                            <Archive className="h-4 w-4" />
                                        </Button>
                                    </SimpleTooltip>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
