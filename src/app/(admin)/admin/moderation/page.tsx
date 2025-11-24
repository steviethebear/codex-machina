'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { moderateAtom } from '@/lib/actions/moderate-atom'
import { setQualityFlag } from '@/lib/actions/set-quality-flag'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Search, Star, Bookmark, Flag } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth-provider'

type Atom = {
    id: string
    title: string
    body: string
    type: string
    moderation_status: string
    moderation_result: string | null
    moderation_checked_at: string | null
    created_at: string
    author: {
        codex_name: string
        email: string
    }
}

export default function ModerationPage() {
    const supabase = createClient()
    const [allAtoms, setAllAtoms] = useState<Atom[]>([])
    const [filteredAtoms, setFilteredAtoms] = useState<Atom[]>([])
    const [filter, setFilter] = useState<'flagged' | 'all'>('flagged')
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const fetchAtoms = async () => {
        setLoading(true)
        let query = supabase
            .from('atomic_notes')
            .select(`
                id,
                title,
                body,
                type,
                moderation_status,
                moderation_result,
                moderation_checked_at,
                created_at,
                author:users!atomic_notes_author_id_fkey(codex_name, email)
            `)
            .order('moderation_checked_at', { ascending: false, nullsFirst: true })

        if (filter === 'flagged') {
            // Show atoms that need review - using a simpler approach
            const { data } = await supabase
                .from('atomic_notes')
                .select(`
                    id,
                    title,
                    body,
                    type,
                    moderation_status,
                    moderation_result,
                    moderation_checked_at,
                    created_at,
                    author:users!atomic_notes_author_id_fkey(codex_name, email)
                `)
                .order('moderation_checked_at', { ascending: false, nullsFirst: true })

            // Filter in JavaScript to handle complex OR logic
            const flaggedAtoms = (data as any[])?.filter(atom =>
                atom.moderation_status === 'flagged' ||
                (atom.moderation_status === 'pending' &&
                    atom.moderation_result &&
                    !atom.moderation_result.toLowerCase().includes('approved'))
            ) || []

            setAllAtoms(flaggedAtoms)
            setLoading(false)
            return
        }

        const { data } = await query
        setAllAtoms((data as any) || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchAtoms()
    }, [filter])

    // Apply search and status filters
    useEffect(() => {
        let filtered = allAtoms

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(atom =>
                atom.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                atom.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (atom.author as any)?.codex_name?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(atom => atom.moderation_status === statusFilter)
        }

        setFilteredAtoms(filtered)
    }, [allAtoms, searchQuery, statusFilter])

    const handleModerate = async (atomId: string, action: 'approve' | 'reject') => {
        const result = await moderateAtom(atomId, action)
        if (result.success) {
            toast.success(action === 'approve' ? 'Atom approved' : 'Atom rejected and hidden')
            // Refetch to update the list immediately
            await fetchAtoms()
        } else {
            toast.error(result.error || 'Failed to moderate atom')
        }
    }

    const atoms = filteredAtoms.length > 0 || searchQuery || statusFilter !== 'all' ? filteredAtoms : allAtoms

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Moderation</h2>
                <p className="text-muted-foreground">Review and moderate student atoms</p>
            </div>

            <div className="flex gap-2">
                <Button
                    variant={filter === 'flagged' ? 'default' : 'outline'}
                    onClick={() => setFilter('flagged')}
                >
                    Flagged
                </Button>
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                >
                    All
                </Button>
            </div>

            {filter === 'all' && (
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, content, or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Combobox
                        options={[
                            { label: 'All Statuses', value: 'all' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Approved', value: 'approved' },
                            { label: 'Rejected', value: 'rejected' },
                        ]}
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                        placeholder="Filter by status"
                    />
                </div>
            )}

            {loading ? (
                <div>Loading...</div>
            ) : atoms.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    {filter === 'flagged' ? 'No atoms flagged for review' : 'No atoms found'}
                </div>
            ) : (
                <div className="space-y-4">
                    {atoms.map((atom) => (
                        <div key={atom.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{atom.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        By {(atom.author as any)?.codex_name || 'Unknown'} • {new Date(atom.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${atom.moderation_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500' :
                                    atom.moderation_status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500'
                                    }`}>
                                    {atom.moderation_status}
                                </span>
                            </div>

                            <div className="bg-muted/50 rounded p-3 text-sm">
                                {atom.body}
                            </div>

                            {atom.moderation_result && (
                                <div className="text-sm bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100 p-2 rounded">
                                    <strong>AI Analysis:</strong> {atom.moderation_result}
                                </div>
                            )}

                            {(filter === 'flagged' || filter === 'all' || (atom.moderation_result && atom.moderation_status === 'pending')) && (
                                <div className="flex gap-2">
                                    {atom.moderation_status !== 'approved' && (
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleModerate(atom.id, 'approve')}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve
                                        </Button>
                                    )}
                                    {atom.moderation_status !== 'rejected' && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleModerate(atom.id, 'reject')}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject & Hide
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
