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
    PostgrestVersion: "14.1"
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
      note_tags: {
        Row: {
          created_at: string
          id: string
          note_id: string
          tag: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          tag: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          tag?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
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
      reflections: {
        Row: {
          completed_at: string | null
          context: string
          created_at: string
          id: string
          messages: Json
          status: string
          student_id: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          context: string
          created_at?: string
          id?: string
          messages?: Json
          status?: string
          student_id: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          context?: string
          created_at?: string
          id?: string
          messages?: Json
          status?: string
          student_id?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflections_teacher_id_fkey"
            columns: ["teacher_id"]
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
          created_by: string | null
          description: string | null
          id: string
          rejection_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          archived?: boolean | null
          author: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          rejection_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          type: string
          url?: string | null
        }
        Update: {
          archived?: boolean | null
          author?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          rejection_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          type?: string
          url?: string | null
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
      users: {
        Row: {
          codex_name: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          class_section: string | null
          teacher: string | null
        }
        Insert: {
          codex_name?: string | null
          created_at?: string
          email: string
          id: string
          is_admin?: boolean | null
          class_section?: string | null
          teacher?: string | null
        }
        Update: {
          codex_name?: string | null
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean | null
          class_section?: string | null
          teacher?: string | null
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
            foreignKeyName: "connections_target_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_global_tag_trends: {
        Args: never
        Returns: {
          count: number
          tag: string
        }[]
      }
      get_user_tags: {
        Args: { p_user_id: string }
        Returns: {
          count: number
          tag: string
        }[]
      }
    }
    Enums: {
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
      note_type: ["fleeting", "permanent", "source"],
    },
  },
} as const
