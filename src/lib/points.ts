import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function awardPoints(userId: string, amount: number, reason: string, sourceId?: string) {
    // Use Service Role to bypass RLS (needed for awarding points to OTHER users)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
        .from('points')
        .insert({
            user_id: userId,
            amount,
            reason,
            source_id: sourceId
        })

    if (error) {
        console.error('Error awarding points:', error)
        // We don't throw here to avoid failing the main action, just log it.
        return { error: error.message }
    }

    // Revalidate leaderboard or user profile if/when we have it
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')

    return { success: true }
}
