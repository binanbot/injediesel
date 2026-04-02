import { supabase } from "@/integrations/supabase/client";

export interface CompanyDetail {
  id: string;
  slug: string;
  name: string;
  brand_name: string | null;
  trade_name: string | null;
  cnpj: string | null;
  is_active: boolean;
  branding: Record<string, any>;
  enabled_modules: string[];
  created_at: string;
}

export interface UnitSummary {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  is_active: boolean | null;
  franchisee_name: string | null;
  customers_count: number;
  vehicles_count: number;
  files_count: number;
  services_count: number;
}

export interface CompanyKPIs {
  units: number;
  customers: number;
  vehicles: number;
  files: number;
  files_pending: number;
  services: number;
  orders: number;
  orders_pending: number;
  open_tickets: number;
}

export interface RecentFile {
  id: string;
  placa: string;
  servico: string;
  status: string;
  created_at: string;
  unit_name?: string;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

type Filters = {
  startDate?: string;
  endDate?: string;
  unitId?: string;
};

export async function getCompanyDetail(companyId: string): Promise<CompanyDetail | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("id, slug, name, brand_name, trade_name, cnpj, is_active, branding, enabled_modules, created_at")
    .eq("id", companyId)
    .single();

  if (error || !data) return null;
  return data as CompanyDetail;
}

export async function getCompanyUnits(companyId: string): Promise<UnitSummary[]> {
  const { data: units } = await supabase
    .from("units")
    .select("id, name, city, state, is_active, franchisee_id")
    .eq("company_id", companyId)
    .order("name");

  if (!units) return [];

  const summaries: UnitSummary[] = [];

  for (const u of units) {
    // Get franchisee name
    let franchiseeName: string | null = null;
    if (u.franchisee_id) {
      const { data: pf } = await supabase
        .from("profiles_franchisees")
        .select("display_name, first_name, last_name, email")
        .eq("id", u.franchisee_id)
        .single();
      if (pf) {
        franchiseeName = pf.display_name || [pf.first_name, pf.last_name].filter(Boolean).join(" ") || pf.email;
      }
    }

    const { count: cc } = await supabase.from("customers").select("*", { count: "exact", head: true }).eq("unit_id", u.id);
    const { count: vc } = await supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("unit_id", u.id);
    const { count: fc } = await supabase.from("received_files").select("*", { count: "exact", head: true }).eq("unit_id", u.id);
    const { count: sc } = await supabase.from("services").select("*", { count: "exact", head: true }).eq("unit_id", u.id);

    summaries.push({
      id: u.id,
      name: u.name,
      city: u.city,
      state: u.state,
      is_active: u.is_active,
      franchisee_name: franchiseeName,
      customers_count: cc || 0,
      vehicles_count: vc || 0,
      files_count: fc || 0,
      services_count: sc || 0,
    });
  }

  return summaries;
}

export async function getCompanyKPIs(companyId: string, filters?: Filters): Promise<CompanyKPIs> {
  const { data: unitRows } = await supabase.from("units").select("id").eq("company_id", companyId);
  const unitIds = (unitRows || []).map((u) => u.id);

  if (unitIds.length === 0) {
    return { units: 0, customers: 0, vehicles: 0, files: 0, files_pending: 0, services: 0, orders: 0, orders_pending: 0, open_tickets: 0 };
  }

  const targetUnitIds = filters?.unitId ? [filters.unitId] : unitIds;

  const [customers, vehicles, files, filesPending, services] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }).in("unit_id", targetUnitIds),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).in("unit_id", targetUnitIds),
    (() => {
      let q = supabase.from("received_files").select("*", { count: "exact", head: true }).in("unit_id", targetUnitIds);
      if (filters?.startDate) q = q.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters?.endDate) q = q.lte("created_at", `${filters.endDate}T23:59:59`);
      return q;
    })(),
    supabase.from("received_files").select("*", { count: "exact", head: true }).in("unit_id", targetUnitIds).eq("status", "pending"),
    supabase.from("services").select("*", { count: "exact", head: true }).in("unit_id", targetUnitIds),
  ]);

  // Orders via franchise_profile_id → units
  const { data: pfRows } = await supabase.from("units").select("franchisee_id").in("id", targetUnitIds).not("franchisee_id", "is", null);
  const pfIds = (pfRows || []).map((r) => r.franchisee_id).filter(Boolean) as string[];

  let ordersCount = 0;
  let ordersPending = 0;
  if (pfIds.length > 0) {
    let oq = supabase.from("orders").select("*", { count: "exact", head: true }).in("franchise_profile_id", pfIds);
    if (filters?.startDate) oq = oq.gte("created_at", `${filters.startDate}T00:00:00`);
    if (filters?.endDate) oq = oq.lte("created_at", `${filters.endDate}T23:59:59`);
    const { count: oc } = await oq;
    ordersCount = oc || 0;

    const { count: op } = await supabase.from("orders").select("*", { count: "exact", head: true }).in("franchise_profile_id", pfIds).eq("status", "pedido_realizado");
    ordersPending = op || 0;
  }

  // Open tickets - simplified for now
  const { count: ticketsCount } = await supabase.from("support_conversations").select("*", { count: "exact", head: true }).eq("status", "open");

  return {
    units: unitIds.length,
    customers: customers.count || 0,
    vehicles: vehicles.count || 0,
    files: files.count || 0,
    files_pending: filesPending.count || 0,
    services: services.count || 0,
    orders: ordersCount,
    orders_pending: ordersPending,
    open_tickets: ticketsCount || 0,
  };
}

export async function getRecentFiles(companyId: string, limit = 10): Promise<RecentFile[]> {
  const { data: unitRows } = await supabase.from("units").select("id, name").eq("company_id", companyId);
  if (!unitRows || unitRows.length === 0) return [];

  const unitIds = unitRows.map((u) => u.id);
  const unitMap = Object.fromEntries(unitRows.map((u) => [u.id, u.name]));

  const { data } = await supabase
    .from("received_files")
    .select("id, placa, servico, status, created_at, unit_id")
    .in("unit_id", unitIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((f) => ({
    id: f.id,
    placa: f.placa,
    servico: f.servico,
    status: f.status,
    created_at: f.created_at,
    unit_name: unitMap[f.unit_id] || "",
  }));
}

export async function getRecentOrders(companyId: string, limit = 10): Promise<RecentOrder[]> {
  const { data: unitRows } = await supabase.from("units").select("franchisee_id").eq("company_id", companyId).not("franchisee_id", "is", null);
  const pfIds = (unitRows || []).map((r) => r.franchisee_id).filter(Boolean) as string[];
  if (pfIds.length === 0) return [];

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, status, created_at")
    .in("franchise_profile_id", pfIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as RecentOrder[];
}

export async function getRecentTickets(limit = 10): Promise<RecentTicket[]> {
  const { data } = await supabase
    .from("support_conversations")
    .select("id, subject, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as RecentTicket[];
}
