import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
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
  proprietary_equipment_name?: string;
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

/** Convert a hex color (#RRGGBB) to HSL string "H S% L%" for CSS variables */
function hexToHSL(hex: string): string | null {
  if (!hex || !hex.startsWith("#")) return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBranding(branding: CompanyBranding) {
  const root = document.documentElement;

  // Convert hex colors to HSL and inject into the design system CSS variables
  const primaryHSL = hexToHSL(branding.primary_color || "");
  const secondaryHSL = hexToHSL(branding.secondary_color || "");
  const accentHSL = hexToHSL(branding.accent_color || "");

  if (primaryHSL) {
    root.style.setProperty("--primary", primaryHSL);
    root.style.setProperty("--accent", primaryHSL);
    root.style.setProperty("--ring", primaryHSL);
    root.style.setProperty("--sidebar-primary", primaryHSL);
    root.style.setProperty("--sidebar-ring", primaryHSL);
  }

  if (secondaryHSL) {
    root.style.setProperty("--company-secondary", branding.secondary_color!);
  }

  if (accentHSL) {
    root.style.setProperty("--accent", accentHSL);
  }

  // Legacy custom properties for components that use them directly
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
