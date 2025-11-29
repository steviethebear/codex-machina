'use server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from './generate-embeddings'

export type SuggestionNote = {
    id: string
    title: string
    body: string
    created_at: string
    score: number
    similarity?: number
    tags?: string[]
}

/**
 * Get smart suggestions for a note using hybrid ranking
 * Combines semantic similarity (if embeddings available), tag overlap, and recency
 * 
 * @param noteId - UUID of the current note (optional for new drafts)
 * @param noteText - Combined title + body text for similarity matching
 * @param tags - Array of tag names for tag-based matching
 * @param limit - Max number of suggestions to return (default 5)
 * @returns Ranked array of suggested notes
 */
export async function getSuggestions(
    noteId: string | null,
    noteText: string,
    tags: string[] = [],
    limit: number = 5
): Promise<SuggestionNote[]> {
    const supabase = await createClient()

    // Get existing connections for this note to exclude them
    let connectedNoteIds: string[] = []
    if (noteId) {
        const { data: links } = await supabase
            .from('links')
            .select('from_note_id, to_note_id')
            .or(`from_note_id.eq.${noteId},to_note_id.eq.${noteId}`)

        if (links) {
            connectedNoteIds = links.flatMap(link => [link.from_note_id, link.to_note_id])
                .filter(id => id && id !== noteId) as string[]
        }
    }

    // Fallback mode: Tag + recency similarity (used when embeddings unavailable)
    const fallbackSuggestions = await getFallbackSuggestions(noteId, tags, limit * 2, connectedNoteIds)

    // If note text is too short or no embeddings available, return fallback only
    if (noteText.trim().length < 20) {
        return fallbackSuggestions.slice(0, limit)
    }

    // Try enhanced mode: Check if current note has embedding
    if (noteId) {
        const { data: currentNote } = await supabase
            .from('atomic_notes')
            .select('embedding')
            .eq('id', noteId)
            .single()

        if (currentNote?.embedding) {
            return await getSemanticSuggestions(
                currentNote.embedding as any,
                noteId,
                tags,
                fallbackSuggestions,
                limit,
                connectedNoteIds
            )
        }
    }

    // No stored embedding — generate one on the fly from noteText
    const embedding = await generateEmbedding(noteText)
    if (embedding) {
        return await getSemanticSuggestions(
            embedding,
            noteId,
            tags,
            fallbackSuggestions,
            limit,
            connectedNoteIds
        )
    }

    // No embedding available — return fallback suggestions
    return fallbackSuggestions.slice(0, limit)
}

/**
 * Get suggestions using semantic similarity via pgvector
 */
