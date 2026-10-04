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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          business_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          session_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          session_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          limits: Json
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          limits?: Json
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          limits?: Json
          name?: string
        }
        Relationships: []
      }
      business_services: {
        Row: {
          active: boolean
          business_id: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
          vocabulary: Json
        }
        Insert: {
          active?: boolean
          business_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          vocabulary?: Json
        }
        Update: {
          active?: boolean
          business_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          vocabulary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subscriptions: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "business_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          accent_color: string | null
          address_line: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          google_review_url: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          phone: string | null
          postal_code: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["business_status"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          address_line?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          google_review_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean
          phone?: string | null
          postal_code?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          address_line?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          google_review_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          phone?: string | null
          postal_code?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      google_connections: {
        Row: {
          business_id: string
          created_at: string
          id: string
          metadata: Json
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      google_locations: {
        Row: {
          business_id: string
          connection_id: string | null
          created_at: string
          external_id: string | null
          id: string
          name: string | null
        }
        Insert: {
          business_id: string
          connection_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          business_id?: string
          connection_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_locations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      google_review_replies: {
        Row: {
          business_id: string
          created_at: string
          id: string
          reply_text: string | null
          review_id: string | null
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          reply_text?: string | null
          review_id?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          reply_text?: string | null
          review_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_review_replies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "google_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      google_reviews: {
        Row: {
          author_name: string | null
          business_id: string
          comment: string | null
          created_at: string
          external_id: string | null
          id: string
          location_id: string | null
          published_at: string | null
          rating: number | null
        }
        Insert: {
          author_name?: string | null
          business_id: string
          comment?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          location_id?: string | null
          published_at?: string | null
          rating?: number | null
        }
        Update: {
          author_name?: string | null
          business_id?: string
          comment?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          location_id?: string | null
          published_at?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "google_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "google_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          system_role: Database["public"]["Enums"]["system_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          system_role?: Database["public"]["Enums"]["system_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          system_role?: Database["public"]["Enums"]["system_role"]
          updated_at?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          business_id: string
          code: string
          created_at: string
          destination_slug: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          destination_slug: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          destination_slug?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      review_generations: {
        Row: {
          business_id: string
          copied_at: string | null
          created_at: string
          edited: boolean
          generation_number: number
          google_clicked_at: string | null
          id: string
          language: Database["public"]["Enums"]["review_language"]
          normalized_text: string
          review_hash: string
          review_length: Database["public"]["Enums"]["review_length"]
          review_text: string
          session_id: string
          structure_signature: string
        }
        Insert: {
          business_id: string
          copied_at?: string | null
          created_at?: string
          edited?: boolean
          generation_number?: number
          google_clicked_at?: string | null
          id?: string
          language: Database["public"]["Enums"]["review_language"]
          normalized_text: string
          review_hash: string
          review_length: Database["public"]["Enums"]["review_length"]
          review_text: string
          session_id: string
          structure_signature: string
        }
        Update: {
          business_id?: string
          copied_at?: string | null
          created_at?: string
          edited?: boolean
          generation_number?: number
          google_clicked_at?: string | null
          id?: string
          language?: Database["public"]["Enums"]["review_language"]
          normalized_text?: string
          review_hash?: string
          review_length?: Database["public"]["Enums"]["review_length"]
          review_text?: string
          session_id?: string
          structure_signature?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_generations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_generations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_sessions: {
        Row: {
          business_id: string
          completed_at: string | null
          created_at: string
          customer_note: string | null
          experience_rating:
            | Database["public"]["Enums"]["experience_rating"]
            | null
          id: string
          qr_code_id: string | null
          selected_attributes: Json
          selected_language:
            | Database["public"]["Enums"]["review_language"]
            | null
          selected_service_ids: Json
          session_token: string
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          created_at?: string
          customer_note?: string | null
          experience_rating?:
            | Database["public"]["Enums"]["experience_rating"]
            | null
          id?: string
          qr_code_id?: string | null
          selected_attributes?: Json
          selected_language?:
            | Database["public"]["Enums"]["review_language"]
            | null
          selected_service_ids?: Json
          session_token: string
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          created_at?: string
          customer_note?: string | null
          experience_rating?:
            | Database["public"]["Enums"]["experience_rating"]
            | null
          id?: string
          qr_code_id?: string | null
          selected_attributes?: Json
          selected_language?:
            | Database["public"]["Enums"]["review_language"]
            | null
          selected_service_ids?: Json
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_sessions_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      review_settings: {
        Row: {
          allow_english: boolean
          allow_hindi: boolean
          allow_hinglish: boolean
          allow_regenerate: boolean
          business_id: string
          created_at: string
          customer_headline: string
          customer_subheadline: string
          default_language: Database["public"]["Enums"]["review_language"]
          default_length: Database["public"]["Enums"]["review_length"]
          google_cta_text: string
          id: string
          selectable_attributes: Json
          show_optional_note: boolean
          updated_at: string
        }
        Insert: {
          allow_english?: boolean
          allow_hindi?: boolean
          allow_hinglish?: boolean
          allow_regenerate?: boolean
          business_id: string
          created_at?: string
          customer_headline?: string
          customer_subheadline?: string
          default_language?: Database["public"]["Enums"]["review_language"]
          default_length?: Database["public"]["Enums"]["review_length"]
          google_cta_text?: string
          id?: string
          selectable_attributes?: Json
          show_optional_note?: boolean
          updated_at?: string
        }
        Update: {
          allow_english?: boolean
          allow_hindi?: boolean
          allow_hinglish?: boolean
          allow_regenerate?: boolean
          business_id?: string
          created_at?: string
          customer_headline?: string
          customer_subheadline?: string
          default_language?: Database["public"]["Enums"]["review_language"]
          default_length?: Database["public"]["Enums"]["review_length"]
          google_cta_text?: string
          id?: string
          selectable_attributes?: Json
          show_optional_note?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      template_fragments: {
        Row: {
          active: boolean
          attribute_key: string | null
          business_id: string | null
          content: string
          created_at: string
          fragment_type: string
          id: string
          language: Database["public"]["Enums"]["review_language"]
          last_used_at: string | null
          sentiment: string | null
          service_category: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          active?: boolean
          attribute_key?: string | null
          business_id?: string | null
          content: string
          created_at?: string
          fragment_type: string
          id?: string
          language: Database["public"]["Enums"]["review_language"]
          last_used_at?: string | null
          sentiment?: string | null
          service_category?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          active?: boolean
          attribute_key?: string | null
          business_id?: string | null
          content?: string
          created_at?: string
          fragment_type?: string
          id?: string
          language?: Database["public"]["Enums"]["review_language"]
          last_used_at?: string | null
          sentiment?: string | null
          service_category?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_fragments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_business_active: { Args: { _business_id: string }; Returns: boolean }
      is_business_member: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      public_business_status: { Args: { _slug: string }; Returns: string }
      start_review_session: {
        Args: { _business_id: string; _service_ids: Json; _from_qr: boolean }
        Returns: string
      }
      recent_review_signatures: {
        Args: { _business_id: string; _limit: number }
        Returns: { review_hash: string; normalized_text: string }[]
      }
      save_review_generation: {
        Args: {
          _session_id: string
          _review_text: string
          _normalized_text: string
          _review_hash: string
          _language: Database["public"]["Enums"]["review_language"]
          _review_length: Database["public"]["Enums"]["review_length"]
          _structure_signature: string
        }
        Returns: string
      }
      mark_review_generation: {
        Args: { _generation_id: string; _action: string; _text: string | null }
        Returns: boolean
      }
      record_fragment_usage: {
        Args: {
          _language: Database["public"]["Enums"]["review_language"]
          _fragment_type: string
          _content: string
          _attribute_key: string | null
        }
        Returns: undefined
      }
      update_review_session: {
        Args: {
          _session_id: string
          _experience: Database["public"]["Enums"]["experience_rating"]
          _attributes: Json
          _note: string | null
          _language: Database["public"]["Enums"]["review_language"]
        }
        Returns: boolean
      }
      unique_business_slug: { Args: { _base: string }; Returns: string }
    }
    Enums: {
      business_status: "active" | "paused" | "inactive"
      experience_rating: "excellent" | "good" | "average" | "not_good"
      member_role: "business_owner" | "business_staff" | "business_admin"
      review_language: "english" | "hinglish" | "hindi"
      review_length: "short" | "medium" | "detailed"
      system_role: "user" | "super_admin"
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
      business_status: ["active", "paused", "inactive"],
      experience_rating: ["excellent", "good", "average", "not_good"],
      member_role: ["business_owner", "business_staff", "business_admin"],
      review_language: ["english", "hinglish", "hindi"],
      review_length: ["short", "medium", "detailed"],
      system_role: ["user", "super_admin"],
    },
  },
} as const
