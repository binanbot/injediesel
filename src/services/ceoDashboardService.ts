import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────

export interface CeoKPIs {
  total_revenue: number;
  total_cost: number;
  estimated_margin: number;
  margin_percent: number;
  companies_active: number;
  units_active: number;
  total_orders: number;
  total_files: number;
}

export interface CompanyComparison {
  id: string;
  name: string;
  brand_name: string | null;
  revenue: number;
  cost: number;
  margin: number;
  margin_percent: number;
  orders: number;
  files: number;
  units: number;
  growth_percent: number | null;
}

export interface MonthlyEvolution {
  month: string;
  label: string;
  revenue: number;
  cost: number;
  margin: number;
}

export interface ExecutiveAlert {
  type: "danger" | "warning" | "info";
  title: string;
  description: string;
  company?: string;
}

type Filters = {
  startDate?: string;
  endDate?: string;
  companyId?: string;
};

const EXCLUDED_STATUSES = ["cancelado", "reembolsado"];

// ── Helpers ────────────────────────────────────────────────

async function getUnitIdsByCompany(companyId: string): Promise<string[]> {
  const { data } = await supabase
    .from("units")
    .select("id")
    .eq("company_id", companyId);
  return (data || []).map((u) => u.id);
}

async function getRevenueForUnits(
  unitIds: string[],
  filters?: Filters
): Promise<{ revenue: number; orders: number }> {
  if (unitIds.length === 0) return { revenue: 0, orders: 0 };

  let query = supabase
    .from("orders")
    .select("total_amount, status, franchise_profile_id, unit_id")
    .not("status", "in", `("${EXCLUDED_STATUSES.join('","')}")`);

  if (filters?.startDate)
    query = query.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    query = query.lte("created_at", `${filters.endDate}T23:59:59`);

  const { data } = await query;
  const rows = (data || []).filter(
    (o: any) => !unitIds.length || unitIds.includes(o.unit_id)
  );
  const revenue = rows.reduce(
    (s: number, o: any) => s + Number(o.total_amount || 0),
    0
  );
  return { revenue, orders: rows.length };
}

async function getCostForCompany(
  companyId: string,
  filters?: Filters
): Promise<number> {
  // Use financial_entries with entry_type = 'despesa' scoped to company profiles
  let query = supabase
    .from("financial_entries")
    .select("amount, franchise_profile_id")
    .eq("entry_type", "despesa");

  if (filters?.startDate)
    query = query.gte("competency_date", filters.startDate);
  if (filters?.endDate)
    query = query.lte("competency_date", filters.endDate);

  const { data } = await query;
  // For now aggregate all costs (multi-company filtering will improve with company_id on financial_entries)
  return (data || []).reduce(
    (s: number, e: any) => s + Number(e.amount || 0),
    0
  );
}

// ── Main Functions ─────────────────────────────────────────

