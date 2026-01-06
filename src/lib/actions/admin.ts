'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'


// Admin Client Helper
const getAdminClient = () => {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function getStudentProfile(studentId: string) {
    const supabase = await createClient()

    // 1. Fetch User Profile
    const { data: profile } = await supabase.from('users').select('*').eq('id', studentId).single()
    if (!profile) return null

    // 2. Fetch Notes
    const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })

    // 3. Fetch XP History (Points)
    const { data: points } = await supabase
        .from('points')
        .select('*')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .returns<Database['public']['Tables']['points']['Row'][]>()

    // 4. Fetch Unlocks
    const { data: unlocks } = await supabase
        .from('unlocks')
        .select('*')
        .eq('user_id', studentId)

    // 5. Fetch Reflections
    const { data: reflections } = await supabase
        .from('reflections')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

    return {
        profile: { ...profile, unlocks: unlocks || [] },
        notes: notes || [],
        points: points || [],
        reflections: reflections || []
    }
}

export async function awardXP(studentId: string, amount: number, reason: string) {
    const supabase = await createClient()

    // Check if requester is admin? RLS handles this mostly, but good to be safe.
    // For now we assume the page is protected.

    const { error } = await (supabase as any).from('points').insert({
        user_id: studentId,
        amount: amount,
        reason: reason
    })

    if (error) throw error

    // Create Notification
    const admin = getAdminClient()
    await admin.from('notifications').insert({
        user_id: studentId,
        type: 'achievement', // Reusing achievement type
        title: 'Bonus XP Awarded',
        message: `You received ${amount} XP: ${reason}`,
        link: '/dashboard'
    })
}

export async function forcePromoteNote(noteId: string) {
    const supabase = await createClient()
    await (supabase as any).from('notes').update({ type: 'permanent' }).eq('id', noteId)
}

export async function forceDeleteNote(noteId: string) {
    const supabase = await createClient()
    await (supabase as any).from('notes').delete().eq('id', noteId)
}

export async function deleteStudent(studentId: string) {
    const supabase = await createClient()
    const admin = getAdminClient()

    // 1. Call RPC to delete public data
    // We use the admin client to bypass RLS if necessary, though Teacher should have rights.
    // Actually, RPC runs as Owner/Definer so standard client is fine IF implemented that way.
    // Let's use standard client for RPC.
    const { error } = await (supabase.rpc as any)('delete_user_data', { target_user_id: studentId })

    if (error) {
        console.error("RPC Delete Error", error)
        throw error
    }

    // 2. Delete Auth User (Must use Service Role)
    const { error: authError } = await admin.auth.admin.deleteUser(studentId)

    if (authError) {
        console.error("Auth Delete Error", authError)
        // Note: Public data is already gone. Partial failure state possible but acceptable for MVP.
        throw authError
    }
}

export async function sendPasswordReset(email: string) {
    const admin = getAdminClient()
    const { error } = await admin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/dashboard/settings`,
    })
    if (error) throw error
}

export async function updateStudentPassword(userId: string, newPassword: string) {
    const admin = getAdminClient()
    const { error } = await admin.auth.admin.updateUserById(userId, {
        password: newPassword
    })
    if (error) throw error
}

export async function inviteStudent(email: string) {
    const admin = getAdminClient()
    const { error } = await admin.auth.admin.inviteUserByEmail(email)
    if (error) throw error
}

export async function updateStudentProfile(userId: string, data: { codex_name?: string, class_section?: string, teacher?: string }) {
    const supabase = await createClient()
    const { error } = await supabase.from('users').update(data).eq('id', userId)

    if (error) throw error

    // Attempt to update metadata if codex_name changed (optional but good for sync)
    // We can't easily update auth metadata from here without admin client, but public 'users' table is the source of truth for display now.
}
