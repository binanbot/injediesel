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
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          module: string
          target_id: string | null
          target_type: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module: string
          target_id?: string | null
          target_type?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module?: string
          target_id?: string | null
          target_type?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      commission_closings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          commission_type: string
          commission_value: number
          company_id: string
          created_at: string
          estimated_commission: number
          files_count: number
          files_revenue: number
          id: string
          notes: string | null
          orders_count: number
          orders_revenue: number
          paid_at: string | null
          paid_by: string | null
          period_end: string
          period_start: string
          period_status: string
          realized_commission: number
          seller_profile_id: string
          status: string
          total_revenue: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          commission_type?: string
          commission_value?: number
          company_id: string
          created_at?: string
          estimated_commission?: number
          files_count?: number
          files_revenue?: number
          id?: string
          notes?: string | null
          orders_count?: number
          orders_revenue?: number
          paid_at?: string | null
          paid_by?: string | null
          period_end: string
          period_start: string
          period_status?: string
          realized_commission?: number
          seller_profile_id: string
          status?: string
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          commission_type?: string
          commission_value?: number
          company_id?: string
          created_at?: string
          estimated_commission?: number
          files_count?: number
          files_revenue?: number
          id?: string
          notes?: string | null
          orders_count?: number
          orders_revenue?: number
          paid_at?: string | null
          paid_by?: string | null
          period_end?: string
          period_start?: string
          period_status?: string
          realized_commission?: number
          seller_profile_id?: string
          status?: string
          total_revenue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_closings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_closings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          brand_name: string | null
          branding: Json
          cnpj: string | null
          contacts: Json
          created_at: string
          enabled_modules: string[]
          id: string
          is_active: boolean
          name: string
          settings: Json
          slug: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          branding?: Json
          cnpj?: string | null
          contacts?: Json
          created_at?: string
          enabled_modules?: string[]
          id?: string
          is_active?: boolean
          name: string
          settings?: Json
          slug: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          branding?: Json
          cnpj?: string | null
          contacts?: Json
          created_at?: string
          enabled_modules?: string[]
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json
          slug?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_domains: {
        Row: {
          channel_type: string
          company_id: string
          created_at: string
          environment: string
          hostname: string
          id: string
          is_active: boolean
          is_primary: boolean
        }
        Insert: {
          channel_type?: string
          company_id: string
          created_at?: string
          environment?: string
          hostname: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
        }
        Update: {
          channel_type?: string
          company_id?: string
          created_at?: string
          environment?: string
          hostname?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "company_domains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          type: string
          unit_id: string
          updated_at: string | null
          updated_by: string | null
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
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          type?: string
          unit_id: string
          updated_at?: string | null
          updated_by?: string | null
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
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          type?: string
          unit_id?: string
          updated_at?: string | null
          updated_by?: string | null
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
      departments: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          display_name: string | null
          hired_at: string | null
          id: string
          is_active: boolean
          job_position_id: string | null
          notes: string | null
          permission_profile_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          hired_at?: string | null
          id?: string
          is_active?: boolean
          job_position_id?: string | null
          notes?: string | null
          permission_profile_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          display_name?: string | null
          hired_at?: string | null
          id?: string
          is_active?: boolean
          job_position_id?: string | null
          notes?: string | null
          permission_profile_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_job_position_id_fkey"
            columns: ["job_position_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_permission_profile_id_fkey"
            columns: ["permission_profile_id"]
            isOneToOne: false
            referencedRelation: "permission_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_goals: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          metric_key: string
          objective_label: string
          period_end: string
          period_start: string
          target_value: number
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metric_key: string
          objective_label?: string
          period_end: string
          period_start: string
          target_value?: number
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metric_key?: string
          objective_label?: string
          period_end?: string
          period_start?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      job_positions: {
        Row: {
          company_id: string
          created_at: string
          default_permission_profile_id: string | null
          department_id: string | null
          hierarchy_level: number
          id: string
          is_active: boolean
          scope: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          default_permission_profile_id?: string | null
          department_id?: string | null
          hierarchy_level?: number
          id?: string
          is_active?: boolean
          scope?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          default_permission_profile_id?: string | null
          department_id?: string | null
          hierarchy_level?: number
          id?: string
          is_active?: boolean
          scope?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_positions_default_permission_profile_id_fkey"
            columns: ["default_permission_profile_id"]
            isOneToOne: false
            referencedRelation: "permission_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
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
          sale_type: string | null
          seller_profile_id: string | null
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
          sale_type?: string | null
          seller_profile_id?: string | null
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
          sale_type?: string | null
          seller_profile_id?: string | null
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
            foreignKeyName: "orders_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
      permission_profiles: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system_default: boolean
          name: string
          permissions: Json
          slug: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_default?: boolean
          name: string
          permissions?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_default?: boolean
          name?: string
          permissions?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          seller_profile_id: string | null
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
          seller_profile_id?: string | null
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
          seller_profile_id?: string | null
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
            foreignKeyName: "received_files_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
      sales_targets: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          metric_key: string
          period_end: string
          period_start: string
          sale_type: string
          seller_profile_id: string | null
          target_value: number
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metric_key?: string
          period_end: string
          period_start: string
          sale_type?: string
          seller_profile_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metric_key?: string
          period_end?: string
          period_start?: string
          sale_type?: string
          seller_profile_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          can_bill: boolean
          can_sell_ecu: boolean
          can_sell_parts: boolean
          can_sell_services: boolean
          commission_enabled: boolean
          commission_type: string
          commission_value: number
          created_at: string
          employee_profile_id: string
          id: string
          is_active: boolean
          max_discount_pct: number
          notes: string | null
          sales_channel_mode: string
          seller_mode: string
          target_enabled: boolean
          target_monthly: number | null
          updated_at: string
        }
        Insert: {
          can_bill?: boolean
          can_sell_ecu?: boolean
          can_sell_parts?: boolean
          can_sell_services?: boolean
          commission_enabled?: boolean
          commission_type?: string
          commission_value?: number
          created_at?: string
          employee_profile_id: string
          id?: string
          is_active?: boolean
          max_discount_pct?: number
          notes?: string | null
          sales_channel_mode?: string
          seller_mode?: string
          target_enabled?: boolean
          target_monthly?: number | null
          updated_at?: string
        }
        Update: {
          can_bill?: boolean
          can_sell_ecu?: boolean
          can_sell_parts?: boolean
          can_sell_services?: boolean
          commission_enabled?: boolean
          commission_type?: string
          commission_value?: number
          created_at?: string
          employee_profile_id?: string
          id?: string
          is_active?: boolean
          max_discount_pct?: number
          notes?: string | null
          sales_channel_mode?: string
          seller_mode?: string
          target_enabled?: boolean
          target_monthly?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_employee_profile_id_fkey"
            columns: ["employee_profile_id"]
            isOneToOne: true
            referencedRelation: "employee_profiles"
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
          sale_type: string | null
          seller_profile_id: string | null
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
          sale_type?: string | null
          seller_profile_id?: string | null
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
          sale_type?: string | null
          seller_profile_id?: string | null
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
            foreignKeyName: "services_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          category: string | null
          chassis: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          engine: string | null
          fuel: string | null
          id: string
          is_active: boolean
          model: string | null
          model_year: number | null
          notes: string | null
          plate: string | null
          transmission: string | null
          unit_id: string
          updated_at: string | null
          updated_by: string | null
          year: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          chassis?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          engine?: string | null
          fuel?: string | null
          id?: string
          is_active?: boolean
          model?: string | null
          model_year?: number | null
          notes?: string | null
          plate?: string | null
          transmission?: string | null
          unit_id: string
          updated_at?: string | null
          updated_by?: string | null
          year?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          chassis?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          engine?: string | null
          fuel?: string | null
          id?: string
          is_active?: boolean
          model?: string | null
          model_year?: number | null
          notes?: string | null
          plate?: string | null
          transmission?: string | null
          unit_id?: string
          updated_at?: string | null
          updated_by?: string | null
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
      can_access_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_franchisee_profile: {
        Args: { _profile_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_unit: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
      get_company_by_hostname: { Args: { _hostname: string }; Returns: Json }
      get_company_unit_ids: { Args: { _company_id: string }; Returns: string[] }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      get_user_unit_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ceo: { Args: { _user_id: string }; Returns: boolean }
      is_company_admin: { Args: { _user_id: string }; Returns: boolean }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_support: { Args: { _user_id: string }; Returns: boolean }
      is_franchisor_admin: { Args: { _user_id: string }; Returns: boolean }
      is_master_level: { Args: { _user_id: string }; Returns: boolean }
      is_same_company: {
        Args: { _user_id_a: string; _user_id_b: string }
        Returns: boolean
      }
      safe_delete_customer: { Args: { _customer_id: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "admin"
        | "suporte"
        | "franqueado"
        | "admin_empresa"
        | "suporte_empresa"
        | "master_admin"
        | "ceo"
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
      app_role: [
        "admin",
        "suporte",
        "franqueado",
        "admin_empresa",
        "suporte_empresa",
        "master_admin",
        "ceo",
      ],
    },
  },
} as const
