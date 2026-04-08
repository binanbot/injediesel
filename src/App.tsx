import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompany";
import { ChannelProvider, useChannel } from "@/hooks/useChannel";
import { ChannelRouter, LegacyCombinedRoutes } from "@/components/routing/ChannelRouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Decides whether to use channel-based routing (hostname resolves a channel_type)
 * or legacy combined routing (dev/preview with no hostname mapping).
 *
 * The channel router is activated when the resolved channel comes from a
 * hostname mapping (channel_type returned by RPC) or an explicit ?channel= param.
 * Otherwise, the legacy combined routes are used for full backward compatibility.
 */
function SmartRouter() {
  const { channel, company } = useChannel();

  // Use channel routing when:
  // 1. An explicit ?channel= param is set (dev testing), OR
  // 2. The company has a channel_type from hostname resolution
  const hostname = window.location.hostname;
  const isDevOrPreview = hostname === "localhost"
    || hostname.endsWith(".lovable.app")
    || hostname.includes("127.0.0.1");
  const hasExplicitChannel = isDevOrPreview && new URLSearchParams(window.location.search).has("channel");
  const hasHostnameChannel = !!(company as any)?.channel_type;

  if (hasExplicitChannel || hasHostnameChannel) {
    return <ChannelRouter />;
  }

  // Fallback: use the legacy combined routes (preserves current behavior)
  return <LegacyCombinedRoutes />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <ChannelProvider>
              <SmartRouter />
            </ChannelProvider>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
