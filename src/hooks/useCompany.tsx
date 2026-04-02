import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyBranding {
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  platform_name?: string;
  store_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  hero_gradient?: string;
}

export interface CompanyContacts {
  whatsapp?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
}

export interface CompanySettings {
  currency?: string;
  locale?: string;
  timezone?: string;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  trade_name: string | null;
  brand_name: string | null;
  cnpj: string | null;
  branding: CompanyBranding;
  settings: CompanySettings;
  enabled_modules: string[];
  contacts: CompanyContacts;
}

interface CompanyContextType {
  company: Company | null;
  isLoading: boolean;
  isResolved: boolean;
  isModuleEnabled: (module: string) => boolean;
}

const DEFAULT_MODULES = [
  "dashboard", "enviar", "arquivos", "clientes", "loja", "pedidos",
  "suporte", "mensagens", "relatorios", "tutoriais", "cursos", "materiais", "atualizacoes",
];

const DEFAULT_COMPANY: Company = {
  id: "",
  slug: "injediesel",
  name: "Injediesel PowerChip",
  trade_name: "Injediesel",
  brand_name: "Injediesel PowerChip",
  cnpj: null,
  branding: {
    logo_url: "/assets/logo-injediesel.svg",
    platform_name: "Injediesel PowerChip",
    store_name: "PROMAX Store",
  },
  settings: { currency: "BRL", locale: "pt-BR", timezone: "America/Sao_Paulo" },
  enabled_modules: DEFAULT_MODULES,
  contacts: {},
};

const CompanyContext = createContext<CompanyContextType>({
  company: DEFAULT_COMPANY,
  isLoading: true,
  isResolved: false,
  isModuleEnabled: () => true,
});

function applyBranding(branding: CompanyBranding) {
  const root = document.documentElement;

  if (branding.primary_color) root.style.setProperty("--company-primary", branding.primary_color);
  if (branding.secondary_color) root.style.setProperty("--company-secondary", branding.secondary_color);
  if (branding.accent_color) root.style.setProperty("--company-accent", branding.accent_color);

  if (branding.platform_name) document.title = branding.platform_name;

  if (branding.favicon_url) {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.favicon_url;
  }
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;

    supabase
      .rpc("get_company_by_hostname", { _hostname: hostname })
      .then(({ data, error }) => {
        if (error || !data) {
          console.warn("Company not resolved for hostname:", hostname, "— using default");
          setCompany(DEFAULT_COMPANY);
          applyBranding(DEFAULT_COMPANY.branding);
        } else {
          const resolved = data as unknown as Company;
          setCompany(resolved);
          setIsResolved(true);
          if (resolved.branding) applyBranding(resolved.branding);
        }
        setIsLoading(false);
      });
  }, []);

  const isModuleEnabled = useMemo(() => {
    const modules = new Set(company?.enabled_modules ?? DEFAULT_MODULES);
    return (module: string) => modules.has(module);
  }, [company?.enabled_modules]);

  return (
    <CompanyContext.Provider value={{ company, isLoading, isResolved, isModuleEnabled }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
