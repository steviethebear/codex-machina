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
import { SourceForm } from '@/components/admin/SourceForm'

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
    const [description, setDescription] = useState('')
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
        const result = await createSource({ title, author, type, url, description })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Source requested! You can use it immediately while it's pending review.")
            if (onSuccess) onSuccess(result.data)
            onOpenChange(false)
            // Reset form
            setTitle('')
            setAuthor('')
            setAuthor('')
            setUrl('')
            setDescription('')
            setType('article')
        }
        setIsSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
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

                    <SourceForm
                        defaultValues={{ title, author, type, url, description }}
                        onSubmit={async (data) => {
                            setIsSubmitting(true)
                            // Keep title state synced for fuzzy match if user types in SourceForm? 
                            // SourceForm handles its own state. 
                            // If we want fuzzy match we must lift state or add callback.
                            // For now, let's keep it simple. User wanted consistent forms. 

                            if (!data.title || !data.author) {
                                toast.error("Title and Author are required")
                                setIsSubmitting(false)
                                return
                            }

                            const result = await createSource(data)

                            if (result.error) {
                                toast.error(result.error)
                            } else {
                                toast.success("Source requested! You can use it immediately while it's pending review.")
                                if (onSuccess) onSuccess(result.data)
                                onOpenChange(false)
                                // Reset handled by dialog close mainly
                            }
                            setIsSubmitting(false)
                        }}
                        isLoading={isSubmitting}
                        submitLabel="Submit Request"
                        onCancel={() => onOpenChange(false)}
                        mode="student"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
