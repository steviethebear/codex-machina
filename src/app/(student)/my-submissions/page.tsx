'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, Edit } from 'lucide-react'

type Atom = {
    id: string
    title: string
    body: string
    type: string
    moderation_status: string
    moderation_result: string | null
    moderation_checked_at: string | null
    created_at: string
}

export default function MySubmissionsPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [atoms, setAtoms] = useState<Atom[]>([])
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const [loading, setLoading] = useState(true)

    const fetchAtoms = async () => {
        if (!user) return

        setLoading(true)
        const { data } = await supabase
            .from('atomic_notes')
            .select('*')
            .eq('author_id', user.id)
            .eq('moderation_status', filter)
            .order('created_at', { ascending: false })

        setAtoms((data as any) || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchAtoms()
    }, [filter, user])

    const getStatusIcon = (atom: Atom) => {
        if (atom.moderation_status === 'pending' && atom.moderation_result && !atom.moderation_result.includes('approved')) {
            // Pending with flag (awaiting admin)
            return <Clock className="h-5 w-5 text-red-500" />
        }
        switch (atom.moderation_status) {
            case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />
            case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />
            default: return null
        }
    }

    const getStatusColor = (atom: Atom) => {
        if (atom.moderation_status === 'pending' && atom.moderation_result && !atom.moderation_result.includes('approved')) {
            // Pending with flag (awaiting admin)
            return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-500'
        }
        switch (atom.moderation_status) {
            case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-500'
            case 'approved': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-500'
            case 'rejected': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-500'
            default: return ''
        }
    }

    const getStatusText = (atom: Atom) => {
        if (atom.moderation_status === 'pending' && atom.moderation_result && !atom.moderation_result.includes('approved')) {
            return 'awaiting admin'
        }
        return atom.moderation_status
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Submissions</h2>
                <p className="text-muted-foreground">Track the status of your atoms</p>
            </div>

            <div className="flex gap-2">
                <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setFilter('pending')}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    Pending
                </Button>
                <Button
                    variant={filter === 'approved' ? 'default' : 'outline'}
                    onClick={() => setFilter('approved')}
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approved
                </Button>
                <Button
                    variant={filter === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setFilter('rejected')}
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejected
                </Button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : atoms.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No {filter} atoms
                </div>
            ) : (
                <div className="space-y-4">
                    {atoms.map((atom) => (
                        <div key={atom.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(atom)}
                                        <h3 className="font-semibold text-lg">{atom.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Submitted {new Date(atom.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(atom)}`}>
                                    {getStatusText(atom)}
                                </span>
                            </div>

                            <div className="bg-muted/50 rounded p-3 text-sm">
                                {atom.body}
                            </div>

                            {atom.moderation_result && atom.moderation_status === 'rejected' && (
                                <div className="text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                                    <strong className="text-red-900 dark:text-red-400">Rejection Reason:</strong>
                                    <p className="mt-1 text-red-800 dark:text-red-300">{atom.moderation_result}</p>
                                </div>
                            )}

                            {atom.moderation_status === 'pending' && !atom.moderation_result && (
                                <div className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                                    <strong className="text-yellow-900 dark:text-yellow-400">Status:</strong>
                                    <p className="mt-1 text-yellow-800 dark:text-yellow-300">Your atom is awaiting AI review. This usually takes 2-3 seconds.</p>
                                </div>
                            )}

                            {atom.moderation_status === 'pending' && atom.moderation_result && !atom.moderation_result.includes('approved') && (
                                <div className="text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                                    <strong className="text-red-900 dark:text-red-400">Flagged by AI:</strong>
                                    <p className="mt-1 text-red-800 dark:text-red-300">{atom.moderation_result}</p>
                                    <p className="mt-2 text-red-800 dark:text-red-300">An admin will review your submission shortly.</p>
                                </div>
                            )}

                            {atom.moderation_status === 'rejected' && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => router.push(`/my-submissions/${atom.id}/edit`)}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit & Resubmit
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
