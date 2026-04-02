import { supabase } from "@/integrations/supabase/client";
import type { CompanyComparison, MonthlyEvolution } from "./ceoDashboardService";

// ── Types ──────────────────────────────────────────────────

export interface GrowthKPIs {
  revenue: number;
  cost: number;
  margin: number;
  margin_percent: number;
  prev_revenue: number;
  prev_cost: number;
  prev_margin: number;
  revenue_growth: number; // %
  cost_growth: number;
  margin_growth: number;
  ticket_medio: number;
  activation_rate: number;
  units_total: number;
  units_active: number;
  total_orders: number;
  total_files: number;
}

export interface CompanyGrowthItem {
  id: string;
  name: string;
  revenue: number;
  prev_revenue: number;
  growth_percent: number;
  cost: number;
  margin: number;
  margin_percent: number;
  prev_margin_percent: number;
  margin_delta: number; // pp change
  orders: number;
  files: number;
  units: number;
}

export interface UnitGrowthItem {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  revenue: number;
  prev_revenue: number;
  growth_percent: number;
}

export interface GrowthInsight {
  type: "success" | "warning" | "danger";
  title: string;
  description: string;
  metric?: string;
}

type Filters = { startDate?: string; endDate?: string };

const EXCLUDED = ["cancelado", "reembolsado"];

// ── Helpers ────────────────────────────────────────────────

function getPreviousPeriod(startDate: string, endDate: string) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diff = e.getTime() - s.getTime();
  const prevEnd = new Date(s.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diff);
  return {
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  };
}

function variation(cur: number, prev: number): number {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

async function fetchRevenue(filters?: Filters, unitIds?: string[]) {
  let oq = supabase
    .from("orders")
    .select("total_amount, unit_id")
    .not("status", "in", `("${EXCLUDED.join('","')}")`);
  if (filters?.startDate) oq = oq.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) oq = oq.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: orders } = await oq;

  let fq = supabase.from("received_files").select("valor_brl, unit_id");
  if (unitIds) fq = fq.in("unit_id", unitIds);
  if (filters?.startDate) fq = fq.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) fq = fq.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: files } = await fq;

  const activeUnits = new Set<string>();
  let revenue = 0;
  let orderCount = 0;
  (orders || []).forEach((o: any) => {
    if (unitIds && !unitIds.includes(o.unit_id)) return;
    revenue += Number(o.total_amount || 0);
    orderCount++;
    if (o.unit_id) activeUnits.add(o.unit_id);
  });
  let fileCount = 0;
  (files || []).forEach((f: any) => {
    revenue += Number(f.valor_brl || 0);
    fileCount++;
    if (f.unit_id) activeUnits.add(f.unit_id);
  });

  return { revenue, orders: orderCount, files: fileCount, activeUnits };
}

