import { useChannel } from "@/hooks/useChannel";

/**
 * Returns a function that resolves route paths based on the current channel mode.
 * 
 * In channel mode (hostname-based): paths are relative to root (e.g. "/arquivos")
 * In legacy mode: paths use the traditional prefix (e.g. "/admin/arquivos" or "/franqueado/arquivos")
 */
export function useChannelPaths() {
  const { channel, company } = useChannel();
  
  // Check if we're in channel mode (hostname resolved a channel_type)
  const hasExplicitChannel = new URLSearchParams(window.location.search).has("channel");
  const hasHostnameChannel = !!(company as any)?.channel_type;
  const isChannelMode = hasExplicitChannel || hasHostnameChannel;

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