export async function getCeoKPIs(filters?: Filters): Promise<CeoKPIs> {
  // Companies
  const { count: companiesCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Units
  const { count: unitsCount } = await supabase
    .from("units")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Revenue from orders
  let ordersQuery = supabase
    .from("orders")
    .select("total_amount, status")
    .not("status", "in", `("${EXCLUDED_STATUSES.join('","')}")`);

  if (filters?.startDate)
    ordersQuery = ordersQuery.gte(
      "created_at",
      `${filters.startDate}T00:00:00`
    );
  if (filters?.endDate)
    ordersQuery = ordersQuery.lte(
      "created_at",
      `${filters.endDate}T23:59:59`
    );

  const { data: ordersData } = await ordersQuery;
  const totalRevenue = (ordersData || []).reduce(
    (s: number, o: any) => s + Number(o.total_amount || 0),
    0
  );
  const totalOrders = (ordersData || []).length;

  // Files revenue
  let filesQuery = supabase
    .from("received_files")
    .select("id, valor_brl");
  if (filters?.startDate)
    filesQuery = filesQuery.gte(
      "created_at",
      `${filters.startDate}T00:00:00`
    );
  if (filters?.endDate)
    filesQuery = filesQuery.lte(
      "created_at",
      `${filters.endDate}T23:59:59`
    );
  const { data: filesData } = await filesQuery;
  const filesRevenue = (filesData || []).reduce(
    (s: number, f: any) => s + Number(f.valor_brl || 0),
    0
  );
  const totalFiles = (filesData || []).length;

  const revenue = totalRevenue + filesRevenue;

  // Cost estimate from financial_entries
  let costQuery = supabase
    .from("financial_entries")
    .select("amount")
    .eq("entry_type", "despesa");
  if (filters?.startDate)
    costQuery = costQuery.gte("competency_date", filters.startDate);
  if (filters?.endDate)
    costQuery = costQuery.lte("competency_date", filters.endDate);
  const { data: costData } = await costQuery;
  const totalCost = (costData || []).reduce(
    (s: number, e: any) => s + Number(e.amount || 0),
    0
  );

  const margin = revenue - totalCost;
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

  return {
    total_revenue: revenue,
    total_cost: totalCost,
    estimated_margin: margin,
    margin_percent: marginPercent,
    companies_active: companiesCount || 0,
    units_active: unitsCount || 0,
    total_orders: totalOrders,
    total_files: totalFiles,
  };
}

export async function getCompanyComparisons(
  filters?: Filters
): Promise<CompanyComparison[]> {
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, brand_name, is_active")
    .eq("is_active", true)
    .order("name");

  if (!companies) return [];

  const comparisons: CompanyComparison[] = [];

  for (const c of companies) {
    const unitIds = await getUnitIdsByCompany(c.id);

    // Revenue
    const { revenue, orders } = await getRevenueForUnits(unitIds, filters);

    // Files
    let filesQ = supabase
      .from("received_files")
      .select("*", { count: "exact", head: true });
    if (unitIds.length > 0) filesQ = filesQ.in("unit_id", unitIds);
    if (filters?.startDate)
      filesQ = filesQ.gte("created_at", `${filters.startDate}T00:00:00`);
    if (filters?.endDate)
      filesQ = filesQ.lte("created_at", `${filters.endDate}T23:59:59`);
    const { count: filesCount } = await filesQ;

    // Files revenue
    let filesRevQ = supabase
      .from("received_files")
      .select("valor_brl");
    if (unitIds.length > 0) filesRevQ = filesRevQ.in("unit_id", unitIds);
    if (filters?.startDate)
      filesRevQ = filesRevQ.gte("created_at", `${filters.startDate}T00:00:00`);
    if (filters?.endDate)
      filesRevQ = filesRevQ.lte("created_at", `${filters.endDate}T23:59:59`);
    const { data: filesRevData } = await filesRevQ;
    const filesRev = (filesRevData || []).reduce(
      (s: number, f: any) => s + Number(f.valor_brl || 0),
      0
    );

    const totalRevenue = revenue + filesRev;

    // Cost (simplified - proportional or direct if available)
    const cost = 0; // Will improve when financial_entries has company_id
    const margin = totalRevenue - cost;
    const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

    comparisons.push({
      id: c.id,
      name: c.name,
      brand_name: c.brand_name,
      revenue: totalRevenue,
      cost,
      margin,
      margin_percent: marginPercent,
      orders,
      files: filesCount || 0,
      units: unitIds.length,
      growth_percent: null, // Requires historical comparison
    });
  }

  return comparisons.sort((a, b) => b.revenue - a.revenue);
}

export async function getMonthlyEvolution(
  filters?: Filters
): Promise<MonthlyEvolution[]> {
  let query = supabase
    .from("orders")
    .select("total_amount, status, created_at")
    .not("status", "in", `("${EXCLUDED_STATUSES.join('","')}")`)
    .order("created_at", { ascending: true });

  if (filters?.startDate)
    query = query.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    query = query.lte("created_at", `${filters.endDate}T23:59:59`);

  const { data } = await query;

  // Also get files revenue
  let filesQ = supabase
    .from("received_files")
    .select("valor_brl, created_at")
    .order("created_at", { ascending: true });
  if (filters?.startDate)
    filesQ = filesQ.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    filesQ = filesQ.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: filesData } = await filesQ;

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const grouped = new Map<string, MonthlyEvolution>();

  const getOrCreate = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        month: key,
        label: `${monthNames[date.getMonth()]}/${date.getFullYear()}`,
        revenue: 0,
        cost: 0,
        margin: 0,
      });
    }
    return grouped.get(key)!;
  };

  (data || []).forEach((o: any) => {
    const entry = getOrCreate(new Date(o.created_at));
    entry.revenue += Number(o.total_amount || 0);
  });

  (filesData || []).forEach((f: any) => {
    const entry = getOrCreate(new Date(f.created_at));
    entry.revenue += Number(f.valor_brl || 0);
  });

  // Calculate margin (revenue - cost)
  const result = Array.from(grouped.values());
  result.forEach((m) => {
    m.margin = m.revenue - m.cost;
  });

  return result;
}

