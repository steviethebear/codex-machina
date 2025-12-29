'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'

export async function searchSimilarNotes(query: string, threshold = 0.5, limit = 5) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // 1. Generate Query Vector
    const embedding = await generateEmbedding(query)

    if (!embedding) {
        throw new Error("Failed to generate embedding for query")
    }

    // 2. Call RPC
    const { data: similarNotes, error } = await supabase.rpc('match_notes', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
        msg_user_id: user.id
    })

    if (error) {
        console.error("Error searching similar notes:", error)
        return []
    }

    return similarNotes || []
}