async function fetchCost(filters?: Filters): Promise<number> {
  let q = supabase.from("financial_entries").select("amount").eq("entry_type", "despesa");
  if (filters?.startDate) q = q.gte("competency_date", filters.startDate);
  if (filters?.endDate) q = q.lte("competency_date", filters.endDate);
  const { data } = await q;
  return (data || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
}

// ── Main exports ───────────────────────────────────────────

export async function getGrowthKPIs(filters: Filters): Promise<GrowthKPIs> {
  const { data: allUnits } = await supabase.from("units").select("id").eq("is_active", true);
  const totalUnits = (allUnits || []).length;

  const [cur, cost] = await Promise.all([fetchRevenue(filters), fetchCost(filters)]);
  const margin = cur.revenue - cost;
  const marginPct = cur.revenue > 0 ? (margin / cur.revenue) * 100 : 0;

  const prev = getPreviousPeriod(filters.startDate!, filters.endDate!);
  const [prevData, prevCost] = await Promise.all([fetchRevenue(prev), fetchCost(prev)]);
  const prevMargin = prevData.revenue - prevCost;

  return {
    revenue: cur.revenue,
    cost,
    margin,
    margin_percent: marginPct,
    prev_revenue: prevData.revenue,
    prev_cost: prevCost,
    prev_margin: prevMargin,
    revenue_growth: variation(cur.revenue, prevData.revenue),
    cost_growth: variation(cost, prevCost),
    margin_growth: variation(margin, prevMargin),
    ticket_medio: cur.orders > 0 ? cur.revenue / cur.orders : 0,
    activation_rate: totalUnits > 0 ? (cur.activeUnits.size / totalUnits) * 100 : 0,
    units_total: totalUnits,
    units_active: cur.activeUnits.size,
    total_orders: cur.orders,
    total_files: cur.files,
  };
}

export async function getCompanyGrowthRanking(filters: Filters): Promise<CompanyGrowthItem[]> {
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, brand_name")
    .eq("is_active", true);
  if (!companies) return [];

  const prev = getPreviousPeriod(filters.startDate!, filters.endDate!);
  const results: CompanyGrowthItem[] = [];

  for (const c of companies) {
    const { data: units } = await supabase.from("units").select("id").eq("company_id", c.id);
    const uids = (units || []).map((u) => u.id);
    if (uids.length === 0) {
      results.push({
        id: c.id, name: c.name, revenue: 0, prev_revenue: 0, growth_percent: 0,
        cost: 0, margin: 0, margin_percent: 0, prev_margin_percent: 0, margin_delta: 0,
        orders: 0, files: 0, units: 0,
      });
      continue;
    }

    const [cur, prevData] = await Promise.all([
      fetchRevenue(filters, uids),
      fetchRevenue(prev, uids),
    ]);

    const marginPct = cur.revenue > 0 ? 100 : 0; // simplified (no per-company cost yet)
    const prevMarginPct = prevData.revenue > 0 ? 100 : 0;

    results.push({
      id: c.id,
      name: c.name,
      revenue: cur.revenue,
      prev_revenue: prevData.revenue,
      growth_percent: variation(cur.revenue, prevData.revenue),
      cost: 0,
      margin: cur.revenue,
      margin_percent: marginPct,
      prev_margin_percent: prevMarginPct,
      margin_delta: marginPct - prevMarginPct,
      orders: cur.orders,
      files: cur.files,
      units: uids.length,
    });
  }

  return results.sort((a, b) => b.growth_percent - a.growth_percent);
}

export async function getUnitGrowthRanking(filters: Filters): Promise<UnitGrowthItem[]> {
  const { data: units } = await supabase
    .from("units")
    .select("id, name, city, state")
    .eq("is_active", true);
  if (!units) return [];

  const prev = getPreviousPeriod(filters.startDate!, filters.endDate!);
  const results: UnitGrowthItem[] = [];

  // Batch fetch all orders and files for the two periods
  const [curOrders, curFiles, prevOrders, prevFiles] = await Promise.all([
    supabase.from("orders").select("total_amount, unit_id")
      .not("status", "in", `("${EXCLUDED.join('","')}")`)
      .gte("created_at", `${filters.startDate}T00:00:00`)
      .lte("created_at", `${filters.endDate}T23:59:59`),
    supabase.from("received_files").select("valor_brl, unit_id")
      .gte("created_at", `${filters.startDate}T00:00:00`)
      .lte("created_at", `${filters.endDate}T23:59:59`),
    supabase.from("orders").select("total_amount, unit_id")
      .not("status", "in", `("${EXCLUDED.join('","')}")`)
      .gte("created_at", `${prev.startDate}T00:00:00`)
      .lte("created_at", `${prev.endDate}T23:59:59`),
    supabase.from("received_files").select("valor_brl, unit_id")
      .gte("created_at", `${prev.startDate}T00:00:00`)
      .lte("created_at", `${prev.endDate}T23:59:59`),
  ]);

  const aggregate = (orders: any[], files: any[]) => {
    const map = new Map<string, number>();
    orders.forEach((o: any) => {
      map.set(o.unit_id, (map.get(o.unit_id) || 0) + Number(o.total_amount || 0));
    });
    files.forEach((f: any) => {
      map.set(f.unit_id, (map.get(f.unit_id) || 0) + Number(f.valor_brl || 0));
    });
    return map;
  };

  const curMap = aggregate(curOrders.data || [], curFiles.data || []);
  const prevMap = aggregate(prevOrders.data || [], prevFiles.data || []);

  for (const u of units) {
    const rev = curMap.get(u.id) || 0;
    const prevRev = prevMap.get(u.id) || 0;
    results.push({
      id: u.id,
      name: u.name,
      city: u.city,
      state: u.state,
      revenue: rev,
      prev_revenue: prevRev,
      growth_percent: variation(rev, prevRev),
    });
  }

  return results.sort((a, b) => b.revenue - a.revenue);
}

export function deriveGrowthInsights(
  kpis: GrowthKPIs,
  companies: CompanyGrowthItem[]
): GrowthInsight[] {
  const insights: GrowthInsight[] = [];

  // Accelerating companies
  const accelerating = companies.filter((c) => c.growth_percent > 20 && c.revenue > 0);
  if (accelerating.length > 0) {
    insights.push({
      type: "success",
      title: "Empresas em aceleração",
      description: accelerating.map((c) => `${c.name} (+${c.growth_percent.toFixed(0)}%)`).join(", "),
      metric: `${accelerating.length} empresa(s)`,
    });
  }

  // Decelerating companies
  const decelerating = companies.filter((c) => c.growth_percent < -10 && c.prev_revenue > 0);
  if (decelerating.length > 0) {
    insights.push({
      type: "danger",
      title: "Empresas em desaceleração",
      description: decelerating.map((c) => `${c.name} (${c.growth_percent.toFixed(0)}%)`).join(", "),
      metric: `${decelerating.length} empresa(s)`,
    });
  }

  // Cost growing above revenue
  if (kpis.cost_growth > 0 && kpis.revenue_growth >= 0 && kpis.cost_growth > kpis.revenue_growth + 5) {
    insights.push({
      type: "warning",
      title: "Custo crescendo acima da receita",
      description: `Custo +${kpis.cost_growth.toFixed(1)}% vs Receita +${kpis.revenue_growth.toFixed(1)}%`,
      metric: `Δ ${(kpis.cost_growth - kpis.revenue_growth).toFixed(1)}pp`,
    });
  }

  // Best margin
  const bestMargin = companies.filter((c) => c.revenue > 0).sort((a, b) => b.margin_percent - a.margin_percent)[0];
  if (bestMargin) {
    insights.push({
      type: "success",
      title: "Melhor margem",
      description: `${bestMargin.name} com margem de ${bestMargin.margin_percent.toFixed(1)}%`,
      metric: `${bestMargin.margin_percent.toFixed(1)}%`,
    });
  }

  // Revenue decline
  if (kpis.revenue_growth < -10 && kpis.prev_revenue > 0) {
    insights.push({
      type: "danger",
      title: "Queda significativa de receita",
      description: `Receita caiu ${Math.abs(kpis.revenue_growth).toFixed(1)}% em relação ao período anterior`,
      metric: `${kpis.revenue_growth.toFixed(1)}%`,
    });
  }

  // Low activation
  if (kpis.activation_rate < 50 && kpis.units_total > 1) {
    insights.push({
      type: "warning",
      title: "Baixa ativação operacional",
      description: `Apenas ${kpis.units_active} de ${kpis.units_total} unidades ativas no período`,
      metric: `${kpis.activation_rate.toFixed(0)}%`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success",
      title: "Crescimento saudável",
      description: "Nenhum alerta de crescimento no período selecionado",
    });
  }

  return insights;
}
