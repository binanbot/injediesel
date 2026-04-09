/**
 * ceoCommercialTrendsService.ts
 * Monthly commercial+financial trend data for the CEO executive view.
 * Combines CRM opportunity data with financial metrics (revenue, cost, margin).
 */

import { supabase } from "@/integrations/supabase/client";
import { EXCLUDED_ORDER_STATUSES } from "@/services/commercialEligibilityService";

// ─── Types ───────────────────────────────────────────────────

export interface MonthlyCommercialMetrics {
  month: string; // "2026-01"
  label: string; // "Jan/26"
  total_opps: number;
  won: number;
  lost: number;
  conversion_rate: number;
  avg_cycle_hours: number | null;
  estimated_loss_value: number;
  // Financial
  revenue: number;
  cost_personnel: number;
  cost_total: number;
  margin: number;
  margin_pct: number;
  commercial_roi: number; // (revenue / cost_personnel) * 100
}

export interface CompanyMonthlyTrend {
  company_id: string;
  company_name: string;
  months: MonthlyCommercialMetrics[];
}

export interface TrendComparison {
  company_id: string;
  company_name: string;
  current_conversion: number;
  prev_conversion: number;
  conversion_delta: number; // pp
  current_cycle: number | null;
  prev_cycle: number | null;
  current_loss_value: number;
  prev_loss_value: number;
  loss_delta_pct: number;
  // Financial MoM
  current_revenue: number;
  prev_revenue: number;
  revenue_delta_pct: number;
  current_margin_pct: number;
  prev_margin_pct: number;
  margin_delta: number; // pp
  current_roi: number;
  prev_roi: number;
  roi_delta: number; // pp
}

