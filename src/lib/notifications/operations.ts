import { createClient } from '@/lib/supabase/client'

export type NotificationType = 'moderation' | 'link' | 'achievement' | 'hub'

export interface CreateNotificationParams {
    type: NotificationType
    title: string
    message: string
    link_url?: string
    metadata?: Record<string, any>
}

/**
 * Create a new notification for a user
 */
export async function createNotification(
    userId: string,
    notification: CreateNotificationParams
): Promise<void> {
    const supabase = createClient()

    await supabase.from('notifications').insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link_url: notification.link_url,
        metadata: notification.metadata || {}
    })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const supabase = createClient()

    const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

    return count || 0
}

/**
 * Get recent notifications for a user
 */
export async function getRecentNotifications(userId: string, limit: number = 10) {
    const supabase = createClient()

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    return data || []
}

/**
 * Get all notifications for a user (paginated)
 */
export async function getAllNotifications(
    userId: string,
    page: number = 0,
    pageSize: number = 20
) {
    const supabase = createClient()

    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)

    return {
        notifications: data || [],
        total: count || 0,
        hasMore: (count || 0) > to + 1
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    const supabase = createClient()

    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    const supabase = createClient()

    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    const supabase = createClient()

    await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
}
