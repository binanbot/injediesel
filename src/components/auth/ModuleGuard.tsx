import { Navigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompany";
import { useChannelPaths } from "@/hooks/useChannelPaths";

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
}

/**
 * Blocks access to a route when the module is disabled for the active company.
 * Redirects to the franchisee home page (channel-aware).
 */
export function ModuleGuard({ module, children }: ModuleGuardProps) {
  const { isModuleEnabled, isLoading } = useCompany();
  const { resolve } = useChannelPaths();

  if (isLoading) return null;

  if (!isModuleEnabled(module)) {
    return <Navigate to={resolve("/franqueado", "/franqueado")} replace />;
  }

  return <>{children}</>;
}
