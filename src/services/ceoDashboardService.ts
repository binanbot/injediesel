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
  activation_rate: number; // units with activity / total units
  // MoM comparisons
  prev_revenue: number;
  prev_cost: number;
  prev_margin: number;
  revenue_variation: number; // %
  cost_variation: number;
  margin_variation: number;
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

async function getOrdersRevenue(
  filters?: { startDate?: string; endDate?: string },
  unitIds?: string[]
): Promise<{ revenue: number; orders: number; unitIdsWithActivity: Set<string> }> {
  let query = supabase
    .from("orders")
    .select("total_amount, status, unit_id")
    .not("status", "in", `("${EXCLUDED_STATUSES.join('","')}")`);

  if (filters?.startDate)
    query = query.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    query = query.lte("created_at", `${filters.endDate}T23:59:59`);

  const { data } = await query;
  const rows = unitIds
    ? (data || []).filter((o: any) => unitIds.includes(o.unit_id))
    : data || [];

  const activeUnits = new Set<string>();
  let revenue = 0;
  rows.forEach((o: any) => {
    revenue += Number(o.total_amount || 0);
    if (o.unit_id) activeUnits.add(o.unit_id);
  });
  return { revenue, orders: rows.length, unitIdsWithActivity: activeUnits };
}

async function getFilesRevenue(
  filters?: { startDate?: string; endDate?: string },
  unitIds?: string[]
): Promise<{ revenue: number; count: number; unitIdsWithActivity: Set<string> }> {
  let query = supabase.from("received_files").select("valor_brl, unit_id");
  if (unitIds && unitIds.length > 0) query = query.in("unit_id", unitIds);
  if (filters?.startDate)
    query = query.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    query = query.lte("created_at", `${filters.endDate}T23:59:59`);

  const { data } = await query;
  const activeUnits = new Set<string>();
  let revenue = 0;
  (data || []).forEach((f: any) => {
    revenue += Number(f.valor_brl || 0);
    if (f.unit_id) activeUnits.add(f.unit_id);
  });
  return { revenue, count: (data || []).length, unitIdsWithActivity: activeUnits };
}

async function getCosts(
  filters?: { startDate?: string; endDate?: string }
): Promise<number> {
  let query = supabase
    .from("financial_entries")
    .select("amount")
    .eq("entry_type", "despesa");
  if (filters?.startDate)
    query = query.gte("competency_date", filters.startDate);
  if (filters?.endDate)
    query = query.lte("competency_date", filters.endDate);
  const { data } = await query;
  return (data || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
}

function calcVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function getPreviousPeriod(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1); // day before start
  const prevStart = new Date(prevEnd.getTime() - diffMs);
  return {
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  };
}

// ── Main Functions ─────────────────────────────────────────

