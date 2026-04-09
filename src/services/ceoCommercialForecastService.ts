/**
 * ceoCommercialForecastService.ts
 * Predictive layer for CEO executive commercial intelligence.
 * Uses trend data to project month-end metrics and identify executive risks.
 */

import type { CompanyMonthlyTrend, TrendComparison } from "@/services/ceoCommercialTrendsService";

// ─── Types ───────────────────────────────────────────────────

export interface CompanyForecast {
  company_id: string;
  company_name: string;
  /** Projected metrics for current month (linear extrapolation) */
  projected_revenue: number;
  projected_cost_personnel: number;
  projected_margin_pct: number;
  projected_roi: number;
  projected_loss_value: number;
  projected_volume: number;
  projected_conversion: number;
  /** Day progress in current month (0-1) */
  month_progress: number;
}

export type RiskLevel = "critical" | "high" | "moderate" | "low";

export interface ExecutiveRisk {
  company_id: string;
  company_name: string;
  risk_type: string;
  label: string;
  description: string;
  level: RiskLevel;
  metric_current: number;
  metric_previous: number;
  delta: number;
}

export interface TrendDeviation {
  company_id: string;
  company_name: string;
  metric: string;
  label: string;
  direction: "above" | "below";
  current_value: number;
  trend_avg: number;
  deviation_pct: number;
}

// ─── Forecast Calculation ────────────────────────────────────

export function calcCompanyForecasts(
  trends: CompanyMonthlyTrend[]
): CompanyForecast[] {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const progress = Math.max(dayOfMonth / daysInMonth, 0.01);

  return trends.map((t) => {
    const curr = t.months.length > 0 ? t.months[t.months.length - 1] : null;
    if (!curr) {
      return {
        company_id: t.company_id,
        company_name: t.company_name,
        projected_revenue: 0,
        projected_cost_personnel: 0,
        projected_margin_pct: 0,
        projected_roi: 0,
        projected_loss_value: 0,
        projected_volume: 0,
        projected_conversion: 0,
        month_progress: progress,
      };
    }

    // Linear projection: current partial ÷ progress
    const projRevenue = curr.revenue / progress;
    const projCost = curr.cost_personnel / progress;
    const projLoss = curr.estimated_loss_value / progress;
    const projVolume = Math.round(curr.total_opps / progress);
    const projMarginPct = projRevenue > 0
      ? ((projRevenue - (curr.cost_total / progress)) / projRevenue) * 100
      : 0;
    const projRoi = projCost > 0 ? (projRevenue / projCost) * 100 : 0;

    return {
      company_id: t.company_id,
      company_name: t.company_name,
      projected_revenue: projRevenue,
      projected_cost_personnel: projCost,
      projected_margin_pct: projMarginPct,
      projected_roi: projRoi,
      projected_loss_value: projLoss,
      projected_volume: projVolume,
      projected_conversion: curr.conversion_rate, // conversion doesn't scale linearly
      month_progress: progress,
    };
  });
}

// ─── Risk Detection ──────────────────────────────────────────

