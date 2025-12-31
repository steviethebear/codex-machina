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
          created_at: string
          description: string
          icon: string | null
          id: string
          key: string
          name: string
          requirement_metadata: Json | null
          requirement_type: string
          requirement_value: number | null
          rewards: Json | null
          tier: number
          xp_reward: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          key: string
          name: string
          requirement_metadata?: Json | null
          requirement_type: string
          requirement_value?: number | null
          rewards?: Json | null
          tier?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          key?: string
          name?: string
          requirement_metadata?: Json | null
          requirement_type?: string
          requirement_value?: number | null
          rewards?: Json | null
          tier?: number
          xp_reward?: number
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
      comments: {
        Row: {
          content: string
          created_at: string
          highlighted_text: string | null
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          highlighted_text?: string | null
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          highlighted_text?: string | null
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          context: string
          created_at: string
          id: string
          source_note_id: string
          target_note_id: string
          user_id: string
        }
        Insert: {
          context: string
          created_at?: string
          id?: string
          source_note_id: string
          target_note_id: string
          user_id: string
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          source_note_id?: string
          target_note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          citation: string | null
          content: string
          created_at: string
          embedding: string | null
          id: string
          is_public: boolean
          page_number: string | null
          title: string
          type: Database["public"]["Enums"]["note_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          citation?: string | null
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          is_public?: boolean
          page_number?: string | null
          title: string
          type: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          citation?: string | null
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          is_public?: boolean
          page_number?: string | null
          title?: string
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      points: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
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
      texts: {
        Row: {
          archived: boolean | null
          author: string
          created_at: string
          created_by: string | null
          id: string
          rejection_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          archived?: boolean | null
          author: string
          created_at?: string
          created_by?: string | null
          id?: string
          rejection_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          type: string
        }
        Update: {
          archived?: boolean | null
          author?: string
          created_at?: string
          created_by?: string | null
          id?: string
          rejection_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "texts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "texts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_notes: {
        Row: {
          created_at: string | null
          group_label: string | null
          id: string
          note_id: string
          position: number
          thread_id: string
        }
        Insert: {
          created_at?: string | null
          group_label?: string | null
          id?: string
          note_id: string
          position: number
          thread_id: string
        }
        Update: {
          created_at?: string | null
          group_label?: string | null
          id?: string
          note_id?: string
          position?: number
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_notes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      unlocks: {
        Row: {
          check_metadata: Json | null
          feature: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          check_metadata?: Json | null
          feature: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          check_metadata?: Json | null
          feature?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number | null
          unlocked_at?: string
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
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      delete_user_data: { Args: { target_user_id: string }; Returns: undefined }
      get_admin_notes: { Args: { target_user_id: string }; Returns: Json }
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
      match_notes:
      | {
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
      | {
        Args: {
          match_count: number
          match_threshold: number
          msg_user_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
          type: string
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
      note_type: "fleeting" | "permanent" | "source"
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
      note_type: ["fleeting", "permanent", "source"],
    },
  },
} as const
