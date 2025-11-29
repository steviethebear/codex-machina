import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const geminiKey = process.env.GEMINI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const genAI = new GoogleGenerativeAI(geminiKey)

async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
        const result = await model.embedContent(text)
        return result.embedding.values
    } catch (error: any) {
        console.error('Embedding failed:', error.message)
        return null
    }
}

async function main() {
    console.log('Fetching approved notes without embeddings...')
    
    const { data: notes, error } = await supabase
        .from('atomic_notes')
        .select('id, title, body')
        .eq('moderation_status', 'approved')
        .is('embedding', null)
    
    if (error || !notes) {
        console.error('Failed to fetch notes:', error?.message)
        return
    }
    
    console.log(`Found ${notes.length} notes to process`)
    
    let success = 0
    for (const note of notes) {
        const text = `${note.title}\n${note.body}`.trim()
        const embedding = await generateEmbedding(text)
        
        if (embedding) {
            const { error: updateError } = await supabase
                .from('atomic_notes')
                .update({ embedding: embedding as any })
                .eq('id', note.id)
            
            if (!updateError) {
                success++
                console.log(`✓ ${note.title.slice(0, 40)}...`)
            } else {
                console.log(`✗ ${note.title.slice(0, 40)}... (${updateError.message})`)
            }
        }
        
        // Rate limit delay
        await new Promise(r => setTimeout(r, 100))
    }
    
    console.log(`\nDone! Updated ${success}/${notes.length} notes.`)
}

main().catch(console.error)
