'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSource(data: { title: string, content: string, url?: string, author?: string }) {
    const supabase = await createClient()

    // Get current user (must be admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")
    // Check admin role
    const { data: dbUser } = await (supabase as any).from('users').select('is_admin').eq('id', user.id).single()
    if (!(dbUser as any)?.is_admin) throw new Error("Unauthorized: Admin access required")

    // Create Note
    const { data: newNote, error } = await (supabase as any).from('notes').insert({
        title: data.title,
        content: `**Author**: ${data.author || 'Unknown'}\n**URL**: ${data.url || 'N/A'}\n\n${data.content}`,
        type: 'source',
        user_id: user.id,
        is_public: true
    })
        .select()
        .single()

    if (error) throw error

    revalidatePath('/admin')
    return newNote
}
