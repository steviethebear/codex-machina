'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Network, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({
        users: 0,
        notes: 0,
        links: 0,
        actions: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
            const { count: notesCount } = await supabase.from('atomic_notes').select('*', { count: 'exact', head: true })
            const { count: linksCount } = await supabase.from('links').select('*', { count: 'exact', head: true })
            const { count: actionsCount } = await supabase.from('actions').select('*', { count: 'exact', head: true })

            setStats({
                users: usersCount || 0,
                notes: notesCount || 0,
                links: linksCount || 0,
                actions: actionsCount || 0
            })
            setLoading(false)
        }

        fetchStats()
    }, [supabase])

    if (loading) return <div className="p-8">Loading system metrics...</div>

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
                <p className="text-muted-foreground">Monitoring simulation parameters.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.users}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Atoms</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.notes}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Connections</CardTitle>
                        <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.links}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.actions}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
