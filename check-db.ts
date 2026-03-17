import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function run() {
    console.log("Connecting to", process.env.NEXT_PUBLIC_SUPABASE_URL)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { count: totalNotes, error: err1 } = await supabase.from('notes').select('*', { count: 'exact', head: true })
    if (err1) console.error("Error 1:", err1)
    console.log(`Total notes: ${totalNotes}`)

    const { count: nullEmbeddings, error: err2 } = await supabase.from('notes').select('*', { count: 'exact', head: true }).is('embedding', null)
    if (err2) console.error("Error 2:", err2)
    console.log(`Notes with NULL embedding: ${nullEmbeddings}`)

    const { data: sampleNote, error: err3 } = await supabase.from('notes').select('id, title, embedding').limit(1).maybeSingle()
    if (err3) console.error("Error 3:", err3)
    
    if (sampleNote) {
        console.log(`Sample Note (${sampleNote.title}) embedding length: ${sampleNote.embedding?.length || 'null'}`)
    }
}

run().catch(console.error)
