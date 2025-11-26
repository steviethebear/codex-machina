import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Tag = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type NoteTagInsert = Database['public']['Tables']['note_tags']['Insert']

/**
 * Get all tags, ordered by usage count
 */
export async function getTags(): Promise<Tag[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false })

    if (error) {
        console.error('Error fetching tags:', error)
        return []
    }

    return data || []
}

/**
 * Search tags by name (for autocomplete)
 */
export async function searchTags(query: string): Promise<Tag[]> {
    if (!query.trim()) return []

    const supabase = createClient()
    const normalizedQuery = query.toLowerCase()

    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${normalizedQuery}%`)
        .order('usage_count', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error searching tags:', error)
        return []
    }

    return data || []
}

/**
 * Create a new tag or get existing one
 */
export async function getOrCreateTag(displayName: string, userId: string): Promise<Tag | null> {
    const supabase = createClient()
    const normalizedName = displayName.toLowerCase().trim()

    // Check if tag exists
    const { data: existing } = await supabase
        .from('tags')
        .select('*')
        .eq('name', normalizedName)
        .single()

    if (existing) return existing

    // Create new tag
    const { data: newTag, error } = await supabase
        .from('tags')
        .insert({
            name: normalizedName,
            display_name: displayName.trim(),
            created_by: userId,
            usage_count: 0
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating tag:', error)
        return null
    }

    return newTag
}

/**
 * Add a tag to a note
 */
export async function addTagToNote(noteId: string, tagId: string, userId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('note_tags')
        .insert({
            note_id: noteId,
            tag_id: tagId,
            created_by: userId
        })

    if (error) {
        console.error('Error adding tag to note:', error)
        return false
    }

    return true
}

/**
 * Remove a tag from a note
 */
export async function removeTagFromNote(noteId: string, tagId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', noteId)
        .eq('tag_id', tagId)

    if (error) {
        console.error('Error removing tag from note:', error)
        return false
    }

    return true
}

/**
 * Get all tags for a specific note
 */
export async function getTagsForNote(noteId: string): Promise<Tag[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('note_tags')
        .select('tag_id, tags(*)')
        .eq('note_id', noteId)

    if (error) {
        console.error('Error fetching tags for note:', error)
        return []
    }

    return data?.map((nt: any) => nt.tags).filter(Boolean) || []
}

/**
 * Get all notes with a specific tag
 */
export async function getNotesWithTag(tagId: string): Promise<string[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('note_tags')
        .select('note_id')
        .eq('tag_id', tagId)

    if (error) {
        console.error('Error fetching notes with tag:', error)
        return []
    }

    return data?.map(nt => nt.note_id) || []
}
