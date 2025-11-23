'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { checkMeaningAsync } from '@/lib/actions/check-meaning-async'

export default function EditAtomPage({ params }: { params: { id: string } }) {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [atom, setAtom] = useState<any>(null)
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const fetchAtom = async () => {
            if (!user) return

            const { data } = await supabase
                .from('atomic_notes')
                .select('*')
                .eq('id', params.id)
                .eq('author_id', user.id) // Security: only author can edit
                .single()

            if (data) {
                setAtom(data)
                setTitle((data as any).title)
                setBody((data as any).body)
            } else {
                toast.error('Atom not found or unauthorized')
                router.push('/my-submissions')
            }
            setLoading(false)
        }

        fetchAtom()
    }, [user, params.id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !atom) return

        if (body.length < 50) {
            toast.error('Atom body must be at least 50 characters.')
            return
        }

        setSubmitting(true)

        // Update the atom
        // @ts-ignore
        const { error } = await supabase.from('atomic_notes').update({
            title,
            body,
            moderation_status: 'pending', // Reset to pending
            moderation_result: null,
            moderation_checked_at: null
        }).eq('id', atom.id)

        if (error) {
            toast.error('Failed to update atom')
            setSubmitting(false)
            return
        }

        toast.success('Atom resubmitted for review!')

        // Trigger async moderation
        checkMeaningAsync(atom.id).catch((err) => {
            console.error('Async moderation failed:', err)
        })

        router.push('/my-submissions')
    }

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Edit & Resubmit Atom</h2>
                <p className="text-muted-foreground">Fix the issues and resubmit for review</p>
            </div>

            {atom?.moderation_result && (
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded border border-red-200 dark:border-red-800">
                    <strong className="text-red-900 dark:text-red-400">Previous Rejection:</strong>
                    <p className="mt-2 text-red-800 dark:text-red-300">{atom.moderation_result}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Atom title"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Body (min 50 characters)</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full min-h-[200px] p-3 rounded-md border bg-background"
                        placeholder="Atom body..."
                        required
                    />
                    <p className="text-xs text-muted-foreground">{body.length} / 50 characters</p>
                </div>

                <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Resubmit for Review
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/my-submissions')}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
