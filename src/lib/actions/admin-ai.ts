'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { updateNoteEmbedding } from '@/lib/ai/embeddings'

export async function generateAllEmbeddings() {
    const supabase = await createClient()

    // Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: adminCheck } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
    if (!(adminCheck as any)?.is_admin) throw new Error("Admin access required")

    // Use admin client to bypass RLS so we can fetch and update ALL notes
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch up to 50 notes that currently have NO embedding.
    // This batching approach prevents Vercel Serverless Function 10s timeouts.
    const { data: notes, error } = await supabaseAdmin
        .from('notes')
        .select('id, title, content')
        .is('embedding', null)
        .limit(50)

    if (error || !notes) {
        console.error("Error fetching notes:", error)
        return { success: false, error: error?.message }
    }

    console.log(`Found ${notes.length} notes. Starting embedding generation...`)

    let successCount = 0
    let failCount = 0

    // Process in parallel with limit? Or sequential to avoid rate limits?
    // Gemini has rate limits. Let's do batches or sequential with delay.
    for (const note of (notes as any[])) {
        try {
            // Check if title or content exists
            if (!note.title && !note.content) continue

            // We invoke the helper as admin which bypasses RLS
            await updateNoteEmbedding(note.id, true)
            successCount++
            // Tiny delay to be nice to API
            await new Promise(r => setTimeout(r, 200))
        } catch (e) {
            console.error(`Failed to embed note ${note.id}`, e)
            failCount++
        }
    }

    const hasMore = notes.length === 50
    return { success: true, count: successCount, failed: failCount, hasMore }
}
