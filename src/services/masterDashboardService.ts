import { supabase } from "@/integrations/supabase/client";

export interface CompanySummary {
  id: string;
  slug: string;
  name: string;
  brand_name: string | null;
  is_active: boolean;
  units_count: number;
  customers_count: number;
  vehicles_count: number;
  files_count: number;
  files_pending: number;
  services_count: number;
  orders_count: number;
  orders_pending: number;
  open_tickets: number;
}

export interface MasterKPIs {
  companies_active: number;
  total_units: number;
  total_customers: number;
  total_vehicles: number;
  total_files: number;
  total_services: number;
  total_orders: number;
  total_open_tickets: number;
}

export interface OperationalAlert {
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
  company?: string;
  count?: number;
}

type Filters = {
  startDate?: string;
  endDate?: string;
  companyId?: string;
};

export async function getMasterKPIs(filters?: Filters): Promise<MasterKPIs> {
  // Companies
  const { count: companiesCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Units
  let unitsQ = supabase.from("units").select("*", { count: "exact", head: true });
  if (filters?.companyId) unitsQ = unitsQ.eq("company_id", filters.companyId);
  const { count: unitsCount } = await unitsQ;

  // Customers
  const { count: customersCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  // Vehicles
  const { count: vehiclesCount } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true });

  // Files
  let filesQ = supabase.from("received_files").select("*", { count: "exact", head: true });
  if (filters?.startDate) filesQ = filesQ.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) filesQ = filesQ.lte("created_at", `${filters.endDate}T23:59:59`);
  const { count: filesCount } = await filesQ;

  // Services
  const { count: servicesCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true });

  // Orders
  let ordersQ = supabase.from("orders").select("*", { count: "exact", head: true });
  if (filters?.startDate) ordersQ = ordersQ.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) ordersQ = ordersQ.lte("created_at", `${filters.endDate}T23:59:59`);
  const { count: ordersCount } = await ordersQ;

  // Open tickets
  const { count: ticketsCount } = await supabase
    .from("support_conversations")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  return {
    companies_active: companiesCount || 0,
    total_units: unitsCount || 0,
    total_customers: customersCount || 0,
    total_vehicles: vehiclesCount || 0,
    total_files: filesCount || 0,
    total_services: servicesCount || 0,
    total_orders: ordersCount || 0,
    total_open_tickets: ticketsCount || 0,
  };
}

export async function getCompanySummaries(filters?: Filters): Promise<CompanySummary[]> {
  // Get all active companies
  const { data: companies, error: compErr } = await supabase
    .from("companies")
    .select("id, slug, name, brand_name, is_active")
    .eq("is_active", true)
    .order("name");

  if (compErr || !companies) return [];

  const summaries: CompanySummary[] = [];

  for (const c of companies) {
    // Units for this company
    const { count: unitsCount } = await supabase
      .from("units")
      .select("*", { count: "exact", head: true })
      .eq("company_id", c.id);

    // Get unit IDs for this company to query related tables
    const { data: unitRows } = await supabase
      .from("units")
      .select("id")
      .eq("company_id", c.id);
    const unitIds = (unitRows || []).map((u: any) => u.id);

    let customersCount = 0;
    let vehiclesCount = 0;
    let filesCount = 0;
    let filesPending = 0;
    let servicesCount = 0;

    if (unitIds.length > 0) {
      const { count: cc } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .in("unit_id", unitIds);
      customersCount = cc || 0;

      const { count: vc } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .in("unit_id", unitIds);
      vehiclesCount = vc || 0;

      let fq = supabase.from("received_files").select("*", { count: "exact", head: true }).in("unit_id", unitIds);
      if (filters?.startDate) fq = fq.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters?.endDate) fq = fq.lte("created_at", `${filters.endDate}T23:59:59`);
      const { count: fc } = await fq;
      filesCount = fc || 0;

      const { count: fp } = await supabase
        .from("received_files")
        .select("*", { count: "exact", head: true })
        .in("unit_id", unitIds)
        .eq("status", "pending");
      filesPending = fp || 0;

      const { count: sc } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .in("unit_id", unitIds);
      servicesCount = sc || 0;
    }

    // Orders (via franchise_profile_id → units.franchisee_id)
    // Simplified: count all orders for now since we only have one company
    let ordersQ = supabase.from("orders").select("*", { count: "exact", head: true });
    if (filters?.startDate) ordersQ = ordersQ.gte("created_at", `${filters.startDate}T00:00:00`);
    if (filters?.endDate) ordersQ = ordersQ.lte("created_at", `${filters.endDate}T23:59:59`);
    const { count: ordersCount } = await ordersQ;

    const { count: ordersPending } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pedido_realizado");

    // Open tickets
    const { count: openTickets } = await supabase
      .from("support_conversations")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    summaries.push({
      id: c.id,
      slug: c.slug,
      name: c.name,
      brand_name: c.brand_name,
      is_active: c.is_active,
      units_count: unitsCount || 0,
      customers_count: customersCount,
      vehicles_count: vehiclesCount,
      files_count: filesCount,
      files_pending: filesPending,
      services_count: servicesCount,
      orders_count: ordersCount || 0,
      orders_pending: ordersPending || 0,
      open_tickets: openTickets || 0,
    });
  }

  return summaries;
}

export function deriveAlerts(summaries: CompanySummary[]): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  for (const s of summaries) {
    if (s.files_pending > 5) {
      alerts.push({
        type: "warning",
        title: "Arquivos pendentes",
        description: `${s.name} possui ${s.files_pending} arquivos aguardando processamento`,
        company: s.name,
        count: s.files_pending,
      });
    }
    if (s.open_tickets > 3) {
      alerts.push({
        type: "danger",
        title: "Tickets de suporte abertos",
        description: `${s.name} possui ${s.open_tickets} conversas de suporte em aberto`,
        company: s.name,
        count: s.open_tickets,
      });
    }
    if (s.orders_pending > 3) {
      alerts.push({
        type: "warning",
        title: "Pedidos aguardando ação",
        description: `${s.name} possui ${s.orders_pending} pedidos pendentes de processamento`,
        company: s.name,
        count: s.orders_pending,
      });
    }
  }

  // General alerts
  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      title: "Tudo em ordem",
      description: "Nenhum alerta operacional no momento",
    });
  }

  return alerts;
}

export type { Filters as MasterDashboardFilters };
