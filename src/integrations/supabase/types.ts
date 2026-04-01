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
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      customers: {
        Row: {
          active_city: string | null
          address_city: string | null
          address_complement: string | null
          address_country: string | null
          address_district: string | null
          address_line: string | null
          address_number: string | null
          address_state: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          type: string
          unit_id: string
          updated_at: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          active_city?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_district?: string | null
          address_line?: string | null
          address_number?: string | null
          address_state?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          type?: string
          unit_id: string
          updated_at?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          active_city?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_district?: string | null
          address_line?: string | null
          address_number?: string | null
          address_state?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          type?: string
          unit_id?: string
          updated_at?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      exports_log: {
        Row: {
          accepted_at: string
          accepted_privacy_terms: boolean
          created_at: string | null
          export_type: string
          filters_used: Json | null
          id: string
          requested_by_user_id: string
          unit_id: string | null
        }
        Insert: {
          accepted_at: string
          accepted_privacy_terms: boolean
          created_at?: string | null
          export_type: string
          filters_used?: Json | null
          id?: string
          requested_by_user_id: string
          unit_id?: string | null
        }
        Update: {
          accepted_at?: string
          accepted_privacy_terms?: boolean
          created_at?: string | null
          export_type?: string
          filters_used?: Json | null
          id?: string
          requested_by_user_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exports_log_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      file_status_history: {
        Row: {
          alterado_por: string
          arquivo_id: string
          created_at: string
          id: string
          observacao: string | null
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          alterado_por: string
          arquivo_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          alterado_por?: string
          arquivo_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          category: string
          competency_date: string
          created_at: string
          description: string | null
          entry_type: string
          franchise_profile_id: string | null
          id: string
          order_id: string | null
          scope: string
        }
        Insert: {
          amount?: number
          category: string
          competency_date?: string
          created_at?: string
          description?: string | null
          entry_type: string
          franchise_profile_id?: string | null
          id?: string
          order_id?: string | null
          scope: string
        }
        Update: {
          amount?: number
          category?: string
          competency_date?: string
          created_at?: string
          description?: string | null
          entry_type?: string
          franchise_profile_id?: string | null
          id?: string
          order_id?: string | null
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_franchise_profile_id_fkey"
            columns: ["franchise_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_franchisees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          product_snapshot: Json | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          internal_note: string | null
          new_status: string
          order_id: string
          previous_status: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          internal_note?: string | null
          new_status: string
          order_id: string
          previous_status?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          internal_note?: string | null
          new_status?: string
          order_id?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: Json | null
          discount_amount: number
          franchise_profile_id: string
          fulfillment_status: string
          id: string
          items_count: number
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_note: string | null
          payment_status: string
          shipping_amount: number
          status: string
          subtotal: number
          total_amount: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_address?: Json | null
          discount_amount?: number
          franchise_profile_id: string
          fulfillment_status?: string
          id?: string
          items_count?: number
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_note?: string | null
          payment_status?: string
          shipping_amount?: number
          status?: string
          subtotal?: number
          total_amount?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_address?: Json | null
          discount_amount?: number
          franchise_profile_id?: string
          fulfillment_status?: string
          id?: string
          items_count?: number
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_note?: string | null
          payment_status?: string
          shipping_amount?: number
          status?: string
          subtotal?: number
          total_amount?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_franchise_profile_id_fkey"
            columns: ["franchise_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_franchisees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      plate_lookup_cache: {
        Row: {
          country: string | null
          created_at: string
          expires_at: string
          id: string
          payload: Json
          plate: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          payload: Json
          plate: string
        }
        Update: {
          country?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          payload?: Json
          plate?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          available: boolean
          brand: string
          category: string | null
          created_at: string
          description_full: string | null
          description_short: string | null
          dimensions_mm: string | null
          id: string
          image_url: string | null
          models: string[] | null
          name: string
          price: number
          promo_price: number | null
          promo_type: string | null
          promo_value: number | null
          ref: string | null
          sku: string
          specifications: string[] | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          available?: boolean
          brand?: string
          category?: string | null
          created_at?: string
          description_full?: string | null
          description_short?: string | null
          dimensions_mm?: string | null
          id?: string
          image_url?: string | null
          models?: string[] | null
          name: string
          price?: number
          promo_price?: number | null
          promo_type?: string | null
          promo_value?: number | null
          ref?: string | null
          sku: string
          specifications?: string[] | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          available?: boolean
          brand?: string
          category?: string | null
          created_at?: string
          description_full?: string | null
          description_short?: string | null
          dimensions_mm?: string | null
          id?: string
          image_url?: string | null
          models?: string[] | null
          name?: string
          price?: number
          promo_price?: number | null
          promo_type?: string | null
          promo_value?: number | null
          ref?: string | null
          sku?: string
          specifications?: string[] | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles_franchisees: {
        Row: {
          address_number: string | null
          allow_manual_credits: boolean | null
          cidade: string | null
          cnpj: string | null
          complement: string | null
          contract_expiration_date: string | null
          contract_type: string | null
          cpf: string | null
          created_at: string | null
          delivery_address: Json | null
          display_name: string | null
          district: string | null
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
          phone: string | null
          rental_value_brl: number | null
          requires_password_reset: boolean | null
          service_areas: Json | null
          start_date: string | null
          state: string | null
          street: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address_number?: string | null
          allow_manual_credits?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          complement?: string | null
          contract_expiration_date?: string | null
          contract_type?: string | null
          cpf?: string | null
          created_at?: string | null
          delivery_address?: Json | null
          display_name?: string | null
          district?: string | null
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
          phone?: string | null
          rental_value_brl?: number | null
          requires_password_reset?: boolean | null
          service_areas?: Json | null
          start_date?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address_number?: string | null
          allow_manual_credits?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          complement?: string | null
          contract_expiration_date?: string | null
          contract_type?: string | null
          cpf?: string | null
          created_at?: string | null
          delivery_address?: Json | null
          display_name?: string | null
          district?: string | null
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
          phone?: string | null
          rental_value_brl?: number | null
          requires_password_reset?: boolean | null
          service_areas?: Json | null
          start_date?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      received_files: {
        Row: {
          arquivo_modificado_nome: string | null
          arquivo_modificado_url: string | null
          arquivo_original_nome: string | null
          arquivo_original_url: string | null
          categorias: string[] | null
          created_at: string
          customer_id: string | null
          descricao: string | null
          horas_km: string | null
          id: string
          manual_vehicle_data: boolean | null
          marca: string | null
          modelo: string | null
          placa: string
          plate_lookup_at: string | null
          plate_lookup_payload: Json | null
          plate_lookup_success: boolean | null
          plate_lookup_unit_id: string | null
          plate_lookup_user_id: string | null
          servico: string
          status: string
          unit_id: string
          updated_at: string
          valor_brl: number | null
          vehicle_id: string | null
        }
        Insert: {
          arquivo_modificado_nome?: string | null
          arquivo_modificado_url?: string | null
          arquivo_original_nome?: string | null
          arquivo_original_url?: string | null
          categorias?: string[] | null
          created_at?: string
          customer_id?: string | null
          descricao?: string | null
          horas_km?: string | null
          id?: string
          manual_vehicle_data?: boolean | null
          marca?: string | null
          modelo?: string | null
          placa: string
          plate_lookup_at?: string | null
          plate_lookup_payload?: Json | null
          plate_lookup_success?: boolean | null
          plate_lookup_unit_id?: string | null
          plate_lookup_user_id?: string | null
          servico: string
          status?: string
          unit_id: string
          updated_at?: string
          valor_brl?: number | null
          vehicle_id?: string | null
        }
        Update: {
          arquivo_modificado_nome?: string | null
          arquivo_modificado_url?: string | null
          arquivo_original_nome?: string | null
          arquivo_original_url?: string | null
          categorias?: string[] | null
          created_at?: string
          customer_id?: string | null
          descricao?: string | null
          horas_km?: string | null
          id?: string
          manual_vehicle_data?: boolean | null
          marca?: string | null
          modelo?: string | null
          placa?: string
          plate_lookup_at?: string | null
          plate_lookup_payload?: Json | null
          plate_lookup_success?: boolean | null
          plate_lookup_unit_id?: string | null
          plate_lookup_user_id?: string | null
          servico?: string
          status?: string
          unit_id?: string
          updated_at?: string
          valor_brl?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "received_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "received_files_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "received_files_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          amount_brl: number | null
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          protocol: string | null
          service_type: string
          status: string | null
          unit_id: string
          vehicle_id: string | null
        }
        Insert: {
          amount_brl?: number | null
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          protocol?: string | null
          service_type: string
          status?: string | null
          unit_id: string
          vehicle_id?: string | null
        }
        Update: {
          amount_brl?: number | null
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          protocol?: string | null
          service_type?: string
          status?: string | null
          unit_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          franchisee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          state: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          franchisee_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          state?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          franchisee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_franchisee_id_fkey"
            columns: ["franchisee_id"]
            isOneToOne: false
            referencedRelation: "profiles_franchisees"
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
      vehicles: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          customer_id: string
          engine: string | null
          id: string
          model: string | null
          plate: string | null
          unit_id: string
          year: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          customer_id: string
          engine?: string | null
          id?: string
          model?: string | null
          plate?: string | null
          unit_id: string
          year?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          customer_id?: string
          engine?: string | null
          id?: string
          model?: string | null
          plate?: string | null
          unit_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_unit_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_franchisor_admin: { Args: { _user_id: string }; Returns: boolean }
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
