import { supabase } from "@/integrations/supabase/client";
import type { PermissionProfile, PermissionsMatrix } from "@/types/permissions";

/**
 * Resolves the effective permissions for a user:
 * 1. If employee has a permission_profile_id override → use that
 * 2. Else if employee's job_position has default_permission_profile_id → use that
 * 3. Else → empty permissions (role-base RBAC still applies)
 */
export async function fetchEffectivePermissions(userId: string): Promise<{
  profile: PermissionProfile | null;
  source: "override" | "position" | "none";
}> {
  // Step 1: Find employee profile with linked permission profiles
  const { data: employee, error } = await supabase
    .from("employee_profiles")
    .select("id, permission_profile_id, job_position_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !employee) {
    return { profile: null, source: "none" };
  }

  // Step 2: Check employee override
  if (employee.permission_profile_id) {
    const { data: profile } = await supabase
      .from("permission_profiles")
      .select("*")
      .eq("id", employee.permission_profile_id)
      .eq("is_active", true)
      .maybeSingle();

    if (profile) {
      return {
        profile: {
          ...profile,
          permissions: (profile.permissions as PermissionsMatrix) ?? {},
        },
        source: "override",
      };
    }
  }

  // Step 3: Check position default
  if (employee.job_position_id) {
    const { data: position } = await supabase
      .from("job_positions")
      .select("default_permission_profile_id")
      .eq("id", employee.job_position_id)
      .maybeSingle();

    if (position?.default_permission_profile_id) {
      const { data: profile } = await supabase
        .from("permission_profiles")
        .select("*")
        .eq("id", position.default_permission_profile_id)
        .eq("is_active", true)
        .maybeSingle();

      if (profile) {
        return {
          profile: {
            ...profile,
            permissions: (profile.permissions as PermissionsMatrix) ?? {},
          },
          source: "position",
        };
      }
    }
  }

  return { profile: null, source: "none" };
}

/** Fetch all permission profiles for a company (for management UI) */
export async function fetchPermissionProfiles(companyId?: string): Promise<PermissionProfile[]> {
  let query = supabase
    .from("permission_profiles")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (companyId) {
    query = query.or(`company_id.eq.${companyId},company_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((p: any) => ({
    ...p,
    permissions: (p.permissions as PermissionsMatrix) ?? {},
  }));
}

/** Upsert a permission profile */
export async function upsertPermissionProfile(payload: {
  id?: string;
  company_id: string | null;
  name: string;
  slug: string;
  description?: string;
  permissions: PermissionsMatrix;
  is_system_default?: boolean;
}) {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("permission_profiles").update(rest).eq("id", id);
    if (error) throw error;
    return id;
  } else {
    const { data, error } = await supabase
      .from("permission_profiles")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }
}
