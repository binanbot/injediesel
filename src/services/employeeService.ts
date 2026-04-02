import { supabase } from "@/integrations/supabase/client";

export interface EmployeeRow {
  id: string;
  user_id: string;
  company_id: string;
  department_id: string | null;
  job_position_id: string | null;
  display_name: string | null;
  phone: string | null;
  is_active: boolean;
  hired_at: string | null;
  notes: string | null;
  created_at: string;
  // joined
  department_name?: string;
  position_title?: string;
  company_name?: string;
  seller_profile?: SellerRow | null;
}

export interface SellerRow {
  id: string;
  employee_profile_id: string;
  seller_mode: "ecu" | "parts" | "both";
  commission_type: "percentage" | "fixed" | "tiered";
  commission_value: number;
  can_sell_ecu: boolean;
  can_sell_parts: boolean;
  is_active: boolean;
  target_monthly: number | null;
  notes: string | null;
}

export interface DepartmentRow {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

export interface JobPositionRow {
  id: string;
  company_id: string;
  department_id: string | null;
  title: string;
  slug: string;
  scope: string;
  hierarchy_level: number;
  is_active: boolean;
}

export type EmployeeFilters = {
  companyId?: string;
  departmentId?: string;
  positionId?: string;
  isActive?: boolean;
  isSeller?: boolean;
  sellerMode?: string;
  search?: string;
};

export async function fetchEmployees(filters?: EmployeeFilters): Promise<EmployeeRow[]> {
  let query = supabase
    .from("employee_profiles")
    .select("*")
    .order("display_name", { ascending: true });

  if (filters?.companyId) query = query.eq("company_id", filters.companyId);
  if (filters?.departmentId) query = query.eq("department_id", filters.departmentId);
  if (filters?.positionId) query = query.eq("job_position_id", filters.positionId);
  if (typeof filters?.isActive === "boolean") query = query.eq("is_active", filters.isActive);

  const { data: employees, error } = await query;
  if (error) throw error;
  if (!employees || employees.length === 0) return [];

  // Fetch departments and positions for display
  const companyIds = [...new Set(employees.map((e) => e.company_id))];
  const deptIds = employees.map((e) => e.department_id).filter(Boolean) as string[];
  const posIds = employees.map((e) => e.job_position_id).filter(Boolean) as string[];
  const empIds = employees.map((e) => e.id);

  const [deptRes, posRes, compRes, sellerRes] = await Promise.all([
    deptIds.length > 0
      ? supabase.from("departments").select("id, name").in("id", deptIds)
      : Promise.resolve({ data: [] }),
    posIds.length > 0
      ? supabase.from("job_positions").select("id, title").in("id", posIds)
      : Promise.resolve({ data: [] }),
    supabase.from("companies").select("id, name").in("id", companyIds),
    supabase.from("seller_profiles").select("*").in("employee_profile_id", empIds),
  ]);

  const deptMap = Object.fromEntries((deptRes.data || []).map((d: any) => [d.id, d.name]));
  const posMap = Object.fromEntries((posRes.data || []).map((p: any) => [p.id, p.title]));
  const compMap = Object.fromEntries((compRes.data || []).map((c: any) => [c.id, c.name]));
  const sellerMap = Object.fromEntries(
    (sellerRes.data || []).map((s: any) => [s.employee_profile_id, s])
  );

  let results: EmployeeRow[] = employees.map((e) => ({
    ...e,
    department_name: deptMap[e.department_id] || undefined,
    position_title: posMap[e.job_position_id] || undefined,
    company_name: compMap[e.company_id] || undefined,
    seller_profile: sellerMap[e.id] || null,
  }));

  // Client-side filters for joined data
  if (filters?.isSeller === true) results = results.filter((r) => r.seller_profile !== null);
  if (filters?.isSeller === false) results = results.filter((r) => r.seller_profile === null);
  if (filters?.sellerMode) results = results.filter((r) => r.seller_profile?.seller_mode === filters.sellerMode);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.display_name?.toLowerCase().includes(s) ||
        r.department_name?.toLowerCase().includes(s) ||
        r.position_title?.toLowerCase().includes(s)
    );
  }

  return results;
}

export async function fetchDepartments(companyId?: string): Promise<DepartmentRow[]> {
  let query = supabase.from("departments").select("*").eq("is_active", true).order("sort_order");
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as DepartmentRow[];
}

export async function fetchJobPositions(companyId?: string, departmentId?: string): Promise<JobPositionRow[]> {
  let query = supabase.from("job_positions").select("*").eq("is_active", true).order("hierarchy_level");
  if (companyId) query = query.eq("company_id", companyId);
  if (departmentId) query = query.eq("department_id", departmentId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as JobPositionRow[];
}

export async function upsertEmployee(payload: {
  id?: string;
  user_id: string;
  company_id: string;
  department_id?: string | null;
  job_position_id?: string | null;
  display_name?: string;
  phone?: string;
  is_active?: boolean;
  hired_at?: string | null;
  notes?: string;
}) {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("employee_profiles").update(rest).eq("id", id);
    if (error) throw error;
    return id;
  } else {
    const { data, error } = await supabase.from("employee_profiles").insert(payload).select("id").single();
    if (error) throw error;
    return data.id;
  }
}

export async function upsertSellerProfile(payload: {
  id?: string;
  employee_profile_id: string;
  seller_mode: string;
  commission_type: string;
  commission_value: number;
  can_sell_ecu: boolean;
  can_sell_parts: boolean;
  is_active: boolean;
  target_monthly?: number | null;
  notes?: string;
}) {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("seller_profiles").update(rest).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("seller_profiles").insert(payload);
    if (error) throw error;
  }
}

export async function deleteSellerProfile(employeeProfileId: string) {
  const { error } = await supabase.from("seller_profiles").delete().eq("employee_profile_id", employeeProfileId);
  if (error) throw error;
}

export async function toggleEmployeeActive(id: string, isActive: boolean) {
  const { error } = await supabase.from("employee_profiles").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}
