import { createContext, useContext, useMemo, ReactNode } from "react";
import { useCompany, type Company } from "@/hooks/useCompany";

/**
 * Channel types that determine which shell/routes to render.
 * Resolved from hostname via company_domains.channel_type or dev fallbacks.
 */
export type ChannelType = "public" | "app" | "admin" | "ceo_global" | "master_global";

interface ChannelContextType {
  /** Resolved channel type */
  channel: ChannelType;
  /** The resolved company (null for global channels without company) */
  company: Company | null;
  /** Whether the channel is company-scoped (public/app/admin) */
  isCompanyScoped: boolean;
  /** Whether the channel is a global channel (ceo/master) */
  isGlobalChannel: boolean;
  /** Whether context is still loading */
  isLoading: boolean;
}

const ChannelContext = createContext<ChannelContextType>({
  channel: "public",
  company: null,
  isCompanyScoped: true,
  isGlobalChannel: false,
  isLoading: true,
});

/**
 * Resolve channel from multiple sources with priority:
 * 1. ?channel= query param (dev/preview only)
 * 2. company_domains.channel_type (returned by RPC)
 * 3. URL path prefix fallback (/admin, /franqueado, /master, /ceo)
 * 4. Default: "public"
 */
function resolveChannel(company: Company | null): ChannelType {
  // 1. Explicit query param (dev/preview)
  const params = new URLSearchParams(window.location.search);
  const channelParam = params.get("channel");
  if (channelParam && isValidChannel(channelParam)) {
    return channelParam;
  }

  // 2. channel_type from company_domains RPC (stored on company object)
  const companyChannel = (company as any)?.channel_type;
  if (companyChannel && isValidChannel(companyChannel)) {
    return companyChannel;
  }

  // 3. Path-based fallback (backward compatibility)
  const path = window.location.pathname;
  if (path.startsWith("/master")) return "master_global";
  if (path.startsWith("/ceo")) return "ceo_global";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/franqueado")) return "app";

  // 4. Default
  return "public";
}

function isValidChannel(value: string): value is ChannelType {
  return ["public", "app", "admin", "ceo_global", "master_global"].includes(value);
}

export function ChannelProvider({ children }: { children: ReactNode }) {
  const { company, isLoading } = useCompany();

  const channel = useMemo(() => resolveChannel(company), [company]);

  const value = useMemo<ChannelContextType>(() => ({
    channel,
    company,
    isCompanyScoped: ["public", "app", "admin"].includes(channel),
    isGlobalChannel: ["ceo_global", "master_global"].includes(channel),
    isLoading,
  }), [channel, company, isLoading]);

  return (
    <ChannelContext.Provider value={value}>
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel() {
  return useContext(ChannelContext);
}
