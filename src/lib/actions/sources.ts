'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'

type TextRow = Database['public']['Tables']['texts']['Row']

/**
 * Creates a new source. 
 * If the user is an admin, it's auto-approved.
 * If the user is a student, it's created with status='pending'.
 */
export async function createSource(data: {
    title: string,
    author: string,
    type: string,
    url?: string,
    description?: string // Added
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Check if user is admin
    const { data: dbUser } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    const isAdmin = dbUser?.is_admin || false
    const status = isAdmin ? 'approved' : 'pending'

    const { data: newSource, error } = await supabase
        .from('texts')
        .insert({
            title: data.title,
            author: data.author,
            type: data.type,
            url: data.url || null,
            description: data.description || null, // Added
            status,
            created_by: user.id,
            reviewed_by: isAdmin ? user.id : null,
            reviewed_at: isAdmin ? new Date().toISOString() : null
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating source:", error)
        return { error: error.message }
    }

    revalidatePath('/sources')
    revalidatePath('/admin/sources')
    return { data: newSource as TextRow }
}

/**
 * Searches for sources with similar titles to prevent duplicates.
 */
export async function fuzzyMatchSources(query: string) {
    const supabase = await createClient()

    // Simple ILIKE search for now
    // In production, this could be expanded with pg_trgm or Levenshtein if enabled
    const { data, error } = await supabase
        .from('texts')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(5)

    if (error) {
        console.error("Fuzzy match error:", error)
        return { error: error.message }
    }

    return { data: data as TextRow[] }
}

/**
 * Fetches count of pending sources (for badges)
 */
export async function getPendingSourceCount() {
    const supabase = await createClient()

    // We can assume this is only called by admins or we check inside
    // For badges, we might want it to be fast and non-throwing if not admin (just return 0)

    const { count, error } = await supabase
        .from('texts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    if (error) {
        console.error("Error counting pending sources:", error)
        return 0
    }

    return count || 0
}

/**
 * Fetches all pending sources for admin review.
 */
export async function getPendingSources() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Check admin
    const { data: dbUser } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!dbUser?.is_admin) throw new Error("Unauthorized: Admin access required")

    const { data, error } = await supabase
        .from('texts')
        .select(`
            *,
            creator:users!texts_created_by_fkey(email, codex_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching pending sources:", error)
        return { error: error.message }
    }

    return { data }
}

/**
 * Approves a pending source.
 */
export async function approveSource(sourceId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Check admin
    const { data: dbUser } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!dbUser?.is_admin) throw new Error("Unauthorized: Admin access required")

    const { error } = await supabase
        .from('texts')
        .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', sourceId)

    if (error) {
        console.error("Error approving source:", error)
        return { error: error.message }
    }

    revalidatePath('/sources')
    revalidatePath('/admin/sources/pending')
    return { success: true }
}

/**
 * Rejects a pending source with an optional rejection note.
 */
export async function rejectSource(sourceId: string, note?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Check admin
    const { data: dbUser } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!dbUser?.is_admin) throw new Error("Unauthorized: Admin access required")

    const { error } = await supabase
        .from('texts')
        .update({
            status: 'rejected',
            rejection_note: note || null,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', sourceId)

    if (error) {
        console.error("Error rejecting source:", error)
        return { error: error.message }
    }

    revalidatePath('/admin/sources/pending')
    return { success: true }
}
