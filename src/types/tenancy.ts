export interface Company {
  id: string;
  name: string;
  slug: string;
  trade_name?: string;
  cnpj?: string;
  branding?: CompanyBranding;
  settings?: CompanySettings;
  enabled_modules?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyBranding {
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  platform_name?: string;
  store_name?: string;
}

export interface CompanySettings {
  currency?: string;
  locale?: string;
  timezone?: string;
  proprietary_equipment_name?: string;
}

export interface CompanyDomain {
  id: string;
  company_id: string;
  hostname: string;
  is_primary: boolean;
  environment: 'production' | 'staging' | 'development' | 'preview';
  is_active: boolean;
  channel_type: 'public' | 'private' | 'restricted';
  created_at: string;
}

export interface CompanyModule {
  id: string;
  company_id: string;
  module_key: string;
  is_enabled: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type GlobalRole = 'master_admin' | 'adminco' | 'ceo';
export type CompanyRole = 'admin_empresa' | 'suporte_empresa' | 'franqueado' | 'admin' | 'suporte';

export type AppRole = GlobalRole | CompanyRole;
