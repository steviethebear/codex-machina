export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string | null
          id: string
          key: string
          name: string
          requirement_metadata: Json | null
          requirement_type: string
          requirement_value: number | null
          tier: number | null
          xp_reward: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          key: string
          name: string
          requirement_metadata?: Json | null
          requirement_type: string
          requirement_value?: number | null
          tier?: number | null
          xp_reward?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          key?: string
          name?: string
          requirement_metadata?: Json | null
          requirement_type?: string
          requirement_value?: number | null
          tier?: number | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      actions: {
        Row: {
          bonus_type: string | null
          created_at: string
          description: string | null
          id: string
          sp_engagement: number | null
          sp_reading: number | null
          sp_thinking: number | null
          sp_writing: number | null
          type: string
          user_id: string
          xp: number | null
        }
        Insert: {
          bonus_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sp_engagement?: number | null
          sp_reading?: number | null
          sp_thinking?: number | null
          sp_writing?: number | null
          type: string
          user_id: string
          xp?: number | null
        }
        Update: {
          bonus_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sp_engagement?: number | null
          sp_reading?: number | null
          sp_thinking?: number | null
          sp_writing?: number | null
          type?: string
          user_id?: string
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      atomic_notes: {
        Row: {
          author_id: string
          body: string
          character_id: string
          connection_count: number | null
          created_at: string
          discoverable_by: string | null
          embedding: string | null
          flag_visible_to_students: boolean | null
          flagged_at: string | null
          flagged_by: string | null
          hidden: boolean | null
          id: string
          is_hub: boolean | null
          is_system_note: boolean | null
          moderation_checked_at: string | null
          moderation_result: string | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          quality_flag: string | null
          tags: string[] | null
          text_id: string | null
          title: string
          type: string
        }
        Insert: {
          author_id: string
          body: string
          character_id: string
          connection_count?: number | null
          created_at?: string
          discoverable_by?: string | null
          embedding?: string | null
          flag_visible_to_students?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          hidden?: boolean | null
          id?: string
          is_hub?: boolean | null
          is_system_note?: boolean | null
          moderation_checked_at?: string | null
          moderation_result?: string | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          quality_flag?: string | null
          tags?: string[] | null
          text_id?: string | null
          title: string
          type: string
        }
        Update: {
          author_id?: string
          body?: string
          character_id?: string
          connection_count?: number | null
          created_at?: string
          discoverable_by?: string | null
          embedding?: string | null
          flag_visible_to_students?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          hidden?: boolean | null
          id?: string
          is_hub?: boolean | null
          is_system_note?: boolean | null
          moderation_checked_at?: string | null
          moderation_result?: string | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          quality_flag?: string | null
          tags?: string[] | null
          text_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "atomic_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atomic_notes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atomic_notes_discoverable_by_fkey"
            columns: ["discoverable_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atomic_notes_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atomic_notes_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "texts"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_rewards: {
        Row: {
          bonus_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          sp_awarded: Json | null
          trigger_id: string | null
          user_id: string
          xp_awarded: number | null
        }
        Insert: {
          bonus_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sp_awarded?: Json | null
          trigger_id?: string | null
          user_id: string
          xp_awarded?: number | null
        }
        Update: {
          bonus_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sp_awarded?: Json | null
          trigger_id?: string | null
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bonus_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          created_at: string
          id: string
          level: number | null
          sp_engagement: number | null
          sp_reading: number | null
          sp_thinking: number | null
          sp_writing: number | null
          title: string | null
          user_id: string
          xp_total: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number | null
          sp_engagement?: number | null
          sp_reading?: number | null
          sp_thinking?: number | null
          sp_writing?: number | null
          title?: string | null
          user_id: string
          xp_total?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: number | null
          sp_engagement?: number | null
          sp_reading?: number | null
          sp_thinking?: number | null
          sp_writing?: number | null
          title?: string | null
          user_id?: string
          xp_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          created_by: string
          explanation: string
          from_note_id: string
          from_question_id: string | null
          id: string
          relation_type: string
          to_note_id: string | null
          to_question_id: string | null
          to_text_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          explanation: string
          from_note_id: string
          from_question_id?: string | null
          id?: string
          relation_type: string
          to_note_id?: string | null
          to_question_id?: string | null
          to_text_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          explanation?: string
          from_note_id?: string
          from_question_id?: string | null
          id?: string
          relation_type?: string
          to_note_id?: string | null
          to_question_id?: string | null
          to_text_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_from_note_id_fkey"
            columns: ["from_note_id"]
            isOneToOne: false
            referencedRelation: "atomic_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_from_question_id_fkey"
            columns: ["from_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_to_note_id_fkey"
            columns: ["to_note_id"]
            isOneToOne: false
            referencedRelation: "atomic_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_to_question_id_fkey"
            columns: ["to_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_to_text_id_fkey"
            columns: ["to_text_id"]
            isOneToOne: false
            referencedRelation: "texts"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "atomic_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link_url: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link_url?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link_url?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          accepted_atom_id: string | null
          author_id: string
          body: string
          character_id: string
          created_at: string | null
          embedding: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          is_resolved: boolean | null
          moderation_result: string | null
          moderation_status: string | null
          reply_count: number | null
          resolved_at: string | null
          tags: string[] | null
          text_id: string | null
          title: string
          unit_id: string | null
          updated_at: string | null
          upvote_count: number | null
          view_count: number | null
        }
        Insert: {
          accepted_atom_id?: string | null
          author_id: string
          body: string
          character_id: string
          created_at?: string | null
          embedding?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_resolved?: boolean | null
          moderation_result?: string | null
          moderation_status?: string | null
          reply_count?: number | null
          resolved_at?: string | null
          tags?: string[] | null
          text_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string | null
          upvote_count?: number | null
          view_count?: number | null
        }
        Update: {
          accepted_atom_id?: string | null
          author_id?: string
          body?: string
          character_id?: string
          created_at?: string | null
          embedding?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_resolved?: boolean | null
          moderation_result?: string | null
          moderation_status?: string | null
          reply_count?: number | null
          resolved_at?: string | null
          tags?: string[] | null
          text_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string | null
          upvote_count?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_accepted_atom_id_fkey"
            columns: ["accepted_atom_id"]
            isOneToOne: false
            referencedRelation: "atomic_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "texts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          body: string
          created_at: string
          id: string
          unit_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          unit_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          created_at: string | null
          created_by: string | null
          deliverables: Json
          description: string
          difficulty: string | null
          discovery_criteria: Json | null
          discovery_type: string | null
          estimated_time_minutes: number | null
          id: string
          is_active: boolean | null
          oracle_completion_message: string | null
          oracle_discovery_message: string | null
          sp_engagement: number | null
          sp_reading: number | null
          sp_thinking: number | null
          sp_writing: number | null
          tags: string[] | null
          title: string
          unit_id: string | null
          unlock_level: number | null
          updated_at: string | null
          validation_prompt: string | null
          validation_type: string | null
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deliverables?: Json
          description: string
          difficulty?: string | null
          discovery_criteria?: Json | null
          discovery_type?: string | null
          estimated_time_minutes?: number | null
          id?: string
          is_active?: boolean | null
          oracle_completion_message?: string | null
          oracle_discovery_message?: string | null
          sp_engagement?: number | null
          sp_reading?: number | null
          sp_thinking?: number | null
          sp_writing?: number | null
          tags?: string[] | null
          title: string
          unit_id?: string | null
          unlock_level?: number | null
          updated_at?: string | null
          validation_prompt?: string | null
          validation_type?: string | null
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deliverables?: Json
          description?: string
          difficulty?: string | null
          discovery_criteria?: Json | null
          discovery_type?: string | null
          estimated_time_minutes?: number | null
          id?: string
          is_active?: boolean | null
          oracle_completion_message?: string | null
          oracle_discovery_message?: string | null
          sp_engagement?: number | null
          sp_reading?: number | null
          sp_thinking?: number | null
          sp_writing?: number | null
          tags?: string[] | null
          title?: string
          unit_id?: string | null
          unlock_level?: number | null
          updated_at?: string | null
          validation_prompt?: string | null
          validation_type?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_contribution_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_contribution_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_contribution_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          name: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          name: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          name?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      texts: {
        Row: {
          archived: boolean | null
          author: string
          created_at: string
          id: string
          title: string
          type: string
        }
        Insert: {
          archived?: boolean | null
          author: string
          created_at?: string
          id?: string
          title: string
          type: string
        }
        Update: {
          archived?: boolean | null
          author?: string
          created_at?: string
          id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reflection_prompt: string | null
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reflection_prompt?: string | null
          start_date: string
          title: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reflection_prompt?: string | null
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_signals: {
        Row: {
          activated_at: string | null
          completed_at: string | null
          created_at: string | null
          discovered_at: string | null
          estimated_review_time: unknown
          id: string
          queue_reason: string | null
          queued_at: string | null
          signal_id: string
          sp_awarded: Json | null
          status: string
          submission_data: Json | null
          submission_notes: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          validated_by: string | null
          validation_feedback: string | null
          validation_result: Json | null
          xp_awarded: number | null
        }
        Insert: {
          activated_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          discovered_at?: string | null
          estimated_review_time?: unknown
          id?: string
          queue_reason?: string | null
          queued_at?: string | null
          signal_id: string
          sp_awarded?: Json | null
          status?: string
          submission_data?: Json | null
          submission_notes?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          validated_by?: string | null
          validation_feedback?: string | null
          validation_result?: Json | null
          xp_awarded?: number | null
        }
        Update: {
          activated_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          discovered_at?: string | null
          estimated_review_time?: unknown
          id?: string
          queue_reason?: string | null
          queued_at?: string | null
          signal_id?: string
          sp_awarded?: Json | null
          status?: string
          submission_data?: Json | null
          submission_notes?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          validated_by?: string | null
          validation_feedback?: string | null
          validation_result?: Json | null
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_signals_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          codex_name: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
        }
        Insert: {
          codex_name?: string | null
          created_at?: string
          email: string
          id: string
          is_admin?: boolean | null
        }
        Update: {
          codex_name?: string | null
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      hub_stats: {
        Row: {
          incoming_links_count: number | null
          note_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_to_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "atomic_notes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_atom_questions: {
        Args: { atom_id: string }
        Returns: {
          author_id: string
          created_at: string
          is_resolved: boolean
          question_body: string
          question_id: string
          question_title: string
        }[]
      }
      get_question_replies: {
        Args: { question_id: string }
        Returns: {
          atom_body: string
          atom_id: string
          atom_title: string
          author_id: string
          created_at: string
          relation_type: string
        }[]
      }
      increment_question_views: {
        Args: { question_id: string }
        Returns: undefined
      }
      match_notes: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          body: string
          created_at: string
          id: string
          similarity: number
          title: string
        }[]
      }
      moderate_atom: {
        Args: {
          new_status: Database["public"]["Enums"]["moderation_status"]
          should_hide: boolean
          target_atom_id: string
        }
        Returns: undefined
      }
      search_similar_questions: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          body: string
          id: string
          similarity: number
          title: string
        }[]
      }
    }
    Enums: {
      moderation_status:
        | "pending"
        | "approved"
        | "flagged"
        | "rejected"
        | "draft"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      moderation_status: [
        "pending",
        "approved",
        "flagged",
        "rejected",
        "draft",
      ],
    },
  },
} as const
