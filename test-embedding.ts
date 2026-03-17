import { updateNoteEmbedding } from './src/lib/ai/embeddings'
import { createClient } from '@supabase/supabase-js'

// Need to emulate the environment variables for local edge run
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function run() {
    console.log("Fetching a note ID...")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await supabase.from('notes').select('id').limit(1).single()
    if (!data) {
        console.log("No notes found.")
        return
    }
    const noteId = data.id
    console.log(`Testing with Note ID: ${noteId}`)
    
    // Test the admin update
    await updateNoteEmbedding(noteId, true)
    
    // Verify
    const { data: check } = await supabase.from('notes').select('id, embedding').eq('id', noteId).single()
    console.log("Vector saved?", !!check?.embedding)
}

run().catch(console.error)