// ─── Helpers ─────────────────────────────────────────────────

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTH_LABELS[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

function cycleHours(createdAt: string, closedAt: string | null): number | null {
  if (!closedAt) return null;
  const h =
    (new Date(closedAt).getTime() - new Date(createdAt).getTime()) /
    (1000 * 60 * 60);
  return h >= 0 && h < 8760 ? h : null;
}

interface RawOpp {
  stage: string;
  estimated_value: number;
  created_at: string;
  closed_at: string | null;
  company_id: string;
}

// ─── Main Function ───────────────────────────────────────────

export async function fetchCommercialTrends(
  monthsBack = 6
): Promise<CompanyMonthlyTrend[]> {
  // 1. Get active companies + their units
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("is_active", true);

  if (!companies?.length) return [];

  // 2. Date range
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  const startStr = startDate.toISOString().slice(0, 10);

  // 3. Fetch all data in parallel
  const [oppsRes, ordersRes, filesRes, empCostsRes, opCostsRes, finEntriesRes, unitsRes] = await Promise.all([
    supabase
      .from("crm_opportunities")
      .select("stage, estimated_value, created_at, closed_at, company_id")
      .gte("created_at", `${startStr}T00:00:00`),
    supabase
      .from("orders")
      .select("total_amount, status, unit_id, created_at")
      .gte("created_at", `${startStr}T00:00:00`),
    supabase
      .from("received_files")
      .select("valor_brl, unit_id, created_at")
      .gte("created_at", `${startStr}T00:00:00`),
    supabase
      .from("employee_costs")
      .select("amount_brl, company_id, effective_from, effective_until, is_recurring"),
    supabase
      .from("operational_costs")
      .select("amount_brl, company_id, competency_month"),
    supabase
      .from("financial_entries")
      .select("entry_type, amount, company_id, competency_date")
      .gte("competency_date", startStr),
    supabase
      .from("units")
      .select("id, company_id"),
  ]);

  const allOpps: RawOpp[] = (oppsRes.data || []) as RawOpp[];
  const allOrders = ordersRes.data || [];
  const allFiles = filesRes.data || [];
  const empCosts = empCostsRes.data || [];
  const opCosts = opCostsRes.data || [];
  const finEntries = finEntriesRes.data || [];
  const units = unitsRes.data || [];

  // Build unit → company map
  const unitCompany = new Map<string, string>();
  for (const u of units) unitCompany.set(u.id, u.company_id);

  // 4. Generate all month keys
  const allMonths: string[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1 + i, 1);
    allMonths.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  // 5. Group by company → month
  const results: CompanyMonthlyTrend[] = companies.map((company) => {
    const companyUnitIds = new Set(units.filter(u => u.company_id === company.id).map(u => u.id));

    const companyOpps = allOpps.filter((o) => o.company_id === company.id);
    const companyOrders = allOrders.filter((o) => o.unit_id && companyUnitIds.has(o.unit_id));
    const companyFiles = allFiles.filter((f) => f.unit_id && companyUnitIds.has(f.unit_id));
    const companyEmpCosts = empCosts.filter((c) => c.company_id === company.id);
    const companyOpCosts = opCosts.filter((c) => c.company_id === company.id);
    const companyFinEntries = finEntries.filter((e) => e.company_id === company.id);

    const months: MonthlyCommercialMetrics[] = allMonths.map((mk) => {
      // CRM metrics
      const monthOpps = companyOpps.filter((o) => monthKey(o.created_at) === mk);
      const won = monthOpps.filter((o) => o.stage === "fechado_ganho").length;
      const lost = monthOpps.filter((o) => o.stage === "fechado_perdido").length;
      const closed = won + lost;
      const cycles = monthOpps
        .map((o) => cycleHours(o.created_at, o.closed_at))
        .filter((h): h is number => h !== null);
      const lostValue = monthOpps
        .filter((o) => o.stage === "fechado_perdido")
        .reduce((s, o) => s + Number(o.estimated_value), 0);

      // Revenue: orders + files + financial receita
      const ordersRev = companyOrders
        .filter((o) => monthKey(o.created_at) === mk && !EXCLUDED_ORDER_STATUSES.includes(o.status as any))
        .reduce((s, o) => s + Number(o.total_amount), 0);
      const filesRev = companyFiles
        .filter((f) => monthKey(f.created_at) === mk)
        .reduce((s, f) => s + Number(f.valor_brl || 0), 0);
      const finRev = companyFinEntries
        .filter((e) => e.entry_type === "receita" && monthKey(e.competency_date) === mk)
        .reduce((s, e) => s + Number(e.amount), 0);
      const revenue = ordersRev + filesRev + finRev;

      // Costs: employee (recurring spread) + operational + financial despesa
      const [mkYear, mkMonth] = mk.split("-").map(Number);
      const monthStart = new Date(mkYear, mkMonth - 1, 1);
      const monthEnd = new Date(mkYear, mkMonth, 0);
      const empCostMonth = companyEmpCosts
        .filter((c) => {
          if (!c.is_recurring) return false;
          const from = new Date(c.effective_from);
          const until = c.effective_until ? new Date(c.effective_until) : null;
          return from <= monthEnd && (!until || until >= monthStart);
        })
        .reduce((s, c) => s + Number(c.amount_brl), 0);
      const opCostMonth = companyOpCosts
        .filter((c) => monthKey(c.competency_month) === mk)
        .reduce((s, c) => s + Number(c.amount_brl), 0);
      const finCost = companyFinEntries
        .filter((e) => e.entry_type === "despesa" && monthKey(e.competency_date) === mk)
        .reduce((s, e) => s + Number(e.amount), 0);
      const costPersonnel = empCostMonth;
      const costTotal = empCostMonth + opCostMonth + finCost;

      const margin = revenue - costTotal;
      const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
      const commercialRoi = costPersonnel > 0 ? (revenue / costPersonnel) * 100 : 0;

      return {
        month: mk,
        label: monthLabel(mk),
        total_opps: monthOpps.length,
        won,
        lost,
        conversion_rate: closed > 0 ? (won / closed) * 100 : 0,
        avg_cycle_hours:
          cycles.length > 0
            ? cycles.reduce((s, h) => s + h, 0) / cycles.length
            : null,
        estimated_loss_value: lostValue,
        revenue,
        cost_personnel: costPersonnel,
        cost_total: costTotal,
        margin,
        margin_pct: marginPct,
        commercial_roi: commercialRoi,
      };
    });

    return {
      company_id: company.id,
      company_name: company.name,
      months,
    };
  });

  return results;
}

// ─── Trend Comparison (current month vs previous) ────────────

export function calcTrendComparisons(
  trends: CompanyMonthlyTrend[]
): TrendComparison[] {
  return trends.map((t) => {
    const m = t.months;
    const curr = m.length > 0 ? m[m.length - 1] : null;
    const prev = m.length > 1 ? m[m.length - 2] : null;

    const currConv = curr?.conversion_rate || 0;
    const prevConv = prev?.conversion_rate || 0;
    const currLoss = curr?.estimated_loss_value || 0;
    const prevLoss = prev?.estimated_loss_value || 0;
    const currRev = curr?.revenue || 0;
    const prevRev = prev?.revenue || 0;
    const currMarginPct = curr?.margin_pct || 0;
    const prevMarginPct = prev?.margin_pct || 0;
    const currRoi = curr?.commercial_roi || 0;
    const prevRoi = prev?.commercial_roi || 0;

    return {
      company_id: t.company_id,
      company_name: t.company_name,
      current_conversion: currConv,
      prev_conversion: prevConv,
      conversion_delta: currConv - prevConv,
      current_cycle: curr?.avg_cycle_hours ?? null,
      prev_cycle: prev?.avg_cycle_hours ?? null,
      current_loss_value: currLoss,
      prev_loss_value: prevLoss,
      loss_delta_pct:
        prevLoss > 0 ? ((currLoss - prevLoss) / prevLoss) * 100 : currLoss > 0 ? 100 : 0,
      current_revenue: currRev,
      prev_revenue: prevRev,
      revenue_delta_pct:
        prevRev > 0 ? ((currRev - prevRev) / prevRev) * 100 : currRev > 0 ? 100 : 0,
      current_margin_pct: currMarginPct,
      prev_margin_pct: prevMarginPct,
      margin_delta: currMarginPct - prevMarginPct,
      current_roi: currRoi,
      prev_roi: prevRoi,
      roi_delta: currRoi - prevRoi,
    };
  });
}
