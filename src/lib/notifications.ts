import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

/**
 * Creates a notification for a user.
 * Uses Service Role key to bypass RLS for insertion.
 */
export async function createNotification(notification: NotificationInsert) {
    const supabaseAdmin = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
        .from('notifications')
        .insert(notification)

    if (error) {
        console.error('Error creating notification:', error)
    }
}
