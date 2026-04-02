import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionModule, PermissionAction } from "@/types/permissions";

interface PermissionGuardProps {
  /** Module to check */
  module: PermissionModule;
  /** Action(s) required — if array, ANY match grants access */
  action: PermissionAction | PermissionAction[];
  /** Content to render when access is granted */
  children: React.ReactNode;
  /** Optional fallback when access is denied (defaults to nothing) */
  fallback?: React.ReactNode;
}

/**
 * Renders children only if the current user has the required permission.
 *
 * Usage:
 * ```tsx
 * <PermissionGuard module="financeiro" action="export">
 *   <ExportButton />
 * </PermissionGuard>
 *
 * <PermissionGuard module="clientes" action={["create", "edit"]}>
 *   <ClientForm />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  module,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can, canAny, isLoading } = usePermissions();

  if (isLoading) return null;

  const hasAccess = Array.isArray(action)
    ? canAny(module, action)
    : can(module, action);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
