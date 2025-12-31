'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Library, BookOpen, Link as LinkIcon, Check, X, MessageSquare, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getPendingSources, approveSource, rejectSource } from '@/lib/actions/sources'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function PendingSourcesPage() {
    const router = useRouter()
    const [pending, setPending] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectionNote, setRejectionNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchPending = async () => {
        setLoading(true)
        const result = await getPendingSources()
        if (result.error) {
            toast.error(result.error)
        } else {
            setPending(result.data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPending()
    }, [])

    const handleApprove = async (id: string) => {
        const result = await approveSource(id)
        if (result.success) {
            toast.success("Source approved and added to class library")
            setPending(prev => prev.filter(s => s.id !== id))
        } else {
            toast.error(result.error || "Approval failed")
        }
    }

    const handleReject = async () => {
        if (!rejectingId) return

        setIsSubmitting(true)
        const result = await rejectSource(rejectingId, rejectionNote)
        if (result.success) {
            toast.success("Source rejected")
            setPending(prev => prev.filter(s => s.id !== rejectingId))
            setRejectingId(null)
            setRejectionNote('')
        } else {
            toast.error(result.error || "Rejection failed")
        }
        setIsSubmitting(false)
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.push('/sources')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pending Sources</h1>
                    <p className="text-muted-foreground mt-1">Review student-submitted sources for the class library.</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
                </div>
            ) : pending.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Clear Queue</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                        No pending source requests to review at this time.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => router.push('/sources')}>
                        Back to Library
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pending.map(source => (
                        <Card key={source.id} className="group overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                            PENDING REVIEW
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Requested by {source.creator?.codex_name || source.creator?.email || 'Unknown'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(source.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                        {source.type === 'book' ? <BookOpen className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg">{source.title}</h3>
                                        <p className="text-foreground/80">{source.author}</p>
                                        {source.url && (
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1 truncate"
                                            >
                                                <LinkIcon className="h-3 w-3" /> {source.url}
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => setRejectingId(source.id)}
                                        >
                                            <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(source.id)}
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Source Request</DialogTitle>
                        <DialogDescription>
                            Let the student know why this source isn't being added to the library (optional).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 py-4">
                        <Label htmlFor="note">Rejection Note</Label>
                        <Textarea
                            id="note"
                            placeholder="e.g. This source already exists under a different name, or lacks academic rigor."
                            value={rejectionNote}
                            onChange={e => setRejectionNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                            {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
