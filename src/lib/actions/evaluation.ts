import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
// Fallback models in priority order
const MODELS = [
    "gemini-2.5-flash-lite", // 10 RPM
    "gemini-2.5-flash"       // 5 RPM
]

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
    1. Check for connections: The user uses "[[Link Name]]" syntax for internal links. If you see this syntax, the note IS connected. If NO such links exist, users usually appreciate a nudge to "Consider linking to other notes."
    2. Check for Focus: If the note seems to wander between unrelated topics, gently suggest splitting it.
    
    Do NOT return generic placeholder observations like "No explicit connections" if valid [[WikiLinks]] are present.
    
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
        "observations": string[] // List of factual observations. Keep it empty if the note looks good.
    }
    `

    // 3. Try models in sequence
    for (const modelName of MODELS) {
        try {
            console.log(`[Diagnostic] Trying model: ${modelName}`)
            const model = genAI.getGenerativeModel({ model: modelName })
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

        } catch (e: any) {
            console.warn(`[Diagnostic] Model ${modelName} failed:`, e.message?.substring(0, 100))
            // Continue to next model
        }
    }

    // 4. All models failed, fallback to local
    console.warn("[Diagnostic] All AI models failed, using local check.")
    const localCheck = basicLocalCheck(note.title, note.content)
    return localCheck
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