export function deriveCeoAlerts(
  kpis: CeoKPIs,
  comparisons: CompanyComparison[]
): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = [];

  // Low margin warning
  if (kpis.margin_percent < 30 && kpis.total_revenue > 0) {
    alerts.push({
      type: "warning",
      title: "Margem abaixo do esperado",
      description: `Margem global está em ${kpis.margin_percent.toFixed(1)}%`,
    });
  }

  // Companies with zero revenue
  comparisons.forEach((c) => {
    if (c.revenue === 0 && c.units > 0) {
      alerts.push({
        type: "danger",
        title: "Empresa sem faturamento",
        description: `${c.name} não registrou faturamento no período`,
        company: c.name,
      });
    }
  });

  // Low files activity
  if (kpis.total_files === 0) {
    alerts.push({
      type: "warning",
      title: "Sem arquivos ECU no período",
      description: "Nenhum arquivo ECU foi registrado no período selecionado",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      title: "Indicadores saudáveis",
      description: "Nenhum alerta executivo no momento",
    });
  }

  return alerts;
}

// ── Company executive detail ───────────────────────────────

export interface CompanyExecutiveDetail {
  company: { id: string; name: string; brand_name: string | null };
  revenue: number;
  cost: number;
  margin: number;
  margin_percent: number;
  orders: number;
  files: number;
  units_count: number;
  customers_count: number;
  monthly: MonthlyEvolution[];
}

export async function getCompanyExecutiveDetail(
  companyId: string,
  filters?: Filters
): Promise<CompanyExecutiveDetail | null> {
  const { data: company } = await supabase
    .from("companies")
    .select("id, name, brand_name")
    .eq("id", companyId)
    .single();

  if (!company) return null;

  const unitIds = await getUnitIdsByCompany(companyId);

  // Revenue from orders
  const { revenue, orders } = await getRevenueForUnits(unitIds, filters);

  // Files
  let filesQ = supabase.from("received_files").select("valor_brl, created_at");
  if (unitIds.length > 0) filesQ = filesQ.in("unit_id", unitIds);
  if (filters?.startDate)
    filesQ = filesQ.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    filesQ = filesQ.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: filesData } = await filesQ;
  const filesRev = (filesData || []).reduce(
    (s: number, f: any) => s + Number(f.valor_brl || 0),
    0
  );

  const totalRevenue = revenue + filesRev;
  const cost = 0;
  const margin = totalRevenue - cost;
  const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  // Customers
  let custCount = 0;
  if (unitIds.length > 0) {
    const { count } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .in("unit_id", unitIds);
    custCount = count || 0;
  }

  // Monthly evolution for this company
  let ordersQ = supabase
    .from("orders")
    .select("total_amount, status, created_at, unit_id")
    .not("status", "in", `("${EXCLUDED_STATUSES.join('","')}")`)
    .order("created_at", { ascending: true });
  if (filters?.startDate)
    ordersQ = ordersQ.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    ordersQ = ordersQ.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: ordersMonthly } = await ordersQ;

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const grouped = new Map<string, MonthlyEvolution>();

  const getOrCreate = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        month: key,
        label: `${monthNames[date.getMonth()]}/${date.getFullYear()}`,
        revenue: 0,
        cost: 0,
        margin: 0,
      });
    }
    return grouped.get(key)!;
  };

  (ordersMonthly || [])
    .filter((o: any) => unitIds.includes(o.unit_id))
    .forEach((o: any) => {
      const entry = getOrCreate(new Date(o.created_at));
      entry.revenue += Number(o.total_amount || 0);
    });

  (filesData || []).forEach((f: any) => {
    const entry = getOrCreate(new Date(f.created_at));
    entry.revenue += Number(f.valor_brl || 0);
  });

  const monthly = Array.from(grouped.values());
  monthly.forEach((m) => (m.margin = m.revenue - m.cost));

  return {
    company: { id: company.id, name: company.name, brand_name: company.brand_name },
    revenue: totalRevenue,
    cost,
    margin,
    margin_percent: marginPercent,
    orders,
    files: (filesData || []).length,
    units_count: unitIds.length,
    customers_count: custCount,
    monthly,
  };
}

export type { Filters as CeoFilters };
