import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
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
  const { isChannelMode } = useChannel();

  if (isChannelMode) {
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
