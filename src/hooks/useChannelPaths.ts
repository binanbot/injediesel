import { useChannel } from "@/hooks/useChannel";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns a function that resolves route paths based on the current channel mode.
 * 
 * In channel mode (hostname-based or logged-in): paths are relative to root (e.g. "/arquivos")
 * In legacy mode (unauthenticated preview without hostname mapping): paths use the traditional prefix
 */
export function useChannelPaths() {
  const { channel, company } = useChannel();
  const { user, userRole } = useAuth();
  
  // Check if we're in channel mode (hostname resolved a channel_type, or user is logged in)
  const hostname = window.location.hostname;
  const isDevOrPreview = hostname === "localhost"
    || hostname.endsWith(".lovable.app")
    || hostname.includes("127.0.0.1");
  const hasExplicitChannel = isDevOrPreview && new URLSearchParams(window.location.search).has("channel");
  const hasHostnameChannel = !!(company as any)?.channel_type;
  const isLoggedIn = !!user && !!userRole;
  
  // Channel mode is active if we have a hostname mapping, an explicit param, or an authenticated user
  const isChannelMode = hasExplicitChannel || hasHostnameChannel || isLoggedIn;

  /**
   * Resolve a path for a given base prefix.
   * In channel mode: strips the prefix (e.g. "/admin/clientes" -> "/clientes")
   * In legacy mode: keeps the prefix as-is
   */
  const resolve = (path: string, legacyPrefix: string): string => {
    if (!isChannelMode) return path;
    
    // If the path starts with the legacy prefix, strip it
    if (path === legacyPrefix) return "/";
    if (path.startsWith(legacyPrefix + "/")) {
      return path.slice(legacyPrefix.length);
    }
    return path;
  };

  return { resolve, isChannelMode, channel };
}