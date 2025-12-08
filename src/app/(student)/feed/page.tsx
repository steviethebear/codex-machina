'use client'

import { useEffect, useState } from 'react'
import { getFeed } from '@/lib/actions/collaboration'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link as LinkIcon, FileText, User } from 'lucide-react'
import Link from 'next/link'

export default function FeedPage() {
    const [feedItems, setFeedItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadFeed = async () => {
            const { data } = await getFeed()
            if (data) setFeedItems(data)
            setLoading(false)
        }
        loadFeed()
    }, [])

    if (loading) return <div className="p-8">Loading feed...</div>

    return (
        <div className="max-w-3xl mx-auto p-8 space-y-6">
            <h1 className="text-3xl font-bold mb-6">Class Feed</h1>

            <div className="space-y-4">
                {feedItems.map((item) => (
                    <Card key={`${item.feedType}-${item.id}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{item.user?.codex_name || 'Anonymous User'}</span>
                                    <span>•</span>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                                <Badge variant={item.feedType === 'note' ? 'outline' : 'secondary'}>
                                    {item.feedType === 'note' ? 'New Note' : 'Connection'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {/* NOTE ITEM */}
                            {item.feedType === 'note' && (
                                <div>
                                    <Link href={`/notes/${item.id}`} className="block group">
                                        <h3 className="text-xl font-semibold group-hover:underline mb-2 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                            {item.title}
                                        </h3>
                                    </Link>
                                    <p className="text-muted-foreground line-clamp-2">{item.content}</p>
                                    <div className="mt-2 flex gap-2">
                                        <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                                    </div>
                                </div>
                            )}

                            {/* CONNECTION ITEM */}
                            {item.feedType === 'connection' && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-foreground">{item.source_note?.title}</span>
                                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-foreground">{item.target_note?.title}</span>
                                    </div>
                                    <p className="text-sm italic text-muted-foreground border-l-2 pl-3 py-1">
                                        "{item.explanation}"
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {feedItems.length === 0 && (
                    <p className="text-center text-muted-foreground py-10">No activity yet. Be the first to publish a note!</p>
                )}
            </div>
        </div>
    )
}
