import { Navigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
}

/**
 * Blocks access to a route when the module is disabled for the active company.
 * Redirects to the franchisee home page.
 */
export function ModuleGuard({ module, children }: ModuleGuardProps) {
  const { isModuleEnabled, isLoading } = useCompany();

  if (isLoading) return null;

  if (!isModuleEnabled(module)) {
    return <Navigate to="/franqueado" replace />;
  }

  return <>{children}</>;
}
