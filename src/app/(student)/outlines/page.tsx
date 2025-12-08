'use client'

import { useEffect, useState } from 'react'
import { getOutlines, createOutline } from '@/lib/actions/outlines'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { PlusCircle, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

export default function OutlinesPage() {
    const [outlines, setOutlines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [createOpen, setCreateOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            const { data } = await getOutlines()
            if (data) setOutlines(data)
            setLoading(false)
        }
        load()
    }, [])

    const handleCreate = async () => {
        if (!newTitle.trim()) return
        setIsCreating(true)
        const { data, error } = await createOutline(newTitle)
        if (error) {
            alert('Error creating outline: ' + error)
        } else if (data) {
            setCreateOpen(false)
            router.push(`/outlines/${data.id}`)
        }
        setIsCreating(false)
    }

    if (loading) return <div className="p-8">Loading outlines...</div>

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Outlines</h1>
                    <p className="text-muted-foreground">Assemble your notes into structures for your writing.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Outline
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Outline</DialogTitle>
                        </DialogHeader>
                        <Input
                            placeholder="e.g. Unit 1 Essay Plan"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                        />
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {outlines.map(outline => (
                    <Card key={outline.id} className="group hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                {outline.title}
                            </CardTitle>
                            <CardDescription>
                                {outline.structure?.length || 0} items • Last updated {new Date(outline.updated_at).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Link href={`/outlines/${outline.id}`} className="w-full">
                                <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                                    Open Outline <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {outlines.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <p>No outlines yet. Create one to start assembling your thoughts.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
