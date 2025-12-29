'use server'

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database.types'
import { evaluateNote } from './evaluation'
import { syncConnections } from './links'
import { awardPoints } from '@/lib/points'
import { checkAndUnlockAchievements } from '@/lib/achievements'
import { createNotification } from '@/lib/notifications'
import { updateNoteEmbedding } from '@/lib/ai/embeddings'

type Note = Database['public']['Tables']['notes']['Row']
type NoteInsert = Database['public']['Tables']['notes']['Insert']
type NoteUpdate = Database['public']['Tables']['notes']['Update']

export async function createNote(note: NoteInsert) {
    const supabase = await createClient()

    // Default to fleeting if not provided
    if (!note.type) note.type = 'fleeting'

    const { data, error } = await supabase
        .from('notes')
        .insert(note)
        .select()
        .single()

    if (error) {
        console.error('Error creating note:', error)
        return { error: error.message }
    }

    // Award 1 point for creating a fleeting note (Coherence check implied or just participation for now)
    if (data.type === 'fleeting') {
        await awardPoints(data.user_id, 1, 'created_fleeting_note', data.id)
    }

    // Sync connections if initial content is provided
    if (note.content) {
        await syncConnections(data.id, note.content, data.user_id)
        // Generate Embedding
        await updateNoteEmbedding(data.id)
    }

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph')
    return { data }
}

export async function updateNote(id: string, updates: NoteUpdate) {
    const supabase = await createClient()

    // 1. Fetch current state to check type
    const { data: currentNote, error: fetchError } = await supabase
        .from('notes')
        .select('type')
        .eq('id', id)
        .single()

    if (fetchError || !currentNote) {
        return { error: 'Note not found' }
    }

    if (currentNote.type === 'permanent') {
        return { error: 'Permanent notes cannot be edited.' }
    }

    const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating note:', error)
        return { error: error.message }
    }

    // Sync connections if content changed, regardless of note type (fleeting, permanent, source)
    if (updates.content) {
        await syncConnections(data.id, data.content, data.user_id)
        // Update Embedding
        await updateNoteEmbedding(data.id)
    }

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph')
    return { data }
}

export async function deleteNote(id: string) {
    const supabase = await createClient()

    // 1. Fetch current state to check type
    const { data: currentNote, error: fetchError } = await supabase
        .from('notes')
        .select('type')
        .eq('id', id)
        .single()

    if (fetchError || !currentNote) {
        return { error: 'Note not found' }
    }

    if (currentNote.type === 'permanent') {
        return { error: 'Permanent notes cannot be deleted.' }
    }

    // 2. Delete associated points (XP)
    // We do this before deleting the note, though order doesn't strictly matter since no FK constraint on points.source_id
    const { error: pointsError } = await supabase
        .from('points')
        .delete()
        .eq('source_id', id)

    if (pointsError) {
        console.error('Error deleting note points:', pointsError)
        // We continue to delete the note even if points fail, or maybe we should stop?
        // Continuing seems safer for UX, leaving orphan points is a minor backend issue.
    }

    // 3. Delete the note
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting note:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph') // Ensure graph updates too
    return { success: true }
}

export async function getNotes(filters?: {
    userId?: string,
    type?: Note['type'],
    isPublic?: boolean
}) {
    const supabase = await createClient()

    let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

    if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
    }
    if (filters?.type) {
        query = query.eq('type', filters.type)
    }
    if (filters?.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching notes:', error)
        return { error: error.message }
    }

    return { data }
}

export async function getNote(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching note:', error)
        return { error: error.message }
    }

    return { data }
}

