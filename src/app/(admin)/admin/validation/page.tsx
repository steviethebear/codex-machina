'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function ValidationPage() {
    const [submissions, setSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchSubmissions = async () => {
        // Fetch user_signals that are completed or queued
        const { data, error } = await supabase
            .from('user_signals')
            .select(`
                *,
                user:users(codex_name, email),
                signal:signals(title, description)
            `)
            .in('status', ['completed', 'queued_for_review'])
            .order('completed_at', { ascending: false })

        if (data) setSubmissions(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchSubmissions()
    }, [])

    const handleReview = async (id: string, action: 'approve' | 'reject') => {
        // For now, just toast since they are already completed in MVP
        // In real implementation, this would update status
        toast.info(`Action ${action} recorded (Simulation)`)
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Signal Validation</h1>
                <p className="text-muted-foreground">Review student signal submissions</p>
            </div>

            <div className="space-y-4">
                {submissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No submissions found</div>
                ) : (
                    submissions.map(sub => (
                        <Card key={sub.id}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{sub.signal?.title}</h3>
                                        <div className="text-sm text-muted-foreground mb-2">
                                            By {sub.user?.codex_name} • {sub.completed_at ? formatDistanceToNow(new Date(sub.completed_at), { addSuffix: true }) : 'Pending'}
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-md text-sm">
                                            <strong>Submission:</strong>
                                            <pre className="mt-1 whitespace-pre-wrap font-sans text-muted-foreground">
                                                {JSON.stringify(sub.submission, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full text-center ${sub.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {sub.status}
                                        </span>
                                        {/* Actions for future use */}
                                        <div className="flex gap-2 mt-2">
                                            <Button size="sm" variant="outline" onClick={() => handleReview(sub.id, 'reject')}>
                                                Revoke
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
