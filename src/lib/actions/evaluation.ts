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

export async function generateRubricEvaluation(notes: { title: string, content: string, created_at: string }[]): Promise<{ score: number, narrative: string }> {
    if (notes.length === 0) {
        return { score: 1, narrative: "No notes found in this period to evaluate." }
    }

    // Prepare content for LLM (Limit to last 20 notes to avoid token limits?)
    // Let's take the most recent 20 notes.
    const recentNotes = notes.slice(0, 20).map(n => `
Date: ${new Date(n.created_at).toLocaleDateString()}
Title: ${n.title}
Content:
${n.content}
---`).join('\n')

    const prompt = `
    You are an expert academic evaluator for the "Codex Machina" project.
    Your task is to evaluate a student's recent slip-box notes based on the following Rubric:

    **Rubric Criteria:**
    1. **Consistency (Frequency)**: Are they writing regularly? (You can see dates).
    2. **Connection (Density)**: Do they use [[WikiLinks]] to connect ideas? (Review for [[...]] syntax).
    3. **Depth (Quality)**: Are the notes atomic but substantial? Do they show thinking? Or are they just copy-pasted snippets?

    **Scoring Guide:**
    - **4 Points (Distinguished)**: Regular habit, deep visible connections, high quality original thought.
    - **3 Points (Proficient)**: Regular habit, some connections, good quality. (Target).
    - **2 Points (Emerging)**: Sporadic, few connections, superficial content.
    - **1 Point (Sparse)**: Rarely writes, no connections, junk text.

    **Input Data (Recent Notes):**
    ${recentNotes}

    **Output Format (JSON only):**
    {
        "score": integer (1-4),
        "narrative": "A concise (2-3 sentences) qualitative evaluation addressed to the teacher. Highlight specific patterns (e.g. 'Student is linking well between Biology and History', or 'Notes are mostly empty'). Be constructive."
    }
    `

    for (const modelName of MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName })
            const result = await model.generateContent(prompt)
            const responseText = result.response.text()
            const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
            const data = JSON.parse(cleanedText)
            return {
                score: data.score,
                narrative: data.narrative
            }
        } catch (e) {
            console.error(`Model ${modelName} failed evaluation:`, e)
        }
    }

    return { score: 0, narrative: "AI Evaluation failed. Please try again." }
}
