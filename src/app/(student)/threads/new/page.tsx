'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { createThread } from '@/lib/actions/threads'
import { toast } from 'sonner'

export default function NewThreadPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [creating, setCreating] = useState(false)

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.error('Thread title is required')
            return
        }

        setCreating(true)
        const result = await createThread(title, description)

        if (result.error) {
            toast.error('Failed to create thread')
            setCreating(false)
        } else if (result.data && 'id' in result.data) {
            toast.success('Thread created')
            router.push(`/threads/${(result.data as any).id}`)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-8 max-w-3xl mx-auto">
            <Button
                variant="ghost"
                onClick={() => router.push('/threads')}
                className="w-fit"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Threads
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Thread</CardTitle>
                    <CardDescription>
                        Give your weaving space a title and optional description
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Exploring Democracy & Authority"
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What tensions or questions does this thread explore?"
                            className="mt-2"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={handleCreate}
                            disabled={creating || !title.trim()}
                        >
                            {creating ? 'Creating...' : 'Create Thread'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/threads')}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
