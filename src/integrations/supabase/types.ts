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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alumbrado_db: {
        Row: {
          content: string | null
          embedding: string | null
          fts: unknown | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          fts?: unknown | null
          id?: never
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          fts?: unknown | null
          id?: never
          metadata?: Json | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      File_Manager: {
        Row: {
          created_at: string
          file_id: string
          file_name: string
          file_type: string
          hash: string
          id: number
          Resumen: string | null
          Tema: string | null
        }
        Insert: {
          created_at?: string
          file_id: string
          file_name: string
          file_type: string
          hash: string
          id?: number
          Resumen?: string | null
          Tema?: string | null
        }
        Update: {
          created_at?: string
          file_id?: string
          file_name?: string
          file_type?: string
          hash?: string
          id?: number
          Resumen?: string | null
          Tema?: string | null
        }
        Relationships: []
      }
      File_Manager_Webages: {
        Row: {
          created_at: string
          hash: string
          id: number
          Resumen: string | null
          Tema: string | null
          url: string
        }
        Insert: {
          created_at?: string
          hash: string
          id?: number
          Resumen?: string | null
          Tema?: string | null
          url: string
        }
        Update: {
          created_at?: string
          hash?: string
          id?: number
          Resumen?: string | null
          Tema?: string | null
          url?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          course_id: string
          created_at: string
          date: string
          id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          date: string
          id?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      golf_courses: {
        Row: {
          created_at: string
          handicaps_blue: number[]
          handicaps_red: number[]
          handicaps_white: number[]
          holes: number
          id: string
          name: string
          par: number[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          handicaps_blue: number[]
          handicaps_red: number[]
          handicaps_white: number[]
          holes?: number
          id?: string
          name: string
          par: number[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          handicaps_blue?: number[]
          handicaps_red?: number[]
          handicaps_white?: number[]
          holes?: number
          id?: string
          name?: string
          par?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      hole_results: {
        Row: {
          created_at: string
          hole: number
          id: string
          net_strokes: number
          player_id: string
          putts: number
          session_id: string
          strokes: number
        }
        Insert: {
          created_at?: string
          hole: number
          id?: string
          net_strokes: number
          player_id: string
          putts: number
          session_id: string
          strokes: number
        }
        Update: {
          created_at?: string
          hole?: number
          id?: string
          net_strokes?: number
          player_id?: string
          putts?: number
          session_id?: string
          strokes?: number
        }
        Relationships: [
          {
            foreignKeyName: "hole_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hole_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      info_files: {
        Row: {
          content: string | null
          embedding: string | null
          fts: unknown | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          fts?: unknown | null
          id?: never
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          fts?: unknown | null
          id?: never
          metadata?: Json | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_erros: {
        Row: {
          created_at: string
          Descripcion: string
          id: number
          Ultimo_Nodo: string
          url: string
          Workflow: string
        }
        Insert: {
          created_at?: string
          Descripcion: string
          id?: number
          Ultimo_Nodo: string
          url: string
          Workflow: string
        }
        Update: {
          created_at?: string
          Descripcion?: string
          id?: number
          Ultimo_Nodo?: string
          url?: string
          Workflow?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          code: string
          created_at: string
          first_name: string
          handicap: number
          id: string
          last_name: string
          tee_color: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          first_name: string
          handicap: number
          id?: string
          last_name: string
          tee_color: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          first_name?: string
          handicap?: number
          id?: string
          last_name?: string
          tee_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      Record_Manager: {
        Row: {
          created_at: string
          File_Id: string
          File_Name: string
          hash: string
          id: number
          Type: string | null
        }
        Insert: {
          created_at?: string
          File_Id: string
          File_Name: string
          hash: string
          id?: number
          Type?: string | null
        }
        Update: {
          created_at?: string
          File_Id?: string
          File_Name?: string
          hash?: string
          id?: number
          Type?: string | null
        }
        Relationships: []
      }
      session_players: {
        Row: {
          created_at: string
          handicap: number
          id: string
          player_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          handicap?: number
          id?: string
          player_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          handicap?: number
          id?: string
          player_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      hybrid_search: {
        Args: {
          full_text_weight?: number
          match_count: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          combined_rank: number
          content: string
          full_text_rank: number
          id: number
          metadata: Json
          semantic_rank: number
        }[]
      }
      hybrid_seek1: {
        Args: {
          full_text_weight?: number
          match_count: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          combined_rank: number
          content: string
          full_text_rank: number
          id: number
          metadata: Json
          semantic_rank: number
        }[]
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
