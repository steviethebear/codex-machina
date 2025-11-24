export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    codex_name: string | null
                    is_admin: boolean
                    created_at: string
                }
                Insert: {
                    id: string
                    email: string
                    codex_name?: string | null
                    is_admin?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    codex_name?: string | null
                    is_admin?: boolean
                    created_at?: string
                }
            }
            characters: {
                Row: {
                    id: string
                    user_id: string
                    level: number
                    xp_total: number
                    sp_reading: number
                    sp_thinking: number
                    sp_writing: number
                    sp_engagement: number
                    title: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    level?: number
                    xp_total?: number
                    sp_reading?: number
                    sp_thinking?: number
                    sp_writing?: number
                    sp_engagement?: number
                    title?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    level?: number
                    xp_total?: number
                    sp_reading?: number
                    sp_thinking?: number
                    sp_writing?: number
                    sp_engagement?: number
                    created_at?: string
                }
            }
            texts: {
                Row: {
                    id: string
                    title: string
                    author: string
                    type: string
                    archived: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    author: string
                    type: string
                    archived?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    author?: string
                    type?: string
                    archived?: boolean
                    created_at?: string
                }
            }
            units: {
                Row: {
                    id: string
                    title: string
                    start_date: string
                    end_date: string
                    reflection_prompt: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    start_date: string
                    end_date: string
                    reflection_prompt?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    start_date?: string
                    end_date?: string
                    reflection_prompt?: string | null
                    created_at?: string
                }
            }
            atomic_notes: {
                Row: {
                    id: string
                    author_id: string
                    character_id: string
                    text_id: string | null
                    title: string
                    body: string
                    type: 'idea' | 'question' | 'quote' | 'insight'
                    tags: string[] | null
                    hidden: boolean
                    moderation_status: 'pending' | 'approved' | 'rejected'
                    is_system_note: boolean
                    discoverable_by: string | null
                    quality_flag: 'exemplary' | 'interesting' | 'needs_revision' | null
                    flag_visible_to_students: boolean
                    flagged_by: string | null
                    flagged_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    author_id: string
                    character_id: string
                    text_id?: string | null
                    title: string
                    body: string
                    type: 'idea' | 'question' | 'quote' | 'insight'
                    tags?: string[] | null
                    hidden?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    author_id?: string
                    character_id?: string
                    text_id?: string | null
                    title?: string
                    body?: string
                    type?: 'idea' | 'question' | 'quote' | 'insight'
                    tags?: string[] | null
                    hidden?: boolean
                    created_at?: string
                }
            }
            links: {
                Row: {
                    id: string
                    from_note_id: string
                    to_note_id: string | null
                    to_text_id: string | null
                    relation_type: 'supports' | 'extends' | 'questions' | 'contrasts'
                    explanation: string
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    from_note_id: string
                    to_note_id?: string | null
                    to_text_id?: string | null
                    relation_type: 'supports' | 'extends' | 'questions' | 'contrasts'
                    explanation: string
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    from_note_id?: string
                    to_note_id?: string | null
                    to_text_id?: string | null
                    relation_type?: 'supports' | 'extends' | 'questions' | 'contrasts'
                    explanation?: string
                    created_by?: string
                    created_at?: string
                }
            }
            reflections: {
                Row: {
                    id: string
                    user_id: string
                    unit_id: string
                    body: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    unit_id: string
                    body: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    unit_id?: string
                    body?: string
                    created_at?: string
                }
            }
            actions: {
                Row: {
                    id: string
                    user_id: string
                    type: string
                    xp: number
                    sp_reading: number
                    sp_thinking: number
                    sp_writing: number
                    sp_engagement: number
                    description: string | null
                    target_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: string
                    xp?: number
                    sp_reading?: number
                    sp_thinking?: number
                    sp_writing?: number
                    sp_engagement?: number
                    description?: string | null
                    target_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: string
                    xp?: number
                    sp_reading?: number
                    sp_thinking?: number
                    sp_writing?: number
                    sp_engagement?: number
                    description?: string | null
                    target_id?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            hub_stats: {
                Row: {
                    note_id: string
                    incoming_links_count: number
                }
            }
        }
        Functions: {
            [_: string]: never
        }
        Enums: {
            [_: string]: never
        }
    }
}
