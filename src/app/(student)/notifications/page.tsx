'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Check, Clock, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth-provider'

export default function NotificationsPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error(error)
        } else {
            setNotifications(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchNotifications()
    }, [user])

    const handleMarkAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)

        if (error) {
            toast.error('Failed to update')
        } else {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        }
    }

    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
        if (unreadIds.length === 0) return

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds)

        if (error) {
            toast.error('Failed to update all')
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            toast.success('All marked as read')
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length

    if (!user) return null

    return (
        <div className="container mx-auto p-6 max-w-2xl min-h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
                    <p className="text-muted-foreground mt-1">Updates and activity related to your work.</p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark all read
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No notifications yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={cn(
                                "flex gap-4 p-4 rounded-lg border transition-all",
                                notification.read ? "bg-background opacity-70 hover:opacity-100" : "bg-card shadow-sm border-l-4 border-l-primary"
                            )}
                        >
                            <div className={cn(
                                "mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                notification.type === 'mention' ? "bg-blue-100 text-blue-600" :
                                    notification.type === 'achievement' ? "bg-amber-100 text-amber-600" :
                                        "bg-muted text-muted-foreground"
                            )}>
                                <Bell className="h-4 w-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className={cn("font-medium text-sm", !notification.read && "font-semibold")}>
                                        {notification.title}
                                    </h3>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                    {notification.message}
                                </p>

                                <div className="flex items-center gap-3">
                                    {notification.link && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            asChild
                                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                        >
                                            <Link href={notification.link}>
                                                View <ExternalLink className="h-3 w-3 ml-1" />
                                            </Link>
                                        </Button>
                                    )}
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            Mark read
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
