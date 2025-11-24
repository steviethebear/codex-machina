'use client'

import { useEffect, useState } from 'react'
import { getLinkDensity, getActivityHeatmap } from '@/lib/actions/get-analytics'
import { TrendChart } from '@/components/admin/trend-chart'
import { UnitStats } from '@/components/admin/unit-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, Network, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
    const [linkDensity, setLinkDensity] = useState<any>(null)
    const [activityData, setActivityData] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const [density, activity] = await Promise.all([
                getLinkDensity(),
                getActivityHeatmap(undefined, 30)
            ])
            setLinkDensity(density)
            setActivityData(activity)
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) return <div className="container mx-auto p-6">Loading analytics...</div>

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                <p className="text-muted-foreground">Insights into student activity and engagement</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Atoms</CardTitle>
                        <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{linkDensity?.atomCount || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Links</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{linkDensity?.linkCount || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hub Atoms</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{linkDensity?.hubCount || 0}</div>
                        <p className="text-xs text-muted-foreground">5+ connections</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Connections</CardTitle>
                        <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{linkDensity?.avgConnectionsPerAtom || 0}</div>
                        <p className="text-xs text-muted-foreground">per atom</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="units" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="units">Nodes per Unit</TabsTrigger>
                    <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="units" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Atoms Created by Unit</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <UnitStats />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity (Last 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-2">
                                {Object.entries(activityData).slice(-30).map(([date, count]) => (
                                    <div key={date} className="flex flex-col items-center">
                                        <div
                                            className="w-full h-8 rounded"
                                            style={{
                                                backgroundColor: `rgba(59, 130, 246, ${Math.min(count / 5, 1)})`
                                            }}
                                            title={`${date}: ${count} atoms`}
                                        />
                                        <span className="text-xs text-muted-foreground mt-1">{new Date(date).getDate()}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
