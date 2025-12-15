'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Network, MessageSquare, PlusCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        notes: 0,
        connections: 0,
        comments: 0
    })
    const [recentNotes, setRecentNotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!user) return

        const fetchData = async () => {
            // Fetch counts
            const [notesRes, connectionsRes, commentsRes] = await Promise.all([
                supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('connections').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            ])

            setStats({
                notes: notesRes.count || 0,
                connections: connectionsRes.count || 0,
                comments: commentsRes.count || 0
            })

            // Fetch recent notes
            const { data: notes } = await supabase
                .from('notes')
                .select('id, title, type, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (notes) setRecentNotes(notes)
            setLoading(false)
        }

        fetchData()
    }, [user, supabase])

    if (loading) return <div className="p-8">Loading dashboard...</div>

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your Codex at a glance.
                    </p>
                </div>
                <Link href="/my-notes">
                    <Button size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        New Note
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.notes}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Connections</CardTitle>
                        <Network className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.connections}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comments Made</CardTitle>
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.comments}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/my-notes">
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                My Notes
                            </CardTitle>
                            <CardDescription>View and manage all your notes</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/graph">
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Network className="h-5 w-5 text-green-500" />
                                Knowledge Graph
                            </CardTitle>
                            <CardDescription>Explore your connected ideas</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/feed">
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-purple-500" />
                                Class Feed
                            </CardTitle>
                            <CardDescription>See what your classmates are working on</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* Recent Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentNotes.length > 0 ? (
                        <div className="space-y-3">
                            {recentNotes.map(note => (
                                <Link key={note.id} href={`/notes/${note.id}`}>
                                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{note.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="capitalize text-xs">{note.type}</Badge>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">
                            You haven't created any notes yet. <Link href="/my-notes" className="text-primary underline">Start here!</Link>
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
