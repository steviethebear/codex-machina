export type BadFaithResult = {
    isBadFaith: boolean
    confidence: 'low' | 'medium' | 'high'
    reason: string
    feedback: string
    suggestions: string[]
}

/**
 * Detect if content appears to be superficial, low-effort, or gaming the system
 */
export async function detectBadFaith(
    content: string,
    type: 'atom' | 'link' | 'reflection',
    context?: { textId?: string; atomType?: string; unitId?: string }
): Promise<BadFaithResult> {
    // Tier 1: Rule-based checks (fast, no API cost)
    const ruleCheck = runRuleBasedChecks(content, type)
    if (ruleCheck.isBadFaith) {
        return ruleCheck
    }

    // Tier 2: LLM analysis (only if rule checks pass)
    const llmCheck = await runLLMAnalysis(content, type, context)
    return llmCheck
}

/**
 * Fast rule-based checks for obvious low-effort content
 */
function runRuleBasedChecks(content: string, type: string): BadFaithResult {
    const trimmed = content.trim()
    const words = trimmed.split(/\s+/)
    const wordCount = words.length

    // Check minimum word count
    const minWords = type === 'atom' ? 30 : type === 'link' ? 20 : 50
    if (wordCount < minWords) {
        return {
            isBadFaith: true,
            confidence: 'high',
            reason: 'Content too short',
            feedback: `⚠️ The Machine requires at least ${minWords} words for meaningful ${type}s. Your submission lacks the depth needed for knowledge integration.`,
            suggestions: [
                'Expand your analysis with specific details',
                'Explain your reasoning more thoroughly',
                'Connect to specific passages or ideas from the text'
            ]
        }
    }

    // Check for excessive repetition
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    const uniqueRatio = uniqueWords.size / words.length
    if (uniqueRatio < 0.4 && wordCount > 20) {
        return {
            isBadFaith: true,
            confidence: 'high',
            reason: 'Excessive repetition detected',
            feedback: '⚙️ The Machine detects repetitive patterns without substance. Vary your expression and deepen your analysis.',
            suggestions: [
                'Use diverse vocabulary to express different ideas',
                'Explore multiple angles of the topic',
                'Add new insights rather than restating the same point'
            ]
        }
    }

    // Check for all caps (likely not serious)
    if (trimmed === trimmed.toUpperCase() && wordCount > 5) {
        return {
            isBadFaith: true,
            confidence: 'medium',
            reason: 'All caps text',
            feedback: '⚠️ The Machine cannot process submissions in all capitals. Please use standard formatting.',
            suggestions: ['Rewrite in standard capitalization']
        }
    }

    // Check if content is only quotes (no original thought)
    const quoteLines = (content.match(/^>\s+/gm) || []).length
    const totalLines = content.split('\n').length
    if (quoteLines > 0 && quoteLines === totalLines) {
        return {
            isBadFaith: true,
            confidence: 'high',
            reason: 'Only quotes, no analysis',
            feedback: '📚 The Machine detects only quoted material without original analysis. Add your own thinking and interpretation.',
            suggestions: [
                'Explain what the quotes mean to you',
                'Analyze why these passages are significant',
                'Connect the quotes to broader themes or ideas'
            ]
        }
    }

    // Passed all rule checks
    return {
        isBadFaith: false,
        confidence: 'low',
        reason: '',
        feedback: '',
        suggestions: []
    }
}

/**
 * LLM-based semantic analysis for bad faith detection
 */
async function runLLMAnalysis(
    content: string,
    type: string,
    context?: any
): Promise<BadFaithResult> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.warn('No GEMINI_API_KEY found, skipping LLM analysis')
        return {
            isBadFaith: false,
            confidence: 'low',
            reason: 'API key not configured',
            feedback: '',
            suggestions: []
        }
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const contextInfo = context
        ? `CONTEXT: ${context.atomType ? `Atom type: ${context.atomType}` : ''}${context.textId ? ` | Linked to text` : ''}${context.unitId ? ` | Unit reflection` : ''}`
        : ''

    const prompt = `You are evaluating student work for a college course. Determine if this submission shows genuine intellectual engagement or if it appears superficial/low-effort.

SUBMISSION TYPE: ${type}
${contextInfo}

CONTENT:
"${content}"

Evaluate for:
1. **Specificity** - Does it engage with specific ideas, passages, or concepts?
2. **Originality** - Is there original thinking, or just generic statements that could apply to anything?
3. **Effort** - Does it show genuine intellectual work and engagement?
4. **Relevance** - Is it on-topic and meaningful for academic discussion?

IMPORTANT GUIDELINES:
- Simple questions are OK if they show genuine curiosity
- Struggling students who are authentically trying should NOT be flagged
- Only flag obvious low-effort, superficial, or gaming attempts
- Give benefit of the doubt - err on the side of NOT flagging
- Consider that students may be at different skill levels

Respond with JSON only:
{
  "isBadFaith": boolean,
  "confidence": "low" | "medium" | "high",
  "reason": "brief explanation of why flagged or not",
  "feedback": "constructive message to student in Machine voice (if flagged)",
  "suggestions": ["specific improvement 1", "specific improvement 2", "specific improvement 3"]
}`

    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Clean and parse JSON
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim()
        const analysis = JSON.parse(jsonStr)

        // Add Machine-voice prefix if flagged
        if (analysis.isBadFaith && analysis.feedback) {
            analysis.feedback = `⚠️ ${analysis.feedback}`
        }

        return analysis
    } catch (error) {
        console.error('Bad faith detection error:', error)
        // On error, don't flag (benefit of doubt)
        return {
            isBadFaith: false,
            confidence: 'low',
            reason: 'Analysis error',
            feedback: '',
            suggestions: []
        }
    }
}