export async function getCeoKPIs(filters?: Filters): Promise<CeoKPIs> {
  const [companiesRes, unitsRes] = await Promise.all([
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("units")
      .select("id", { count: "exact" })
      .eq("is_active", true),
  ]);

  const companiesCount = companiesRes.count || 0;
  const unitsCount = unitsRes.count || 0;
  const allUnitIds = (unitsRes.data || []).map((u) => u.id);

  // Current period
  const [ordersResult, filesResult, totalCost] = await Promise.all([
    getOrdersRevenue(filters),
    getFilesRevenue(filters),
    getCosts(filters),
  ]);

  const revenue = ordersResult.revenue + filesResult.revenue;
  const margin = revenue - totalCost;
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

  // Activation rate
  const activeUnits = new Set([
    ...ordersResult.unitIdsWithActivity,
    ...filesResult.unitIdsWithActivity,
  ]);
  const activationRate =
    allUnitIds.length > 0 ? (activeUnits.size / allUnitIds.length) * 100 : 0;

  // Previous period for MoM
  let prevRevenue = 0;
  let prevCost = 0;
  let prevMargin = 0;
  if (filters?.startDate && filters?.endDate) {
    const prev = getPreviousPeriod(filters.startDate, filters.endDate);
    const [prevOrders, prevFiles, prevCostVal] = await Promise.all([
      getOrdersRevenue(prev),
      getFilesRevenue(prev),
      getCosts(prev),
    ]);
    prevRevenue = prevOrders.revenue + prevFiles.revenue;
    prevCost = prevCostVal;
    prevMargin = prevRevenue - prevCost;
  }

  return {
    total_revenue: revenue,
    total_cost: totalCost,
    estimated_margin: margin,
    margin_percent: marginPercent,
    companies_active: companiesCount,
    units_active: unitsCount,
    total_orders: ordersResult.orders,
    total_files: filesResult.count,
    activation_rate: activationRate,
    prev_revenue: prevRevenue,
    prev_cost: prevCost,
    prev_margin: prevMargin,
    revenue_variation: calcVariation(revenue, prevRevenue),
    cost_variation: calcVariation(totalCost, prevCost),
    margin_variation: calcVariation(margin, prevMargin),
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
  const prev =
    filters?.startDate && filters?.endDate
      ? getPreviousPeriod(filters.startDate, filters.endDate)
      : null;

  for (const c of companies) {
    const unitIds = await getUnitIdsByCompany(c.id);

    const [ordersResult, filesResult] = await Promise.all([
      getOrdersRevenue(filters, unitIds),
      getFilesRevenue(filters, unitIds),
    ]);

    const totalRevenue = ordersResult.revenue + filesResult.revenue;
    const cost = 0;
    const margin = totalRevenue - cost;
    const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

    // Growth vs previous period
    let growthPercent: number | null = null;
    if (prev) {
      const [prevOrders, prevFiles] = await Promise.all([
        getOrdersRevenue(prev, unitIds),
        getFilesRevenue(prev, unitIds),
      ]);
      const prevRevenue = prevOrders.revenue + prevFiles.revenue;
      growthPercent = calcVariation(totalRevenue, prevRevenue);
    }

    comparisons.push({
      id: c.id,
      name: c.name,
      brand_name: c.brand_name,
      revenue: totalRevenue,
      cost,
      margin,
      margin_percent: marginPercent,
      orders: ordersResult.orders,
      files: filesResult.count,
      units: unitIds.length,
      growth_percent: growthPercent,
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

  let filesQ = supabase
    .from("received_files")
    .select("valor_brl, created_at")
    .order("created_at", { ascending: true });
  if (filters?.startDate)
    filesQ = filesQ.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    filesQ = filesQ.lte("created_at", `${filters.endDate}T23:59:59`);

  const [{ data }, { data: filesData }] = await Promise.all([query, filesQ]);

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
    getOrCreate(new Date(o.created_at)).revenue += Number(o.total_amount || 0);
  });

  (filesData || []).forEach((f: any) => {
    getOrCreate(new Date(f.created_at)).revenue += Number(f.valor_brl || 0);
  });

  const result = Array.from(grouped.values());
  result.forEach((m) => (m.margin = m.revenue - m.cost));
  return result;
}

export function deriveCeoAlerts(
  kpis: CeoKPIs,
  comparisons: CompanyComparison[]
): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = [];

  // Revenue declining
  if (kpis.revenue_variation < -10 && kpis.prev_revenue > 0) {
    alerts.push({
      type: "danger",
      title: "Queda de faturamento",
      description: `Faturamento caiu ${Math.abs(kpis.revenue_variation).toFixed(1)}% vs período anterior`,
    });
  }

  // Cost growing faster than revenue
  if (
    kpis.cost_variation > 0 &&
    kpis.revenue_variation >= 0 &&
    kpis.cost_variation > kpis.revenue_variation + 10
  ) {
    alerts.push({
      type: "warning",
      title: "Custo crescendo acima da receita",
      description: `Custo +${kpis.cost_variation.toFixed(1)}% vs receita +${kpis.revenue_variation.toFixed(1)}%`,
    });
  }

  // Low margin
  if (kpis.margin_percent < 30 && kpis.total_revenue > 0) {
    alerts.push({
      type: "warning",
      title: "Margem abaixo do esperado",
      description: `Margem global está em ${kpis.margin_percent.toFixed(1)}%`,
    });
  }

  // Low activation
  if (kpis.activation_rate < 50 && kpis.units_active > 1) {
    alerts.push({
      type: "warning",
      title: "Baixa ativação operacional",
      description: `Apenas ${kpis.activation_rate.toFixed(0)}% das unidades tiveram atividade no período`,
    });
  }

  // Companies losing performance
  comparisons.forEach((c) => {
    if (c.growth_percent !== null && c.growth_percent < -20) {
      alerts.push({
        type: "danger",
        title: `${c.name} em queda`,
        description: `Faturamento caiu ${Math.abs(c.growth_percent).toFixed(1)}% vs período anterior`,
        company: c.name,
      });
    }
    if (c.revenue === 0 && c.units > 0) {
      alerts.push({
        type: "danger",
        title: "Empresa sem faturamento",
        description: `${c.name} não registrou faturamento no período`,
        company: c.name,
      });
    }
  });

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

// ── Company Executive Detail (expanded) ────────────────────

export interface UnitPerformance {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  revenue: number;
  orders: number;
  files: number;
  customers: number;
}

export interface RankedItem {
  name: string;
  value: number;
  count?: number;
}

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
  activation_rate: number;
  monthly: MonthlyEvolution[];
  unit_rankings: UnitPerformance[];
  top_clients: RankedItem[];
  top_products: RankedItem[];
  category_breakdown: RankedItem[];
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

  // Get units with details
  const { data: unitsData } = await supabase
    .from("units")
    .select("id, name, city, state")
    .eq("company_id", companyId);
  const units = unitsData || [];
  const unitIds = units.map((u) => u.id);

  if (unitIds.length === 0) {
    return {
      company: { id: company.id, name: company.name, brand_name: company.brand_name },
      revenue: 0, cost: 0, margin: 0, margin_percent: 0,
      orders: 0, files: 0, units_count: 0, customers_count: 0,
      activation_rate: 0, monthly: [], unit_rankings: [],
      top_clients: [], top_products: [], category_breakdown: [],
    };
  }

  // ── Orders with item details ───────────────────────────
  let ordersQ = supabase
    .from("orders")
    .select("id, total_amount, status, unit_id, franchise_profile_id, created_at")
    .not("status", "in", `("${EXCLUDED_STATUSES.join('","')}")`)
    .order("created_at", { ascending: true });
  if (filters?.startDate)
    ordersQ = ordersQ.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    ordersQ = ordersQ.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: allOrders } = await ordersQ;

  const companyOrders = (allOrders || []).filter((o: any) =>
    unitIds.includes(o.unit_id)
  );
  const orderIds = companyOrders.map((o: any) => o.id);

  const ordersRevenue = companyOrders.reduce(
    (s: number, o: any) => s + Number(o.total_amount || 0),
    0
  );

  // ── Files ──────────────────────────────────────────────
  let filesQ = supabase
    .from("received_files")
    .select("valor_brl, unit_id, customer_id, servico, created_at")
    .in("unit_id", unitIds);
  if (filters?.startDate)
    filesQ = filesQ.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate)
    filesQ = filesQ.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: filesData } = await filesQ;

  const filesRevenue = (filesData || []).reduce(
    (s: number, f: any) => s + Number(f.valor_brl || 0),
    0
  );

  const totalRevenue = ordersRevenue + filesRevenue;
  const cost = 0;
  const margin = totalRevenue - cost;
  const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  // ── Customers count ────────────────────────────────────
  const { count: custCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .in("unit_id", unitIds);

  // ── Activation rate ────────────────────────────────────
  const activeUnitsSet = new Set<string>();
  companyOrders.forEach((o: any) => {
    if (o.unit_id) activeUnitsSet.add(o.unit_id);
  });
  (filesData || []).forEach((f: any) => {
    if (f.unit_id) activeUnitsSet.add(f.unit_id);
  });
  const activationRate = unitIds.length > 0 ? (activeUnitsSet.size / unitIds.length) * 100 : 0;

  // ── Unit rankings ──────────────────────────────────────
  const unitMap = new Map<string, UnitPerformance>();
  units.forEach((u) => {
    unitMap.set(u.id, {
      id: u.id,
      name: u.name,
      city: u.city,
      state: u.state,
      revenue: 0,
      orders: 0,
      files: 0,
      customers: 0,
    });
  });

  companyOrders.forEach((o: any) => {
    const u = unitMap.get(o.unit_id);
    if (u) {
      u.revenue += Number(o.total_amount || 0);
      u.orders += 1;
    }
  });

  (filesData || []).forEach((f: any) => {
    const u = unitMap.get(f.unit_id);
    if (u) {
      u.revenue += Number(f.valor_brl || 0);
      u.files += 1;
    }
  });

  // Count customers per unit
  if (unitIds.length > 0) {
    const { data: customersByUnit } = await supabase
      .from("customers")
      .select("unit_id")
      .in("unit_id", unitIds);
    (customersByUnit || []).forEach((c: any) => {
      const u = unitMap.get(c.unit_id);
      if (u) u.customers += 1;
    });
  }

  const unitRankings = Array.from(unitMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  // ── Top clients (by file value) ────────────────────────
  const clientRevMap = new Map<string, number>();
  (filesData || []).forEach((f: any) => {
    if (f.customer_id) {
      clientRevMap.set(
        f.customer_id,
        (clientRevMap.get(f.customer_id) || 0) + Number(f.valor_brl || 0)
      );
    }
  });

  // Get customer names
  const topClientIds = Array.from(clientRevMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  let topClients: RankedItem[] = [];
  if (topClientIds.length > 0) {
    const { data: clientNames } = await supabase
      .from("customers")
      .select("id, full_name")
      .in("id", topClientIds);

    const nameMap = new Map(
      (clientNames || []).map((c: any) => [c.id, c.full_name])
    );
    topClients = topClientIds.map((id) => ({
      name: nameMap.get(id) || "Cliente",
      value: clientRevMap.get(id) || 0,
    }));
  }

  // ── Top products (by order items) ──────────────────────
  let topProducts: RankedItem[] = [];
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, line_total, quantity")
      .in("order_id", orderIds);

    const prodMap = new Map<string, { value: number; count: number }>();
    (items || []).forEach((item: any) => {
      const key = item.product_name;
      const existing = prodMap.get(key) || { value: 0, count: 0 };
      existing.value += Number(item.line_total || 0);
      existing.count += Number(item.quantity || 0);
      prodMap.set(key, existing);
    });

    topProducts = Array.from(prodMap.entries())
      .map(([name, { value, count }]) => ({ name, value, count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  // ── Category breakdown (files by servico) ──────────────
  const catMap = new Map<string, { value: number; count: number }>();
  (filesData || []).forEach((f: any) => {
    const key = f.servico || "Outros";
    const existing = catMap.get(key) || { value: 0, count: 0 };
    existing.value += Number(f.valor_brl || 0);
    existing.count += 1;
    catMap.set(key, existing);
  });
  const categoryBreakdown = Array.from(catMap.entries())
    .map(([name, { value, count }]) => ({ name, value, count }))
    .sort((a, b) => b.value - a.value);

  // ── Monthly evolution ──────────────────────────────────
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

  companyOrders.forEach((o: any) => {
    getOrCreate(new Date(o.created_at)).revenue += Number(o.total_amount || 0);
  });
  (filesData || []).forEach((f: any) => {
    getOrCreate(new Date(f.created_at)).revenue += Number(f.valor_brl || 0);
  });

  const monthly = Array.from(grouped.values());
  monthly.forEach((m) => (m.margin = m.revenue - m.cost));

  return {
    company: { id: company.id, name: company.name, brand_name: company.brand_name },
    revenue: totalRevenue,
    cost,
    margin,
    margin_percent: marginPercent,
    orders: companyOrders.length,
    files: (filesData || []).length,
    units_count: unitIds.length,
    customers_count: custCount || 0,
    activation_rate: activationRate,
    monthly,
    unit_rankings: unitRankings,
    top_clients: topClients,
    top_products: topProducts,
    category_breakdown: categoryBreakdown,
  };
}

export type { Filters as CeoFilters };
