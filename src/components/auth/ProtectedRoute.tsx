import { Navigate, useLocation } from "react-router-dom";
import { useAuth, isAdminLevel, isMasterLevel, getHomeRouteForRole } from "@/hooks/useAuth";
import { useChannel } from "@/hooks/useChannel";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "suporte" | "franqueado" | "admin_empresa" | "suporte_empresa" | "master_admin" | "ceo";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, isLoading } = useAuth();
  const { isChannelMode } = useChannel();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no specific roles required, allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Master-level roles can access everything
  if (isMasterLevel(userRole)) {
    return <>{children}</>;
  }

  // Admin-level roles (admin, suporte) can access admin + franqueado areas
  if (isAdminLevel(userRole)) {
    const isAdminOrFranqueadoArea = allowedRoles.some(r =>
      ["admin", "suporte", "franqueado", "admin_empresa", "suporte_empresa"].includes(r)
    );
    if (isAdminOrFranqueadoArea) return <>{children}</>;
  }

  // Check if user has an explicitly allowed role
  if (userRole && allowedRoles.includes(userRole as AppRole)) {
    return <>{children}</>;
  }

  // Redirect to the user's home route
  return <Navigate to={getHomeRouteForRole(userRole, isChannelMode)} replace />;
}
