import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Note = Database['public']['Tables']['atomic_notes']['Row']
type Text = Database['public']['Tables']['texts']['Row']

export interface SuggestedNote {
    note: Note
    score: number
    reason: string
}

export interface SuggestedText {
    text: Text
    score: number
    reason: string
}

export interface SuggestionResults {
    notes: SuggestedNote[]
    texts: SuggestedText[]
}

interface FindRelatedParams {
    title: string
    body: string
    type: string
    textId?: string | null
    excludeId?: string
    userId: string
    limit?: number
}

/**
 * Find related notes and texts using simple text similarity
 * Scoring: (title_matches * 3) + (same_text * 2) + (same_type * 1) + (keyword_matches * 0.5)
 */
export async function findRelatedNotes(params: FindRelatedParams): Promise<SuggestionResults> {
    const { title, body, type, textId, excludeId, userId, limit = 5 } = params

    const supabase = createClient()

    // Fetch approved and pending notes (not rejected or hidden)
    let query = supabase
        .from('atomic_notes')
        .select('*')
        .eq('hidden', false)

    if (excludeId) {
        query = query.neq('id', excludeId)
    }

    const { data: rawNotes, error } = await query

    if (error) {
        console.error('Suggestion Fetch Error:', error)
    }

    // Filter in memory to be safe
    const notes = (rawNotes as Note[])?.filter(n => n.moderation_status !== 'rejected')

    console.log('Suggestion Debug - Fetching:', {
        inputTitle: title,
        totalNotesFound: notes?.length,
        notesSample: (notes as Note[])?.slice(0, 3).map(n => n.title)
    })

    // Fetch non-archived texts
    const { data: texts } = await supabase
        .from('texts')
        .select('*')
        .eq('archived', false)

    // Prepare input tokens
    const titleLower = (title || '').toLowerCase()
    const titleWords = extractKeywords(title || '')
    const bodyWords = extractKeywords(body || '')
    const allInputWords = new Set([...titleWords, ...bodyWords])

    // Helper for scoring
    const calculateScore = (itemTitle: string, itemBody: string | null, itemType: string | null, itemTextId: string | null, isText: boolean) => {
        let score = 0
        const reasons: string[] = []
        const safeItemTitle = itemTitle || ''
        const itemTitleLower = safeItemTitle.toLowerCase()
        const itemTitleWords = extractKeywords(safeItemTitle)

        // 1. Exact Phrase Match (High Value)
        if (titleLower.length > 3 && itemTitleLower.includes(titleLower)) {
            score += 10
            reasons.push('exact phrase match')
        }

        // 2. Title Word Matching (Exact & Partial)
        let titleMatchScore = 0
        let matchCount = 0

        // Check each word in the ITEM's title against INPUT title words
        itemTitleWords.forEach(itemWord => {
            // Exact match
            if (titleWords.includes(itemWord)) {
                titleMatchScore += 3
                matchCount++
            }
            // Partial match (if word is long enough)
            else if (itemWord.length > 3) {
                const partialMatch = titleWords.some(inputWord =>
                    (inputWord.length > 3 && (itemWord.includes(inputWord) || inputWord.includes(itemWord)))
                )
                if (partialMatch) {
                    titleMatchScore += 1
                    matchCount++
                }
            }
        })

        if (titleMatchScore > 0) {
            score += titleMatchScore
            reasons.push(`${matchCount} title match${matchCount > 1 ? 'es' : ''}`)
        }

        // 3. Same Source (Notes only)
        if (!isText && textId && itemTextId === textId) {
            score += 2
            reasons.push('same source')
        }

        // 4. Same Type (Notes only)
        if (!isText && itemType === type) {
            score += 1
            reasons.push('same type')
        }

        // 5. Body/Author Keyword Matching
        // For texts, we check Author. For notes, we check Body.
        if (isText) {
            // Check Author
            const authorWords = extractKeywords(itemBody || '') // itemBody passed as author for texts
            const authorMatches = authorWords.filter(word => allInputWords.has(word)).length
            if (authorMatches > 0) {
                score += authorMatches * 1.5
                reasons.push('author match')
            }
        } else {
            // Check Body
            const noteBodyWords = extractKeywords(itemBody || '')
            const bodyMatches = noteBodyWords.filter(word => allInputWords.has(word)).length
            if (bodyMatches > 0) {
                score += bodyMatches * 0.5
                reasons.push(`${bodyMatches} keyword${bodyMatches > 1 ? 's' : ''}`)
            }
        }

        return { score, reasons }
    }

    // Score Notes
    const scoredNotes: SuggestedNote[] = (notes || []).map((note: Note) => {
        const { score, reasons } = calculateScore(note.title, note.body, note.type, note.text_id, false)
        return { note, score, reason: reasons.join(', ') }
    })

    // Score Texts
    const scoredTexts: SuggestedText[] = (texts || []).map((text: Text) => {
        const { score, reasons } = calculateScore(text.title, text.author, 'text', null, true)
        return { text, score, reason: reasons.length > 0 ? reasons.join(', ') : 'related content' }
    })

    // Filter and Sort
    const topNotes = scoredNotes
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

    const topTexts = scoredTexts
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

    console.log('Suggestion Debug - Results:', {
        topNotesCount: topNotes.length,
        topNotes: topNotes.map(n => ({ title: n.note.title, score: n.score, reason: n.reason })),
        topTextsCount: topTexts.length
    })

    return {
        notes: topNotes,
        texts: topTexts
    }
}

/**
 * Extract keywords from text (remove common words, lowercase, trim)
 */
function extractKeywords(text: string): string[] {
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
        'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'what', 'which', 'who', 'when', 'where', 'why', 'how'
    ])

    return text
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
        .filter(word => word.length > 2 && !commonWords.has(word))
}
