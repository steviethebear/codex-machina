'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type Notification = {
    id: string
    type: 'mention' | 'achievement' | 'citation' | 'system'
    title: string
    message: string
    link: string | null
    read: boolean
    created_at: string
}

export function NotificationBell() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!user) return

        // 1. Fetch initial notifications
        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20) // Limit to last 20 for now

            if (data) {
                setNotifications(data as Notification[])
                setUnreadCount(data.filter((n: any) => !n.read).length)
            }
        }
        fetchNotifications()

        // 2. Subscribe to Realtime
        const channel = supabase
            .channel('notifications-bell')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotif = payload.new as Notification
                    setNotifications(prev => [newNotif, ...prev])
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, supabase])

    const handleRead = async (notification: Notification) => {
        if (!notification.read) {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))

            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notification.id)
        }

        if (notification.link) {
            setOpen(false)
            router.push(notification.link)
        }
    }

    const markAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
        if (unreadIds.length === 0) return

        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)

        await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds)
    }

    if (!user) return null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={markAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-4 text-left transition-colors hover:bg-muted/50 border-b last:border-0",
                                        !notification.read && "bg-muted/10 border-l-2 border-l-primary"
                                    )}
                                    onClick={() => handleRead(notification)}
                                >
                                    <div className="flex w-full justify-between gap-2">
                                        <span className={cn("font-medium text-sm leading-none", !notification.read && "text-primary")}>
                                            {notification.title}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                                        {notification.message}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
