'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Sparkles } from 'lucide-react'
import { getThreads, type Thread } from '@/lib/actions/threads'

export default function ThreadsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [threads, setThreads] = useState<Thread[]>([])
    const [loading, setLoading] = useState(true)
    const [unlocked, setUnlocked] = useState(false)

    useEffect(() => {
        const checkUnlock = async () => {
            if (!user) return

            const { data } = await supabase
                .from('unlocks')
                .select('feature')
                .eq('user_id', user.id)
                .eq('feature', 'threads')
                .maybeSingle()

            setUnlocked(!!data)

            if (data) {
                await loadThreads()
            }
            setLoading(false)
        }

        checkUnlock()
    }, [user])

    const loadThreads = async () => {
        const result = await getThreads()
        if (result.data) {
            setThreads(result.data as Thread[])
        }
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
    }

    // Locked State UI
    if (!unlocked) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-background text-center max-w-2xl mx-auto">
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-6">
                    <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Weaving Space</h1>
                <p className="text-muted-foreground max-w-md">
                    A space for arranging ideas will appear here as your Codex develops structure.
                </p>
            </div>
        )
    }

    // Unlocked State UI
    return (
        <div className="flex flex-col gap-6 p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Threads</h1>
                    <p className="text-muted-foreground mt-1">
                        Weave permanent notes into lines of thought
                    </p>
                </div>
                <Button onClick={() => router.push('/threads/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Thread
                </Button>
            </div>

            {/* Threads List */}
            {threads.length === 0 ? (
                <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <CardTitle className="mb-2">No threads yet</CardTitle>
                        <CardDescription>
                            Create a thread to begin weaving your notes into structure
                        </CardDescription>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {threads.map((thread) => (
                        <Card
                            key={thread.id}
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => router.push(`/threads/${thread.id}`)}
                        >
                            <CardHeader>
                                <CardTitle>{thread.title}</CardTitle>
                                {thread.description && (
                                    <CardDescription>{thread.description}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    Updated {new Date(thread.updated_at).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
