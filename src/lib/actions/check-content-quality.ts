'use server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type ContentType = 'atom' | 'link' | 'reflection'
export type ContentCategory = 'question' | 'analysis' | 'definition' | 'citation' | 'insight'

export interface ContentQualityResult {
    isValid: boolean
    quality: 'excellent' | 'good' | 'needs_work'
    category?: ContentCategory
    feedback: string
    suggestions: string[]
}

/**
 * Unified content quality checker with Machine voice feedback.
 * Replaces scattered checkMeaning and analyzeAtomQuality calls.
 */
export async function checkContentQuality(
    content: { title?: string; body: string; type?: string },
    contentType: ContentType,
    minLength: number = 50
): Promise<ContentQualityResult> {
    const fullText = content.title ? `${content.title} ${content.body}` : content.body
    const trimmedText = fullText.trim()

    // Basic validation
    if (trimmedText.length < minLength) {
        return {
            isValid: false,
            quality: 'needs_work',
            feedback: 'The Machine cannot synthesize meaning from insufficient data.',
            suggestions: [`Expand your ${contentType} to at least ${minLength} characters for proper analysis.`]
        }
    }

    // Quick gibberish check (heuristics)
    const gibberishResult = detectGibberish(trimmedText)
    if (gibberishResult) {
        return {
            isValid: false,
            quality: 'needs_work',
            feedback: 'Signal rejected. The Machine detected incoherent data patterns.',
            suggestions: gibberishResult.suggestions
        }
    }

    // Try Gemini API for deep analysis
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.warn('No GEMINI_API_KEY found, using heuristics only')
        return {
            isValid: true,
            quality: 'good',
            category: classifyContent(trimmedText),
            feedback: 'Signal received. Content validates against baseline heuristics.',
            suggestions: []
        }
    }

    try {
        const result = await analyzeWithGemini(content, contentType, trimmedText, apiKey)
        return result
    } catch (error) {
        console.error('Gemini API error:', error)
        // Fail open - allow content but with neutral feedback
        return {
            isValid: true,
            quality: 'good',
            category: classifyContent(trimmedText),
            feedback: 'The Machine acknowledges your signal. Analysis systems temporarily limited.',
            suggestions: []
        }
    }
}

async function analyzeWithGemini(
    content: { title?: string; body: string; type?: string },
    contentType: ContentType,
    fullText: string,
    apiKey: string
): Promise<ContentQualityResult> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = buildPrompt(content, contentType, fullText)
    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // Clean and parse JSON
    const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim()
    const analysis = JSON.parse(jsonStr) as {
        isValid: boolean
        quality: 'excellent' | 'good' | 'needs_work'
        category?: ContentCategory
        feedback: string
        suggestions: string[]
    }

    return analysis
}

function buildPrompt(content: { title?: string; body: string; type?: string }, contentType: ContentType, fullText: string): string {
    const basePrompt = `
You are the Machine - an AI mentor for an academic RPG called Codex Machina.
Your voice is authoritative, encouraging, and uses "signal/synthesis/circuitry" metaphors.

Analyze this ${contentType} submission:
${content.title ? `Title: ${content.title}` : ''}
Content: ${content.body}
${content.type ? `Type: ${content.type}` : ''}

VALIDATION RULES:
1. Reject gibberish, spam, or keyboard smashing
2. Require meaningful thought, even if simple
3. Accept meta-comments, tests, questions, ideas

CLASSIFICATION (for atoms/links):
- 'question': Contains interrogatives, seeks answers
- 'analysis': Compares, critiques, synthesizes ideas
- 'definition': Explains concepts, defines terms
- 'citation': Quotes/references external sources
- 'insight': Sudden realizations, epiphanies

QUALITY LEVELS:
- 'excellent': Deep thinking, clear connections (score 8-10)
- 'good': Valid thought, room for depth (score 5-7)
- 'needs_work': Unclear, superficial (score 1-4)

Return JSON with Machine voice:
{
  "isValid": boolean,
  "quality": "excellent" | "good" | "needs_work",
  "category": "question" | "analysis" | "definition" | "citation" | "insight" (optional, for atoms/links),
  "feedback": "1-2 sentences in Machine voice (e.g., 'Signal received. Your analysis demonstrates coherent synthesis of disparate data streams.')",
  "suggestions": ["actionable improvements if quality is 'needs_work' or 'good', empty array if excellent"]
}

Output JSON only.`

    return basePrompt
}

function detectGibberish(text: string): { suggestions: string[] } | null {
    // Excessive non-alphanumeric characters
    const nonAlpha = text.replace(/[a-zA-Z0-9\s.,!?'-]/g, '')
    if (nonAlpha.length / text.length > 0.2) {
        return { suggestions: ['Remove nonsensical character patterns.', 'Use coherent language.'] }
    }

    // Repetition (e.g., "aaaa")
    if (/(.)\\1{3,}/.test(text)) {
        return { suggestions: ['Avoid repetitive character sequences.'] }
    }

    // Lack of spaces in long text
    if (text.length > 30 && !text.includes(' ')) {
        return { suggestions: ['Include proper word spacing.'] }
    }

    return null
}

/**
 * Classify content into category (simple heuristics)
 */
function classifyContent(text: string): ContentCategory {
    const lowerText = text.toLowerCase()

    // Question detection
    if (lowerText.includes('?') || /\b(why|how|what|when|where|who|which|can|could|would|should|is|are|does)\b/.test(lowerText)) {
        return 'question'
    }

    // Citation detection (quotes, references)
    if (/"[^"]{10,}"/.test(text) || /according to|states that|writes that|argues that/i.test(text)) {
        return 'citation'
    }

    // Analysis keywords
    if (/compar|contrast|whereas|however|although|both|similar|different|analyz/i.test(lowerText)) {
        return 'analysis'
    }

    // Insight keywords
    if (/realiz|discover|suddenly|aha|insight|epiphany|understand now/i.test(lowerText)) {
        return 'insight'
    }

    // Default to definition
    return 'definition'
}
