import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

// Load from .env.local directly
const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const genAI = new GoogleGenerativeAI(geminiKey)
const model = genAI.getGenerativeModel({ model: "text-embedding-004" })

async function run() {
    console.log("Fetching a note...")
    const { data: notes, error: fetchErr } = await supabase
        .from('notes')
        .select('id, title, content')
        .limit(1)

    if (fetchErr) {
        console.error("Fetch error:", fetchErr)
        return
    }
    
    if (!notes || notes.length === 0) {
        console.log("No notes to test.")
        return
    }

    const note = notes[0]
    console.log(`Testing Note ID: ${note.id} Title: ${note.title}`)

    // 1. Generate Fake embedding
    try {
        console.log("Generating Gemini embedding...")
        const text = `${note.title || ''}\n\n${note.content || ''}`
        const result = await model.embedContent(text)
        const embedding = result.embedding.values
        console.log(`Generated embedding length: ${embedding.length}`) // should be 768

        // 2. Attempt update
        console.log("Updating database...")
        const { error: updateError } = await (supabase as any)
            .from('notes')
            .update({ embedding: embedding as any })
            .eq('id', note.id)

        if (updateError) {
            console.error("\nDatabase Update Failed!")
            console.error(JSON.stringify(updateError, null, 2))
        } else {
            console.log("Database Update Succeeded.")
            
            // 3. Verify
            const { data } = await supabase.from('notes').select('id').not('embedding', 'is', null).eq('id', note.id)
            console.log("Verified dynamically?", data && data.length > 0)
        }

    } catch (e) {
        console.error("Script error:", e)
    }
}

run()
