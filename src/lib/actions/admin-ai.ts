'use server'

import { createClient } from '@/lib/supabase/server'
import { updateNoteEmbedding } from '@/lib/ai/embeddings'

export async function generateAllEmbeddings() {
    const supabase = await createClient()

    // Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: adminCheck } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!adminCheck?.is_admin) throw new Error("Admin access required")

    // Fetch all notes with NO embedding (or just all notes?)
    // Let's fetch ALL notes to be safe, or check for null if we could.
    // Supabase JS doesn't easily support "is null" on vector column in filter sometimes? 
    // Let's just fetch ID and Content of all notes.
    const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, content')

    if (error || !notes) {
        console.error("Error fetching notes:", error)
        return { success: false, error: error?.message }
    }

    console.log(`Found ${notes.length} notes. Starting embedding generation...`)

    let successCount = 0
    let failCount = 0

    // Process in parallel with limit? Or sequential to avoid rate limits?
    // Gemini has rate limits. Let's do batches or sequential with delay.
    for (const note of notes) {
        try {
            // Check if title or content exists
            if (!note.title && !note.content) continue

            // We invoke the helper which handles fetching and updating
            await updateNoteEmbedding(note.id)
            successCount++
            // Tiny delay to be nice to API
            await new Promise(r => setTimeout(r, 200))
        } catch (e) {
            console.error(`Failed to embed note ${note.id}`, e)
            failCount++
        }
    }

    return { success: true, count: successCount, failed: failCount }
}
