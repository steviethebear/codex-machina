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
            tags: {
                Row: {
                    id: string
                    name: string
                    display_name: string
                    created_at: string
                    created_by: string | null
                    usage_count: number
                }
                Insert: {
                    id?: string
                    name: string
                    display_name: string
                    created_at?: string
                    created_by?: string | null
                    usage_count?: number
                }
                Update: {
                    id?: string
                    name?: string
                    display_name?: string
                    created_at?: string
                    created_by?: string | null
                    usage_count?: number
                }
            }
            note_tags: {
                Row: {
                    id: string
                    note_id: string
                    tag_id: string
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    note_id: string
                    tag_id: string
                    created_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    note_id?: string
                    tag_id?: string
                    created_at?: string
                    created_by?: string | null
                }
            }
            streaks: {
                Row: {
                    id: string
                    user_id: string
                    current_streak: number
                    longest_streak: number
                    last_contribution_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    current_streak?: number
                    longest_streak?: number
                    last_contribution_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    current_streak?: number
                    longest_streak?: number
                    last_contribution_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            bonus_rewards: {
                Row: {
                    id: string
                    user_id: string
                    bonus_type: string
                    trigger_id: string | null
                    xp_awarded: number
                    sp_awarded: Json
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    bonus_type: string
                    trigger_id?: string | null
                    xp_awarded?: number
                    sp_awarded?: Json
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    bonus_type?: string
                    trigger_id?: string | null
                    xp_awarded?: number
                    sp_awarded?: Json
                    metadata?: Json
                    created_at?: string
                }
            }
            achievements: {
                Row: {
                    id: string
                    key: string
                    name: string
                    description: string
                    category: string
                    xp_reward: number
                    icon: string | null
                    tier: number
                    requirement_type: string
                    requirement_value: number | null
                    requirement_metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    name: string
                    description: string
                    category: string
                    xp_reward?: number
                    icon?: string | null
                    tier?: number
                    requirement_type: string
                    requirement_value?: number | null
                    requirement_metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    name?: string
                    description?: string
                    category?: string
                    xp_reward?: number
                    icon?: string | null
                    tier?: number
                    requirement_type?: string
                    requirement_value?: number | null
                    requirement_metadata?: Json
                    created_at?: string
                }
            }
            user_achievements: {
                Row: {
                    id: string
                    user_id: string
                    achievement_id: string
                    unlocked_at: string | null
                    progress: number
                }
                Insert: {
                    id?: string
                    user_id: string
                    achievement_id: string
                    unlocked_at?: string | null
                    progress?: number
                }
                Update: {
                    id?: string
                    user_id?: string
                    achievement_id?: string
                    unlocked_at?: string | null
                    progress?: number
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: string
                    title: string
                    message: string
                    link_url: string | null
                    metadata: Json
                    read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: string
                    title: string
                    message: string
                    link_url?: string | null
                    metadata?: Json
                    read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: string
                    title?: string
                    message?: string
                    link_url?: string | null
                    metadata?: Json
                    read?: boolean
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
            tags: {
                Row: {
                    id: string
                    name: string
                    display_name: string
                    created_at: string
                    created_by: string | null
                    usage_count: number
                }
                Insert: {
                    id?: string
                    name: string
                    display_name: string
                    created_at?: string
                    created_by?: string | null
                    usage_count?: number
                }
                Update: {
                    id?: string
                    name?: string
                    display_name?: string
                    created_at?: string
                    created_by?: string | null
                    usage_count?: number
                }
            }
            note_tags: {
                Row: {
                    id: string
                    note_id: string
                    tag_id: string
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    note_id: string
                    tag_id: string
                    created_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    note_id?: string
                    tag_id?: string
                    created_at?: string
                    created_by?: string | null
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