export function detectExecutiveRisks(
  comparisons: TrendComparison[],
  trends: CompanyMonthlyTrend[]
): ExecutiveRisk[] {
  const risks: ExecutiveRisk[] = [];

  for (const tc of comparisons) {
    // 1. Margin deterioration
    if (tc.margin_delta < -5) {
      risks.push({
        company_id: tc.company_id,
        company_name: tc.company_name,
        risk_type: "margin_deterioration",
        label: "Deterioração de Margem",
        description: `Margem caiu ${Math.abs(tc.margin_delta).toFixed(1)}pp vs mês anterior`,
        level: tc.margin_delta < -15 ? "critical" : tc.margin_delta < -10 ? "high" : "moderate",
        metric_current: tc.current_margin_pct,
        metric_previous: tc.prev_margin_pct,
        delta: tc.margin_delta,
      });
    }

    // 2. Conversion drop
    if (tc.conversion_delta < -5) {
      risks.push({
        company_id: tc.company_id,
        company_name: tc.company_name,
        risk_type: "conversion_drop",
        label: "Queda de Conversão",
        description: `Conversão caiu ${Math.abs(tc.conversion_delta).toFixed(1)}pp vs mês anterior`,
        level: tc.conversion_delta < -15 ? "critical" : tc.conversion_delta < -10 ? "high" : "moderate",
        metric_current: tc.current_conversion,
        metric_previous: tc.prev_conversion,
        delta: tc.conversion_delta,
      });
    }

    // 3. Cost growth without revenue growth
    if (tc.revenue_delta_pct < 5 && tc.current_roi < tc.prev_roi && tc.roi_delta < -10) {
      risks.push({
        company_id: tc.company_id,
        company_name: tc.company_name,
        risk_type: "cost_inefficiency",
        label: "Custo Sem Retorno",
        description: `ROI caiu ${Math.abs(tc.roi_delta).toFixed(0)}pp sem ganho de receita`,
        level: tc.roi_delta < -30 ? "critical" : "high",
        metric_current: tc.current_roi,
        metric_previous: tc.prev_roi,
        delta: tc.roi_delta,
      });
    }

    // 4. Loss acceleration
    if (tc.loss_delta_pct > 50 && tc.current_loss_value > 0) {
      risks.push({
        company_id: tc.company_id,
        company_name: tc.company_name,
        risk_type: "loss_acceleration",
        label: "Perda em Aceleração",
        description: `Perdas cresceram ${tc.loss_delta_pct.toFixed(0)}% vs mês anterior`,
        level: tc.loss_delta_pct > 100 ? "critical" : "high",
        metric_current: tc.current_loss_value,
        metric_previous: tc.prev_loss_value,
        delta: tc.loss_delta_pct,
      });
    }

    // 5. Worsening cycle (check trend data for 3+ month pattern)
    const trend = trends.find((t) => t.company_id === tc.company_id);
    if (trend && trend.months.length >= 3) {
      const last3 = trend.months.slice(-3);
      const cycles = last3.map((m) => m.avg_cycle_hours).filter((h): h is number => h !== null);
      if (cycles.length >= 3 && cycles[2] > cycles[1] && cycles[1] > cycles[0]) {
        risks.push({
          company_id: tc.company_id,
          company_name: tc.company_name,
          risk_type: "cycle_worsening",
          label: "Ciclo em Piora Contínua",
          description: `Ciclo crescendo há 3 meses: ${cycles.map((c) => `${Math.round(c)}h`).join(" → ")}`,
          level: "moderate",
          metric_current: cycles[2],
          metric_previous: cycles[0],
          delta: cycles[2] - cycles[0],
        });
      }
    }

    // 6. ROI in decline
    if (tc.roi_delta < -20) {
      const existing = risks.find(
        (r) => r.company_id === tc.company_id && r.risk_type === "cost_inefficiency"
      );
      if (!existing) {
        risks.push({
          company_id: tc.company_id,
          company_name: tc.company_name,
          risk_type: "roi_decline",
          label: "ROI em Queda",
          description: `ROI Comercial caiu ${Math.abs(tc.roi_delta).toFixed(0)}pp`,
          level: tc.roi_delta < -40 ? "critical" : "high",
          metric_current: tc.current_roi,
          metric_previous: tc.prev_roi,
          delta: tc.roi_delta,
        });
      }
    }
  }

  // Sort by severity
  const levelOrder: Record<RiskLevel, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
  risks.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  return risks;
}

// ─── Trend Deviation Analysis ────────────────────────────────

export function calcTrendDeviations(
  trends: CompanyMonthlyTrend[]
): TrendDeviation[] {
  const deviations: TrendDeviation[] = [];

  for (const t of trends) {
    if (t.months.length < 3) continue;

    const curr = t.months[t.months.length - 1];
    // Avg of all months except the last
    const prevMonths = t.months.slice(0, -1);

    const metrics: { key: keyof typeof curr; label: string; invertBetter?: boolean }[] = [
      { key: "conversion_rate", label: "Conversão" },
      { key: "revenue", label: "Receita" },
      { key: "margin_pct", label: "Margem %" },
      { key: "commercial_roi", label: "ROI Comercial" },
      { key: "estimated_loss_value", label: "Perdas", invertBetter: true },
    ];

    for (const m of metrics) {
      const currVal = curr[m.key] as number | null;
      if (currVal === null) continue;

      const avg =
        prevMonths.reduce((s, pm) => s + (Number(pm[m.key]) || 0), 0) / prevMonths.length;

      if (avg === 0) continue;

      const devPct = ((currVal - avg) / Math.abs(avg)) * 100;

      // Only report significant deviations (>15%)
      if (Math.abs(devPct) < 15) continue;

      const isAbove = devPct > 0;
      const direction: "above" | "below" = isAbove ? "above" : "below";

      deviations.push({
        company_id: t.company_id,
        company_name: t.company_name,
        metric: m.key,
        label: m.label,
        direction,
        current_value: currVal,
        trend_avg: avg,
        deviation_pct: devPct,
      });
    }
  }

  // Sort by absolute deviation descending
  deviations.sort((a, b) => Math.abs(b.deviation_pct) - Math.abs(a.deviation_pct));

  return deviations;
}