async function getSemanticSuggestions(
    queryEmbedding: number[],
    excludeNoteId: string | null,
    tags: string[],
    fallbackSuggestions: SuggestionNote[],
    limit: number,
    connectedNoteIds: string[] = []
): Promise<SuggestionNote[]> {
    const supabase = await createClient()

    try {
        // Call RPC function for vector similarity search
        const { data: similarNotes, error } = await supabase
            .rpc('match_notes', {
                query_embedding: queryEmbedding as any,
                match_threshold: 0.5, // Minimum 50% similarity
                match_count: limit * 3 // Get extras for filtering
            })

        if (error || !similarNotes || similarNotes.length === 0) {
            console.warn('[Suggestions] Semantic search failed or no results, using fallback')
            return fallbackSuggestions.slice(0, limit)
        }

        // Fetch tags for similar notes
        const noteIds = similarNotes.map((n: any) => n.id)
        const { data: noteTags } = await supabase
            .from('note_tags')
            .select('note_id, tags(name)')
            .in('note_id', noteIds)

        // Map note IDs to their tags
        const tagsByNote = new Map<string, string[]>()
        noteTags?.forEach((nt: any) => {
            const tags = tagsByNote.get(nt.note_id) || []
            if (nt.tags?.name) tags.push(nt.tags.name)
            tagsByNote.set(nt.note_id, tags)
        })

        // Rank suggestions using hybrid scoring
        const ranked = similarNotes
            .filter((n: any) => n.id !== excludeNoteId && !connectedNoteIds.includes(n.id)) // Exclude self and connected notes
            .map((note: any) => {
                let score = note.similarity // Start with semantic similarity (0-1)

                // Boost for shared tags (+0.1 per tag, max +0.3)
                const noteTags = tagsByNote.get(note.id) || []
                const sharedTags = noteTags.filter(tag => tags.includes(tag)).length
                score += Math.min(sharedTags * 0.1, 0.3)

                // Boost for recent notes (within 7 days: +0.05)
                const daysSinceCreation = (Date.now() - new Date(note.created_at).getTime()) / (1000 * 60 * 60 * 24)
                if (daysSinceCreation < 7) {
                    score += 0.05
                }

                return {
                    id: note.id,
                    title: note.title,
                    body: note.body,
                    created_at: note.created_at,
                    score,
                    similarity: note.similarity,
                    tags: noteTags
                }
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)

        return ranked
    } catch (error: any) {
        console.error('[Suggestions] Semantic search error:', error.message)
        return fallbackSuggestions.slice(0, limit)
    }
}

/**
 * Get suggestions based on tag overlap and recency (fallback mode)
 */
async function getFallbackSuggestions(
    excludeNoteId: string | null,
    tags: string[],
    limit: number,
    connectedNoteIds: string[] = []
): Promise<SuggestionNote[]> {
    const supabase = await createClient()

    try {
        // If no tags provided, just get recent approved notes
        if (tags.length === 0) {
            const { data: recentNotes } = await supabase
                .from('atomic_notes')
                .select('id, title, body, created_at')
                .eq('moderation_status', 'approved')
                .neq('id', excludeNoteId || '')
                .not('id', 'in', `(${connectedNoteIds.join(',') || 'null'})`)
                .order('created_at', { ascending: false })
                .limit(limit)

            return (recentNotes || []).map(note => ({
                ...note,
                score: 0.5, // Base score for recency
                tags: []
            }))
        }

        // Find notes with shared tags
        const { data: notesWithSharedTags } = await supabase
            .from('note_tags')
            .select('note_id, tags(name), atomic_notes(id, title, body, created_at, moderation_status)')
            .in('tags.name', tags)

        if (!notesWithSharedTags || notesWithSharedTags.length === 0) {
            return []
        }

        // Group by note and count shared tags
        const noteScores = new Map<string, { note: any; sharedTags: number; tags: string[] }>()

        notesWithSharedTags.forEach((item: any) => {
            const note = item.atomic_notes
            if (!note || note.moderation_status !== 'approved' || note.id === excludeNoteId || connectedNoteIds.includes(note.id)) {
                return
            }

            const existing = noteScores.get(note.id)
            if (existing) {
                existing.sharedTags++
                if (item.tags?.name) existing.tags.push(item.tags.name)
            } else {
                noteScores.set(note.id, {
                    note,
                    sharedTags: 1,
                    tags: item.tags?.name ? [item.tags.name] : []
                })
            }
        })

        // Rank by shared tags and recency
        const ranked = Array.from(noteScores.values())
            .map(({ note, sharedTags, tags }) => {
                let score = sharedTags * 0.2 // 0.2 per shared tag

                // Recency boost
                const daysSinceCreation = (Date.now() - new Date(note.created_at).getTime()) / (1000 * 60 * 60 * 24)
                if (daysSinceCreation < 7) {
                    score += 0.1
                }

                return {
                    id: note.id,
                    title: note.title,
                    body: note.body,
                    created_at: note.created_at,
                    score,
                    tags
                }
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)

        return ranked
    } catch (error: any) {
        console.error('[Suggestions] Fallback search error:', error.message)
        return []
    }
}
