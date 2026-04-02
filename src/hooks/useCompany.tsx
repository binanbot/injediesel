import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyBranding {
  logo_url?: string;
  favicon_url?: string;
  platform_name?: string;
  store_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

export interface CompanyContacts {
  whatsapp?: string;
  email?: string;
  instagram?: string;
  website?: string;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  trade_name: string | null;
  branding: CompanyBranding;
  enabled_modules: string[];
  contacts: CompanyContacts;
}

interface CompanyContextType {
  company: Company | null;
  isLoading: boolean;
  isModuleEnabled: (module: string) => boolean;
}

const DEFAULT_COMPANY: Company = {
  id: "",
  slug: "injediesel",
  name: "Injediesel PowerChip",
  trade_name: "Injediesel",
  branding: {
    logo_url: "/assets/logo-injediesel.svg",
    platform_name: "Injediesel PowerChip",
    store_name: "PROMAX Store",
  },
  enabled_modules: [
    "dashboard", "enviar", "arquivos", "clientes", "loja", "pedidos",
    "suporte", "mensagens", "relatorios", "tutoriais", "cursos", "materiais", "atualizacoes",
  ],
  contacts: {},
};

const CompanyContext = createContext<CompanyContextType>({
  company: DEFAULT_COMPANY,
  isLoading: true,
  isModuleEnabled: () => true,
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;

    supabase
      .rpc("get_company_by_hostname", { _hostname: hostname })
      .then(({ data, error }) => {
        if (error || !data) {
          console.warn("Company not resolved for hostname:", hostname, "— using default");
          setCompany(DEFAULT_COMPANY);
        } else {
          setCompany(data as unknown as Company);
        }
        setIsLoading(false);
      });
  }, []);

  // Apply branding CSS variables
  useEffect(() => {
    if (!company?.branding) return;
    const root = document.documentElement;
    const b = company.branding;

    if (b.primary_color) root.style.setProperty("--company-primary", b.primary_color);
    if (b.secondary_color) root.style.setProperty("--company-secondary", b.secondary_color);
    if (b.accent_color) root.style.setProperty("--company-accent", b.accent_color);

    // Update page title
    if (b.platform_name) document.title = b.platform_name;

    // Update favicon
    if (b.favicon_url) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) link.href = b.favicon_url;
    }
  }, [company]);

  const isModuleEnabled = useMemo(() => {
    const modules = new Set(company?.enabled_modules ?? DEFAULT_COMPANY.enabled_modules);
    return (module: string) => modules.has(module);
  }, [company?.enabled_modules]);

  return (
    <CompanyContext.Provider value={{ company, isLoading, isModuleEnabled }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
