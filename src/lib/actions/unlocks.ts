'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'

/**
 * The Observer: Checks if a user has met the habits/patterns for new features.
 * This should be called periodically (e.g. after createNote).
 */
export async function checkUnlocks(userId: string) {
    const supabase = await createClient()

    // 1. Get current unlocks to avoid re-checking
    const { data: existingUnlocks } = await supabase
        .from('unlocks')
        .select('feature')
        .eq('user_id', userId)

    const unlockedFeatures = new Set(existingUnlocks?.map(u => u.feature) || [])

    // 2. Fetch User Stats (Heuristics)
    // We need: Note Count, First/Last Note Date, Connection Count
    // This is efficient enough to query directly for a single user.

    // Notes & Dates
    const { data: notes } = await supabase
        .from('notes')
        .select('created_at, id')
        .eq('author_id', userId)
        .eq('hidden', false)
        .order('created_at', { ascending: true })

    if (!notes || notes.length === 0) return

    const totalNotes = notes.length
    const firstNoteDate = new Date(notes[0].created_at)
    const lastNoteDate = new Date(notes[notes.length - 1].created_at)
    const timeSpanDays = (lastNoteDate.getTime() - firstNoteDate.getTime()) / (1000 * 3600 * 24)

    // Connections (approximate via connections table)
    // Count notes that have outgoing links OR incoming links? 
    // Heuristic: "Interconnectedness" check.
    const { count: linkCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId) // Outgoing links by this user

    // 3. Define Logic for Features
    const newUnlocks: string[] = []

    // --- Thinking Profile ---
    // Trigger: Continuity (Time Span > 3 days) AND Minimal Volume (5 Notes)
    if (!unlockedFeatures.has('thinking_profile')) {
        if (totalNotes >= 5 && timeSpanDays >= 3) {
            newUnlocks.push('thinking_profile')
        }
    }

    // --- Graph View ---
    // Trigger: Structural Mass (10 Notes) AND Connectivity (Links >= 5)
    // Refinement: Ideally density, but raw counts are safer evidence of effort.
    if (!unlockedFeatures.has('graph_view')) {
        if (totalNotes >= 10 && (linkCount || 0) >= 5) {
            newUnlocks.push('graph_view')
        }
    }

    // --- Deep Breadcrumbs ---
    // Trigger: Volume (15 Notes) - Need navigation aid
    if (!unlockedFeatures.has('deep_breadcrumbs')) {
        if (totalNotes >= 15) {
            newUnlocks.push('deep_breadcrumbs')
        }
    }

    // 4. Apply Unlocks
    if (newUnlocks.length > 0) {
        const metadata = {
            trigger: 'system_observer',
            stats: { totalNotes, timeSpanDays, linkCount }
        }

        for (const feature of newUnlocks) {
            await supabase.from('unlocks').insert({
                user_id: userId,
                feature,
                check_metadata: metadata
            })

            // Notify
            await createNotification({
                user_id: userId,
                type: 'system',
                title: 'New Capability Available',
                message: `Your sustained thinking has revealed a new way to work: ${getFeatureName(feature)}.`
            })
        }

        revalidatePath('/')
        revalidatePath('/dashboard')
    }
}

function getFeatureName(key: string): string {
    switch (key) {
        case 'thinking_profile': return 'Thinking Profile'
        case 'graph_view': return 'Graph View'
        case 'deep_breadcrumbs': return 'Extended Breadcrumbs'
        default: return 'New Feature'
    }
}

/**
 * Admin: Manually Toggle Unlock
 */
export async function toggleUnlock(userId: string, feature: string, shouldUnlock: boolean) {
    const supabase = await createClient()

    // Verify admin? (Supabase RLS handles this mostly, but good to check)
    // Actually policy checks for role=admin on insert/delete.

    if (shouldUnlock) {
        await supabase.from('unlocks').upsert({
            user_id: userId,
            feature,
            check_metadata: { trigger: 'admin_override' }
        })
    } else {
        await supabase.from('unlocks').delete()
            .eq('user_id', userId)
            .eq('feature', feature)
    }

    revalidatePath(`/admin/student/${userId}`)
    revalidatePath('/dashboard')
    revalidatePath('/graph')
}
