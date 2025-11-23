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
    const { data: notes } = await supabase
        .from('atomic_notes')
        .select('*')
        .neq('moderation_status', 'rejected')
        .eq('hidden', false)
        .neq('id', excludeId || '')

    // Fetch non-archived texts
    const { data: texts } = await supabase
        .from('texts')
        .select('*')
        .eq('archived', false)

    // Extract keywords from title and body
    const titleWords = extractKeywords(title)
    const bodyWords = extractKeywords(body)
    const allWords = new Set([...titleWords, ...bodyWords])

    // Score each note
    const scoredNotes: SuggestedNote[] = (notes || []).map((note: Note) => {
        let score = 0
        const reasons: string[] = []

        // 1. Title matching (weight: 3)
        const noteTitleWords = extractKeywords(note.title)
        const titleMatches = noteTitleWords.filter(word => titleWords.includes(word)).length
        if (titleMatches > 0) {
            score += titleMatches * 3
            reasons.push(`${titleMatches} title word${titleMatches > 1 ? 's' : ''}`)
        }

        // 2. Same text reference (weight: 2)
        if (textId && note.text_id === textId) {
            score += 2
            reasons.push('same source')
        }

        // 3. Same type (weight: 1)
        if (note.type === type) {
            score += 1
            reasons.push('same type')
        }

        // 4. Body keyword matching (weight: 0.5)
        const noteBodyWords = extractKeywords(note.body)
        const bodyMatches = noteBodyWords.filter(word => allWords.has(word)).length
        if (bodyMatches > 0) {
            score += bodyMatches * 0.5
            reasons.push(`${bodyMatches} keyword${bodyMatches > 1 ? 's' : ''}`)
        }

        return {
            note,
            score,
            reason: reasons.join(', ')
        }
    })

    // Score each text
    const scoredTexts: SuggestedText[] = (texts || []).map((text: Text) => {
        let score = 0
        const reasons: string[] = []

        // 1. Title matching (weight: 3)
        const textTitleWords = extractKeywords(text.title)
        const titleMatches = textTitleWords.filter(word => titleWords.includes(word)).length
        if (titleMatches > 0) {
            score += titleMatches * 3
            reasons.push(`${titleMatches} title word${titleMatches > 1 ? 's' : ''}`)
        }

        // 2. Author matching (weight: 1.5)
        const authorWords = extractKeywords(text.author)
        const authorMatches = authorWords.filter(word => allWords.has(word)).length
        if (authorMatches > 0) {
            score += authorMatches * 1.5
            reasons.push('author match')
        }

        return {
            text,
            score,
            reason: reasons.length > 0 ? reasons.join(', ') : 'related content'
        }
    })

    // Filter out zero scores and sort by score descending
    const topNotes = scoredNotes
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

    const topTexts = scoredTexts
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3) // Show fewer texts

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
