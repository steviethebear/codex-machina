'use server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface QualityAnalysisResult {
    score: number
    feedback: string
    suggestions: string[]
    isHighQuality: boolean
}

export async function analyzeAtomQuality(note: { title: string, body: string, type: string }): Promise<QualityAnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.warn('No GEMINI_API_KEY found, skipping quality check')
        return {
            score: 10,
            feedback: 'AI analysis unavailable (no key).',
            suggestions: [],
            isHighQuality: true
        }
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
        You are a helpful writing mentor for an academic RPG.
        Analyze the following student note ("atom") and provide constructive feedback.

        Note Type: ${note.type}
        Title: ${note.title}
        Body: ${note.body}

        Your goal is to encourage specific, deep thinking.
        
        Evaluation Criteria:
        - Idea: Is it clear? Does it connect concepts?
        - Question: Is it open-ended? Does it probe deeper?
        - Insight: Is it a novel realization?
        - Quote: Is the context explained?

        Return a JSON object with:
        - score: number (1-10)
        - feedback: string (1-2 encouraging sentences summarizing the quality)
        - suggestions: string[] (1-3 specific, actionable bullet points to improve it. If score is 10, leave empty.)
        - isHighQuality: boolean (true if score >= 7)

        Output JSON only.
        `

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim()
        const analysis = JSON.parse(jsonStr) as QualityAnalysisResult

        return analysis
    } catch (error) {
        console.error('Error analyzing atom quality:', error)
        // Fail open so we don't block the user
        return {
            score: 10,
            feedback: 'Unable to analyze quality at this time.',
            suggestions: [],
            isHighQuality: true
        }
    }
}
