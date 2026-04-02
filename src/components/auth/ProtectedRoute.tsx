import { Navigate, useLocation } from "react-router-dom";
import { useAuth, isAdminLevel, type UserRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "suporte" | "franqueado" | "admin_empresa" | "suporte_empresa" | "master_admin" | "ceo";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, isLoading } = useAuth();
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

  // If no specific roles are required, allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Admin-level roles (admin, suporte, master_admin, ceo) can access everything
  if (isAdminLevel(userRole)) {
    return <>{children}</>;
  }

  // Check if user has an allowed role
  if (userRole && allowedRoles.includes(userRole as AppRole)) {
    return <>{children}</>;
  }

  // User doesn't have the required role - redirect based on role
  if (userRole === "admin_empresa" || userRole === "suporte_empresa") {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/franqueado" replace />;
}
