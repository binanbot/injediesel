/**
 * ceoCommercialTrendsService.ts
 * Monthly commercial+financial trend data for the CEO executive view.
 * Reuses raw data from crm_opportunities + profitabilityService patterns.
 * Does NOT duplicate existing analytics logic — focuses on monthly aggregation.
 */

import { supabase } from "@/integrations/supabase/client";

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
  // 1. Get active companies
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("is_active", true);

  if (!companies?.length) return [];

  // 2. Date range
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  const startStr = startDate.toISOString().slice(0, 10);

  // 3. Fetch all opportunities in range
  const { data: opps } = await supabase
    .from("crm_opportunities")
    .select("stage, estimated_value, created_at, closed_at, company_id")
    .gte("created_at", `${startStr}T00:00:00`);

  const allOpps: RawOpp[] = (opps || []) as RawOpp[];

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
    const companyOpps = allOpps.filter((o) => o.company_id === company.id);

    const months: MonthlyCommercialMetrics[] = allMonths.map((mk) => {
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
    };
  });
}
