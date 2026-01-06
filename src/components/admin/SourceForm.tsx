'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface SourceFormData {
    title: string
    author: string
    type: string
    url: string
    description: string
}

interface SourceFormProps {
    defaultValues?: SourceFormData
    onSubmit: (data: SourceFormData) => void
    isLoading?: boolean
    submitLabel?: string
    onCancel?: () => void
    mode?: 'admin' | 'student'
}

export function SourceForm({ defaultValues, onSubmit, isLoading, submitLabel = "Submit", onCancel, mode = 'admin' }: SourceFormProps) {
    const [data, setData] = useState<SourceFormData>({
        title: '',
        author: '',
        type: 'book',
        url: '',
        description: '',
        ...defaultValues
    })

    const handleSubmit = () => {
        onSubmit(data)
    }

    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={e => setData({ ...data, title: e.target.value })}
                    placeholder="e.g. The Myth of Sisyphus"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="author">Author</Label>
                <Input
                    id="author"
                    value={data.author}
                    onChange={e => setData({ ...data, author: e.target.value })}
                    placeholder="e.g. Albert Camus"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                        value={data.type}
                        onValueChange={v => setData({ ...data, type: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="book">Book</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="paper">Paper</SelectItem>
                            <SelectItem value="poem">Poem</SelectItem>
                            <SelectItem value="song">Song</SelectItem>
                            <SelectItem value="short_story">Short Story</SelectItem>
                            <SelectItem value="excerpt">Excerpt</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="url">URL (Optional)</Label>
                    <Input
                        id="url"
                        value={data.url}
                        onChange={e => setData({ ...data, url: e.target.value })}
                        placeholder="https://..."
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={e => setData({ ...data, description: e.target.value })}
                    placeholder="Brief context..."
                    className="min-h-[100px]"
                />
            </div>
            <div className="flex justify-end gap-2 mt-4">
                {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? "Saving..." : submitLabel}
                </Button>
            </div>
        </div>
    )
}
