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
  /** Name of the company's proprietary equipment (e.g. "EVOPRO") */
  equipmentName: string | null;
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
  equipmentName: null,
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

/** Normalize a color value to HSL string. Accepts #hex or raw HSL "H S% L%" */
function toHSL(color: string | undefined): string | null {
  if (!color) return null;
  if (color.startsWith("#")) return hexToHSL(color);
  // Already an HSL string like "217 91% 60%"
  if (/^\d+\s+\d+%\s+\d+%$/.test(color.trim())) return color.trim();
  return null;
}

function applyBranding(branding: CompanyBranding) {
  const root = document.documentElement;

  const primaryHSL = toHSL(branding.primary_color);
  const secondaryHSL = toHSL(branding.secondary_color);
  const accentHSL = toHSL(branding.accent_color);

  if (primaryHSL) {
    root.style.setProperty("--primary", primaryHSL);
    root.style.setProperty("--accent", primaryHSL);
    root.style.setProperty("--ring", primaryHSL);
    root.style.setProperty("--sidebar-primary", primaryHSL);
    root.style.setProperty("--sidebar-ring", primaryHSL);
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

  /** Wrap a promise with a timeout to avoid hanging forever */
  const withTimeout = <T,>(promise: Promise<T>, ms = 5000): Promise<T> =>
    Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
    ]);

  /** Resolve company by slug from the companies table */
  const resolveBySlug = async (slug: string): Promise<Company | null> => {
    const { data } = await withTimeout(
      supabase
        .from("companies")
        .select("id, slug, name, trade_name, brand_name, cnpj, branding, settings, enabled_modules, contacts")
        .eq("slug", slug)
        .eq("is_active", true)
        .single()
    );
    return data ? (data as unknown as Company) : null;
  };

  /** Resolve company by user's company_id */
  const resolveByUser = async (userId: string): Promise<Company | null> => {
    const { data: companyId } = await supabase.rpc("get_user_company_id", { _user_id: userId });
    if (!companyId) return null;
    const { data: companyRow } = await supabase
      .from("companies")
      .select("id, slug, name, trade_name, brand_name, cnpj, branding, settings, enabled_modules, contacts")
      .eq("id", companyId)
      .single();
    return companyRow ? (companyRow as unknown as Company) : null;
  };

  const finalize = (resolved: Company) => {
    setCompany(resolved);
    setIsResolved(true);
    if (resolved.branding) applyBranding(resolved.branding);
    // Persist slug in sessionStorage so navigation within the session keeps brand
    try { sessionStorage.setItem("__company_slug", resolved.slug); } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    const resolve = async () => {
      try {
        const hostname = window.location.hostname;
        const urlParams = new URLSearchParams(window.location.search);
        const brandParam = urlParams.get("brand");

        // 1. Query param ?brand=slug (dev/preview brand override) — check FIRST, no network needed for the param itself
        if (brandParam) {
          try {
            const bySlug = await resolveBySlug(brandParam);
            if (bySlug) { finalize(bySlug); return; }
          } catch (e) {
            console.warn("Brand param resolution failed:", e);
          }
        }

        // 2. SessionStorage persisted slug (keeps brand during navigation in preview)
        try {
          const storedSlug = sessionStorage.getItem("__company_slug");
          if (storedSlug) {
            const byStored = await resolveBySlug(storedSlug);
            if (byStored) { finalize(byStored); return; }
          }
        } catch {}

        // 3. Hostname-based resolution (production domains)
        try {
          const { data: hostnameData, error: hostnameErr } = await supabase.rpc("get_company_by_hostname", { _hostname: hostname });
          if (!hostnameErr && hostnameData) {
            finalize(hostnameData as unknown as Company);
            return;
          }
        } catch (e) {
          console.warn("Hostname resolution failed:", e);
        }

        // 4. Authenticated user's company_id fallback
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const byUser = await resolveByUser(session.user.id);
            if (byUser) { finalize(byUser); return; }
          }
        } catch (e) {
          console.warn("User-based resolution failed:", e);
        }

        // 5. Final fallback: default Injediesel
        console.warn("Company not resolved for hostname:", hostname, "— using default");
        finalize(DEFAULT_COMPANY);
      } catch (e) {
        console.error("Company resolution error:", e);
        finalize(DEFAULT_COMPANY);
      }
    };

    resolve();

    // Re-resolve company on auth state change (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id && !isResolved) {
        const byUser = await resolveByUser(session.user.id);
        if (byUser) finalize(byUser);
      }
      if (event === "SIGNED_OUT") {
        // Clear persisted slug on logout so next visitor sees default
        try { sessionStorage.removeItem("__company_slug"); } catch {}
        setCompany(DEFAULT_COMPANY);
        applyBranding(DEFAULT_COMPANY.branding);
        setIsResolved(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isModuleEnabled = useMemo(() => {
    const modules = new Set(company?.enabled_modules ?? DEFAULT_MODULES);
    return (module: string) => modules.has(module);
  }, [company?.enabled_modules]);

  const equipmentName = company?.settings?.proprietary_equipment_name ?? null;

  return (
    <CompanyContext.Provider value={{ company, isLoading, isResolved, isModuleEnabled, equipmentName }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
