import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "@/hooks/useAuth";
import { useChannel, type ChannelType } from "@/hooks/useChannel";
import { Loader2 } from "lucide-react";

/**
 * Validates that the authenticated user's role is compatible with the current channel.
 * If incompatible, redirects to /login on the current hostname.
 *
 * Rules:
 * - app channel: only franqueado (+ admin/master who can impersonate)
 * - admin channel: only admin-level roles for the matching company
 * - ceo_global: only ceo (+ master_admin)
 * - master_global: only master_admin
 * - public: no auth needed, always pass
 */

const CHANNEL_ALLOWED_ROLES: Record<ChannelType, UserRole[]> = {
  public: [], // no restriction
  app: ["franqueado", "admin", "suporte", "admin_empresa", "suporte_empresa", "master_admin", "ceo"],
  admin: ["admin", "suporte", "admin_empresa", "suporte_empresa", "master_admin", "ceo"],
  ceo_global: ["ceo", "master_admin"],
  master_global: ["master_admin"],
};

interface ChannelGuardProps {
  children: React.ReactNode;
}

export function ChannelGuard({ children }: ChannelGuardProps) {
  const { user, userRole, userCompanyId, isLoading: authLoading } = useAuth();
  const { channel, company, isLoading: channelLoading } = useChannel();

  if (authLoading || channelLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Public channel: always allow
  if (channel === "public") {
    return <>{children}</>;
  }

  // Not authenticated on a restricted channel → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role compatibility with channel
  const allowedRoles = CHANNEL_ALLOWED_ROLES[channel];
  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/login" replace />;
  }

  // For company-scoped channels (app/admin), validate company match
  // master_admin and ceo bypass company check
  if ((channel === "app" || channel === "admin") && company) {
    const isMasterOrCeo = userRole === "master_admin" || userRole === "ceo";
    if (!isMasterOrCeo && userCompanyId && company.id && userCompanyId !== company.id) {
      // User belongs to a different company than this hostname
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-destructive mb-2">Acesso negado</h1>
            <p className="text-muted-foreground">
              Sua conta não está vinculada a esta empresa. 
              Entre em contato com o administrador.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
