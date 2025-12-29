import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: "text-embedding-004" })

export async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!text || !text.trim()) return null

    try {
        const result = await model.embedContent(text)
        const embedding = result.embedding
        return embedding.values
    } catch (error) {
        console.error("Gemini API Error:", error)
        return null
    }
}

export async function updateNoteEmbedding(noteId: string) {
    const supabase = await createClient()

    // 1. Fetch Note Content
    const { data: note, error: fetchError } = await supabase
        .from('notes')
        .select('title, content')
        .eq('id', noteId)
        .single()

    if (fetchError || !note) {
        console.error("Error fetching note for embedding:", fetchError)
        return
    }

    // 2. Generate Embedding (Title + Content)
    const textToEmbed = `${note.title}\n\n${note.content}`
    const embedding = await generateEmbedding(textToEmbed)

    if (!embedding) {
        console.warn(`Failed to generate embedding for note ${noteId}`)
        return
    }

    // 3. Update Note with Vector
    const { error: updateError } = await supabase
        .from('notes')
        .update({ embedding: embedding as any }) // Type casting as Supabase types might not have vector yet
        .eq('id', noteId)

    if (updateError) {
        console.error("Error updating note embedding:", updateError)
    } else {
        console.log(`Successfully updated embedding for note ${noteId}`)
    }
}
