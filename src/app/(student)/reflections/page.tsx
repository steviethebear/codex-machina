'use client'

import { useEffect, useState } from 'react'
import { getStudentReflections } from '@/lib/actions/reflections'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function ReflectionsPage() {
    const [reflections, setReflections] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const res = await getStudentReflections()
            if (res.data) setReflections(res.data)
            setLoading(false)
        }
        load()
    }, [])

    if (loading) return <div className="p-8">Loading reflections...</div>

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Reflections</h1>
            <p className="text-muted-foreground mb-8">
                Conversational mirrors to help you articulate your thinking.
            </p>

            <div className="grid gap-4">
                {reflections.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No reflections yet</h3>
                        <p className="text-muted-foreground mt-2">
                            When a teacher initiates a reflection, it will appear here.
                        </p>
                    </div>
                ) : (
                    reflections.map((r) => (
                        <Link key={r.id} href={`/reflections/${r.id}`}>
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                <CardContent className="p-6 flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`
                                            h-10 w-10 rounded-full flex items-center justify-center shrink-0
                                            ${r.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
                                        `}>
                                            {r.status === 'completed' ? <CheckCircle className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{r.context}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={r.status === 'completed' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                                                    {r.status.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
