import { useEffect, useState } from "react";
import { useAuth, isMasterLevel, isAdminLevel } from "@/hooks/useAuth";
import { fetchEffectivePermissions } from "@/services/permissionService";
import type {
  PermissionModule,
  PermissionAction,
  PermissionsMatrix,
} from "@/types/permissions";
import { FULL_ACCESS_MATRIX } from "@/types/permissions";

interface UsePermissionsReturn {
  /** Check if user can perform an action on a module */
  can: (module: PermissionModule, action: PermissionAction) => boolean;
  /** Check if user can perform ANY of the listed actions on a module */
  canAny: (module: PermissionModule, actions: PermissionAction[]) => boolean;
  /** Check if user has any access to a module */
  canAccess: (module: PermissionModule) => boolean;
  /** The resolved permissions matrix */
  permissions: PermissionsMatrix;
  /** Profile name (e.g., "Vendedor ECU") */
  profileName: string | null;
  /** Whether permissions are still loading */
  isLoading: boolean;
}

/**
 * Hook that resolves effective permissions for the current user.
 *
 * Master-level and admin-level roles get FULL_ACCESS by default,
 * preserving backward compatibility with existing RBAC.
 *
 * For employees with a permission profile (via position or override),
 * the profile's matrix is used for granular checks.
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, userRole } = useAuth();
  const [permissions, setPermissions] = useState<PermissionsMatrix>({});
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions({});
      setProfileName(null);
      setIsLoading(false);
      return;
    }

    // Master/CEO/Admin/Suporte → full access (backward compat)
    if (isMasterLevel(userRole) || isAdminLevel(userRole)) {
      setPermissions(FULL_ACCESS_MATRIX);
      setProfileName(userRole);
      setIsLoading(false);
      return;
    }

    // Fetch employee-level permissions
    let cancelled = false;
    setIsLoading(true);

    fetchEffectivePermissions(user.id).then(({ profile }) => {
      if (cancelled) return;
      setPermissions(profile?.permissions ?? {});
      setProfileName(profile?.name ?? null);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, userRole]);

  const can = (module: PermissionModule, action: PermissionAction): boolean => {
    const actions = permissions[module];
    return Array.isArray(actions) && actions.includes(action);
  };

  const canAny = (module: PermissionModule, actions: PermissionAction[]): boolean => {
    return actions.some((a) => can(module, a));
  };

  const canAccess = (module: PermissionModule): boolean => {
    const actions = permissions[module];
    return Array.isArray(actions) && actions.length > 0;
  };

  return { can, canAny, canAccess, permissions, profileName, isLoading };
}