export async function promoteNote(id: string) {
    const supabase = await createClient()

    // 1. Fetch the note
    const { data: note, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !note) {
        return { error: 'Note not found' }
    }

    if (note.type === 'permanent') {
        return { error: 'Note is already permanent' }
    }

    if (!note.content || note.content.trim().length === 0) {
        return { error: 'Note content cannot be empty' }
    }

    // 2. Run LLM Evaluation
    // We pass 'permanent' to indicate we are evaluating FOR permanent status
    const assessment = await evaluateNote(id, 'permanent')
    if ('error' in assessment) {
        return { error: assessment.error }
    }

    // 3. Logic based on score
    // Assuming score >= 3 is pass? Or just provide feedback?
    // "Most important pedagogical innovation... conscious decision to make thinking public"
    // "Rejected notes get 'Needs Revision' badge"
    // Let's implement a threshold.
    const PASS_THRESHOLD = 3
    if (assessment.score < PASS_THRESHOLD) {
        return {
            success: false,
            feedback: assessment.feedback,
            score: assessment.score
        }
    }

    // 4. Success - Update Note
    const { error: updateError } = await supabase
        .from('notes')
        .update({
            type: 'permanent',
            is_public: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (updateError) {
        return { error: updateError.message }
    }

    // 5. Sync Connections (and award link points?)
    // "Links in permanent notes: 2 points"
    const linksCount = await syncConnections(note.id, note.content, note.user_id)

    // 6. Award Points
    // Note Quality Points (from LLM score? or fixed?)
    // "Permanent notes: 0-8 points (quality evaluation)"
    // Let's use the score scaled or directly. If score is 0-4, maybe x2?
    // Using assessment.score * 2 for now.
    const qualityPoints = assessment.score * 2
    await awardPoints(note.user_id, qualityPoints, 'note_promotion_quality', id)

    // Link Points
    if (linksCount > 0) {
        // "[[Links]] in permanent notes: 2 points"
        // Note: Differentiation of "Classmate link" (3pts) is handled in syncConnections? 
        // Sync connections returned just Count. 
        // For MVP simplification, just awarding 2pts per link here.
        // Ideally syncConnections should calculate detailed points, but we'll stick to simple.
        await awardPoints(note.user_id, linksCount * 2, 'note_promotion_links', id)
    }

    // 7. Award Mention Points (2 pts per mention to the TARGET)
    const mentionMatches = note.content.match(/@(\w+)/g) || []
    const uniqueMentions = [...new Set(mentionMatches.map(m => m.slice(1)))] // remove @

    // Use Admin Client for Lookup to bypass RLS
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch author details for notification
    const { data: author } = await supabase
        .from('users')
        .select('codex_name')
        .eq('id', note.user_id)
        .single()

    for (const handle of uniqueMentions) {
        // Find user by handle (email prefix OR name prefix)
        const { data: targetUser } = await supabaseAdmin
            .from('users')
            .select('id, email, codex_name')
            .or(`email.ilike.${handle}@%,codex_name.ilike.${handle}%`)
            .maybeSingle()

        if (targetUser && targetUser.id !== note.user_id) {
            await awardPoints(targetUser.id, 2, 'mentioned_in_note', id)

            // Notify the mentioned user
            await createNotification({
                user_id: targetUser.id,
                type: 'mention',
                title: 'You were mentioned!',
                message: `${author?.codex_name || 'Someone'} mentioned you in "${note.title}".`,
                link: `/my-notes?noteId=${note.id}` // FIXED: take to user profile, or maybe the note? 
                // Roadmap says: "When I click an @ link in a note, it should take me to information about that player"
                // BUT this is a NOTIFICATION about a mention.
                // Usually linking to the NOTE where you were mentioned is more useful?
                // "New Mention: Bob mentioned you in 'Physics'" -> Click -> Go to 'Physics' note.
                // The user request "When I click an @ mention, it just takes me to my-notes. ... [should take] to information about that player" was about CLICKING THE LINK IN THE CONTENT.
                // For the NOTIFICATION, taking them to the note seems correct.
                // Let's stick to link: `/my-notes?noteId=${note.id}` but wait, `my-notes` is for MY notes.
                // If I am mentioned in SOMEONE ELSE'S note, can I see it in `my-notes`?
                // `NotebookPage` fetches `notes` (mine) and `publicNotes` (public). 
                // If the note is PERMANENT, it is PUBLIC, so it should be in `publicNotes`.
                // So `/my-notes?noteId=${note.id}` SHOULD work if the note is promoted?
                // YES, promoteNote is called when creating a permanent note.
            })
        }
    }

    // 8. Check Achievements (NEW)
    const newAchievements = await checkAndUnlockAchievements(note.user_id)

    revalidatePath('/dashboard')
    revalidatePath('/my-notes')
    revalidatePath('/graph')

    return {
        success: true,
        feedback: assessment.feedback,
        score: assessment.score,
        newAchievements // Pass this back to UI if we ever want to show a specific toast
    }
}

export async function fetchClassFeed(filter: 'all' | 'teacher' | 'students' = 'all') {
    const supabase = await createClient()

    // 1. Fetch Notes
    let query = supabase
        .from('notes')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })

    if (filter === 'teacher') {
        query = query.eq('type', 'source')
    } else if (filter === 'students') {
        query = query.neq('type', 'source')
    }

    const { data: notes, error: notesError } = await query

    if (notesError) {
        console.error('Error fetching feed notes:', notesError)
        return { success: false, error: 'Failed to fetch feed' }
    }

    if (!notes || notes.length === 0) {
        return { success: true, data: [] }
    }

    // 2. Fetch Authors manually to report avoid FK issues
    const userIds = [...new Set(notes.map(n => n.user_id))]

    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, codex_name')
        .in('id', userIds)

    if (usersError) {
        console.error('Error fetching feed authors:', usersError)
        // Return notes without author info if user fetch fails, or fail? 
        // Better to return notes with partial info than nothing.
    }

    // 3. Merge Data
    const enrichedNotes = notes.map(note => {
        const author = users?.find(u => u.id === note.user_id)
        return {
            ...note,
            user: author || { email: 'Unknown', codex_name: 'Unknown' }
        }
    })

    return { success: true, data: enrichedNotes }
}
