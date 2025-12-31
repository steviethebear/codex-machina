'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSource, fuzzyMatchSources } from '@/lib/actions/sources'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

interface RequestSourceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialTitle?: string
    onSuccess?: (source: any) => void
}

export function RequestSourceDialog({ open, onOpenChange, initialTitle = '', onSuccess }: RequestSourceDialogProps) {
    const [title, setTitle] = useState(initialTitle)
    const [author, setAuthor] = useState('')
    const [url, setUrl] = useState('')
    const [type, setType] = useState('article')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [matches, setMatches] = useState<any[]>([])

    const handleTitleChange = async (val: string) => {
        setTitle(val)
        if (val.length > 3) {
            const result = await fuzzyMatchSources(val)
            if (result.data) setMatches(result.data)
        } else {
            setMatches([])
        }
    }

    const handleSubmit = async () => {
        if (!title || !author) {
            toast.error("Title and Author are required")
            return
        }

        setIsSubmitting(true)
        const result = await createSource({ title, author, type, url })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Source requested! You can use it immediately while it's pending review.")
            if (onSuccess) onSuccess(result.data)
            onOpenChange(false)
            // Reset form
            setTitle('')
            setAuthor('')
            setUrl('')
            setType('article')
        }
        setIsSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request New Source</DialogTitle>
                    <DialogDescription>
                        Can't find a source in the class list? Add it here. It will be usable immediately but reviewed by a teacher.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {matches.length > 0 && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                            <div className="flex items-center gap-2 mb-2 font-semibold">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <span>Similar sources found</span>
                            </div>
                            <div className="text-yellow-700 text-xs">
                                These sources already exist. Please check if one of them is what you need:
                                <ul className="mt-1 list-disc list-inside">
                                    {matches.map(m => (
                                        <li key={m.id} className="truncate">{m.title} by {m.author}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="title">Source Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={e => handleTitleChange(e.target.value)}
                            placeholder="e.g. The Gutenberg Galaxy"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="author">Author</Label>
                        <Input
                            id="author"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            placeholder="e.g. Marshall McLuhan"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="url">URL (Optional)</Label>
                        <Input
                            id="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={type} onValueChange={setType}>
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
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
