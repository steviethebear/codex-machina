import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// Types for Evaluation
export type DiagnosticResult = {
    isValid: boolean
    violations: string[]
    observations: string[]
}

export async function evaluateNote(noteId: string): Promise<DiagnosticResult | { error: string }> {
    const supabase = await createClient()

    // 1. Fetch Note Content
    const { data: note, error } = await supabase
        .from('notes')
        .select('title, content')
        .eq('id', noteId)
        .single() as any

    if (error || !note) {
        return { error: 'Note not found' }
    }

    // 2. Construct Prompt for Structural Analysis
    const prompt = `
    Analyze the following note for STRUCTURAL INTEGRETY and FORM only. 
    Do not judge the quality of ideas.
    
    Criteria for Validity (Pass/Fail):
    1. Length: Must be at least 3 sentences or ~50 words.
    2. Content: Must NOT contain placeholder text like "lorem ipsum" or "insert text here".
    3. Content: Must NOT appear to be junk text (e.g. keyboard mashing).

    Criteria for Observations (Descriptive only, non-judgmental):
    1. If the text does NOT appear to refer to other notes or concepts (e.g. no "similar to", "related to", "[[...]]"), add observation: "No explicit connections detected within this note."
    2. If the text covers multiple distinct topics or claims rather than a single focused idea, add observation: "This note appears to contain multiple distinct claims."
    
    Do NOT check for:
    - Questions
    - Outbound links (validity)
    - Bullet points

    Note Title: "${note.title}"
    Note Content:
    """
    ${note.content}
    """

    Return JSON:
    {
        "isValid": boolean,
        "violations": string[], // List of failure reasons if isValid is false (e.g. "Too short")
        "observations": string[] // List of factual observations
    }
    `

    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Clean markdown code blocks if any
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        const data = JSON.parse(cleanedText) as DiagnosticResult

        return {
            isValid: data.isValid,
            violations: data.violations || [],
            observations: data.observations || []
        }

    } catch (e) {
        console.error("Gemini Evaluation Error:", e)
        // Fallback to basic local check if AI fails
        const localCheck = basicLocalCheck(note.title, note.content)
        return localCheck
    }
}

function basicLocalCheck(title: string, content: string): DiagnosticResult {
    const violations: string[] = []
    if (!content || content.length < 50) violations.push("Note appears too short.")
    if (title.toLowerCase().includes("untitled")) violations.push("Title cannot be 'Untitled'.")

    return {
        isValid: violations.length === 0,
        violations,
        observations: ["AI unavailable, performed basic check."]
    }
}

// Deprecated or Unused for now
export async function evaluateConnection(explanation: string) {
    return { score: 0, feedback: "Not implemented" }
}
