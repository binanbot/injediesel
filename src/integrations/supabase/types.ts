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
      cities_reference: {
        Row: {
          city: string
          country: string
          id: string
          search_key: string
          state: string
        }
        Insert: {
          city: string
          country: string
          id: string
          search_key: string
          state: string
        }
        Update: {
          city?: string
          country?: string
          id?: string
          search_key?: string
          state?: string
        }
        Relationships: []
      }
      contract_history: {
        Row: {
          contract_type: string
          created_at: string
          end_date: string
          franqueado_id: string
          id: string
          notes: string | null
          renewal_date: string | null
          start_date: string
          status: string
        }
        Insert: {
          contract_type?: string
          created_at?: string
          end_date: string
          franqueado_id: string
          id?: string
          notes?: string | null
          renewal_date?: string | null
          start_date: string
          status?: string
        }
        Update: {
          contract_type?: string
          created_at?: string
          end_date?: string
          franqueado_id?: string
          id?: string
          notes?: string | null
          renewal_date?: string | null
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      correction_tickets: {
        Row: {
          arquivo_anexo_url: string | null
          arquivo_id: string
          conversation_id: string | null
          created_at: string
          franqueado_id: string
          id: string
          motivo: string
          status: string
          updated_at: string
        }
        Insert: {
          arquivo_anexo_url?: string | null
          arquivo_id: string
          conversation_id?: string | null
          created_at?: string
          franqueado_id: string
          id?: string
          motivo: string
          status?: string
          updated_at?: string
        }
        Update: {
          arquivo_anexo_url?: string | null
          arquivo_id?: string
          conversation_id?: string | null
          created_at?: string
          franqueado_id?: string
          id?: string
          motivo?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "correction_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      franchisee_profiles: {
        Row: {
          contract_expiration_date: string
          created_at: string
          empresa: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_expiration_date?: string
          created_at?: string
          empresa?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_expiration_date?: string
          created_at?: string
          empresa?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles_franchisees: {
        Row: {
          allow_manual_credits: boolean | null
          cidade: string | null
          cnpj: string | null
          contract_expiration_date: string | null
          contract_type: string | null
          cpf: string | null
          created_at: string | null
          display_name: string | null
          email: string
          equipment_type: string | null
          first_name: string | null
          id: string
          is_prepaid: boolean | null
          kess_expires_at: string | null
          kess_serial: string | null
          ktag_expires_at: string | null
          ktag_serial: string | null
          last_name: string | null
          legacy_role: string | null
          legacy_source_user_id: string | null
          legacy_user_login: string | null
          legacy_user_pass_hash: string | null
          legacy_user_registered_at: string | null
          rental_value_brl: number | null
          requires_password_reset: boolean | null
          service_areas: Json | null
          start_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allow_manual_credits?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          contract_expiration_date?: string | null
          contract_type?: string | null
          cpf?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          equipment_type?: string | null
          first_name?: string | null
          id?: string
          is_prepaid?: boolean | null
          kess_expires_at?: string | null
          kess_serial?: string | null
          ktag_expires_at?: string | null
          ktag_serial?: string | null
          last_name?: string | null
          legacy_role?: string | null
          legacy_source_user_id?: string | null
          legacy_user_login?: string | null
          legacy_user_pass_hash?: string | null
          legacy_user_registered_at?: string | null
          rental_value_brl?: number | null
          requires_password_reset?: boolean | null
          service_areas?: Json | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allow_manual_credits?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          contract_expiration_date?: string | null
          contract_type?: string | null
          cpf?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          equipment_type?: string | null
          first_name?: string | null
          id?: string
          is_prepaid?: boolean | null
          kess_expires_at?: string | null
          kess_serial?: string | null
          ktag_expires_at?: string | null
          ktag_serial?: string | null
          last_name?: string | null
          legacy_role?: string | null
          legacy_source_user_id?: string | null
          legacy_user_login?: string | null
          legacy_user_pass_hash?: string | null
          legacy_user_registered_at?: string | null
          rental_value_brl?: number | null
          requires_password_reset?: boolean | null
          service_areas?: Json | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          franqueado_id: string
          id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          franqueado_id: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          franqueado_id?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "suporte" | "franqueado"
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
      app_role: ["admin", "suporte", "franqueado"],
    },
  },
} as const
