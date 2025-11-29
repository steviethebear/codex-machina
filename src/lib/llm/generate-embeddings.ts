'use server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

/**
 * Generate embedding vector for text using Google Gemini embedding-001 model
 * @param text - Text to generate embedding for
 * @returns 768-dimensional embedding vector or null if failed
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.warn('[Embeddings] No GEMINI_API_KEY found, skipping embedding generation')
        return null
    }

    if (!text || text.trim().length === 0) {
        console.warn('[Embeddings] Empty text provided, skipping')
        return null
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
        const result = await model.embedContent(text)
        const embedding = result.embedding.values

        if (!embedding || embedding.length === 0) {
            console.error('[Embeddings] Model returned empty embedding')
            return null
        }

        console.log(`[Embeddings] Generated embedding (${embedding.length} dimensions)`)
        return embedding
    } catch (error: any) {
        console.error('[Embeddings] Generation failed:', error.message)
        return null
    }
}

/**
 * Update embedding for a specific note
 * Called after note approval to enable semantic search
 * @param noteId - UUID of the note to update
 */
export async function updateNoteEmbedding(noteId: string): Promise<boolean> {
    const supabase = await createClient()

    try {
        // Fetch note content
        const { data: note, error: fetchError } = await supabase
            .from('atomic_notes')
            .select('title, body, embedding')
            .eq('id', noteId)
            .single()

        if (fetchError || !note) {
            console.error(`[Embeddings] Failed to fetch note ${noteId}:`, fetchError?.message)
            return false
        }

        // Skip if embedding already exists
        if (note.embedding) {
            console.log(`[Embeddings] Note ${noteId} already has embedding, skipping`)
            return true
        }

        // Generate embedding from title + body
        const combinedText = `${note.title}\n${note.body}`.trim()
        const embedding = await generateEmbedding(combinedText)

        if (!embedding) {
            console.warn(`[Embeddings] Failed to generate embedding for note ${noteId}`)
            return false
        }

        // Store embedding in database
        const { error: updateError } = await supabase
            .from('atomic_notes')
            .update({ embedding: embedding as any }) // Type cast to handle pgvector type
            .eq('id', noteId)

        if (updateError) {
            console.error(`[Embeddings] Failed to update embedding for note ${noteId}:`, updateError.message)
            return false
        }

        console.log(`[Embeddings] Successfully updated embedding for note ${noteId}`)
        return true
    } catch (error: any) {
        console.error(`[Embeddings] Unexpected error updating note ${noteId}:`, error.message)
        return false
    }
}

/**
 * Batch update embeddings for multiple notes
 * Useful for backfilling embeddings for existing approved notes
 * @param noteIds - Array of note UUIDs to update
 * @returns Number of successfully updated notes
 */
export async function batchUpdateEmbeddings(noteIds: string[]): Promise<number> {
    let successCount = 0

    for (const noteId of noteIds) {
        const success = await updateNoteEmbedding(noteId)
        if (success) successCount++

        // Add small delay to avoid rate limiting (100ms between requests)
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`[Embeddings] Batch update complete: ${successCount}/${noteIds.length} successful`)
    return successCount
}

/**
 * Backfill embeddings for all approved notes that don't have one yet
 * This should be run after initial deployment or as a maintenance task
 */
export async function backfillAllEmbeddings(): Promise<{ total: number; updated: number }> {
    const supabase = await createClient()

    // Get all approved notes without embeddings
    const { data: notes, error } = await supabase
        .from('atomic_notes')
        .select('id')
        .eq('moderation_status', 'approved')
        .is('embedding', null)
        .limit(1000) // Process in batches of 1000

    if (error || !notes) {
        console.error('[Embeddings] Failed to fetch notes for backfill:', error?.message)
        return { total: 0, updated: 0 }
    }

    console.log(`[Embeddings] Starting backfill for ${notes.length} notes...`)
    const noteIds = notes.map(n => n.id)
    const updated = await batchUpdateEmbeddings(noteIds)

    return { total: notes.length, updated }
}
