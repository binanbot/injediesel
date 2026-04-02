import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────

export interface GoalDefinition {
  id: string;
  company_id: string | null;
  company_name: string | null;
  metric_key: string;
  target_value: number;
  objective_label: string;
  period_start: string;
  period_end: string;
}

export interface GoalProgress extends GoalDefinition {
  actual_value: number;
  progress_percent: number;
  status: "atingida" | "saudável" | "em risco" | "crítica";
}

export interface OkrObjective {
  label: string;
  results: GoalProgress[];
  avg_progress: number;
  status: GoalProgress["status"];
}

export interface GoalsSummary {
  total: number;
  achieved: number;
  healthy: number;
  at_risk: number;
  critical: number;
  avg_progress: number;
  best_company: string | null;
  worst_company: string | null;
}

export interface GoalInsight {
  type: "success" | "warning" | "danger";
  title: string;
  description: string;
  metric?: string;
}

type Filters = { startDate?: string; endDate?: string };

const EXCLUDED = ["cancelado", "reembolsado"];

const METRIC_LABELS: Record<string, string> = {
  revenue: "Faturamento",
  cost: "Custo",
  margin_percent: "Margem (%)",
  growth_percent: "Crescimento (%)",
  activation_rate: "Ativação (%)",
  orders: "Pedidos",
  files: "Arquivos ECU",
};

export function getMetricLabel(key: string): string {
  return METRIC_LABELS[key] || key;
}

// ── Helpers ────────────────────────────────────────────────

function deriveStatus(progress: number, daysRemaining: number, totalDays: number): GoalProgress["status"] {
  if (progress >= 100) return "atingida";
  const timeProgress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 100;
  if (progress >= timeProgress * 0.85) return "saudável";
  if (progress >= timeProgress * 0.6) return "em risco";
  return "crítica";
}

async function fetchActualValue(
  metricKey: string,
  filters: Filters,
  companyUnitIds: string[] | null
): Promise<number> {
  switch (metricKey) {
    case "revenue": {
      let oq = supabase
        .from("orders")
        .select("total_amount, unit_id")
        .not("status", "in", `("${EXCLUDED.join('","')}")`);
      if (filters.startDate) oq = oq.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters.endDate) oq = oq.lte("created_at", `${filters.endDate}T23:59:59`);
      const { data: orders } = await oq;

      let fq = supabase.from("received_files").select("valor_brl, unit_id");
      if (companyUnitIds) fq = fq.in("unit_id", companyUnitIds);
      if (filters.startDate) fq = fq.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters.endDate) fq = fq.lte("created_at", `${filters.endDate}T23:59:59`);
      const { data: files } = await fq;

      let rev = 0;
      (orders || []).forEach((o: any) => {
        if (companyUnitIds && !companyUnitIds.includes(o.unit_id)) return;
        rev += Number(o.total_amount || 0);
      });
      (files || []).forEach((f: any) => { rev += Number(f.valor_brl || 0); });
      return rev;
    }
    case "cost": {
      let q = supabase.from("financial_entries").select("amount").eq("entry_type", "despesa");
      if (filters.startDate) q = q.gte("competency_date", filters.startDate);
      if (filters.endDate) q = q.lte("competency_date", filters.endDate);
      const { data } = await q;
      return (data || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    }
    case "orders": {
      let q = supabase
        .from("orders")
        .select("id, unit_id")
        .not("status", "in", `("${EXCLUDED.join('","')}")`);
      if (filters.startDate) q = q.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters.endDate) q = q.lte("created_at", `${filters.endDate}T23:59:59`);
      const { data } = await q;
      const rows = companyUnitIds
        ? (data || []).filter((o: any) => companyUnitIds.includes(o.unit_id))
        : data || [];
      return rows.length;
    }
    case "files": {
      let q = supabase.from("received_files").select("id, unit_id");
      if (companyUnitIds) q = q.in("unit_id", companyUnitIds);
      if (filters.startDate) q = q.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters.endDate) q = q.lte("created_at", `${filters.endDate}T23:59:59`);
      const { data } = await q;
      return (data || []).length;
    }
    case "activation_rate": {
      const { data: allUnits } = await supabase.from("units").select("id").eq("is_active", true);
      const totalUnits = companyUnitIds ? companyUnitIds.length : (allUnits || []).length;
      if (totalUnits === 0) return 0;

      let oq = supabase.from("orders").select("unit_id").not("status", "in", `("${EXCLUDED.join('","')}")`);
      if (filters.startDate) oq = oq.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters.endDate) oq = oq.lte("created_at", `${filters.endDate}T23:59:59`);
      const { data: orders } = await oq;

      let fq = supabase.from("received_files").select("unit_id");
      if (companyUnitIds) fq = fq.in("unit_id", companyUnitIds);
      if (filters.startDate) fq = fq.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters.endDate) fq = fq.lte("created_at", `${filters.endDate}T23:59:59`);
      const { data: files } = await fq;

      const active = new Set<string>();
      (orders || []).forEach((o: any) => {
        if (!companyUnitIds || companyUnitIds.includes(o.unit_id)) active.add(o.unit_id);
      });
      (files || []).forEach((f: any) => active.add(f.unit_id));
      return (active.size / totalUnits) * 100;
    }
    case "margin_percent": {
      const rev = await fetchActualValue("revenue", filters, companyUnitIds);
      const cost = await fetchActualValue("cost", filters, companyUnitIds);
      return rev > 0 ? ((rev - cost) / rev) * 100 : 0;
    }
    case "growth_percent": {
      // Compare current period vs same-length previous period
      if (!filters.startDate || !filters.endDate) return 0;
      const s = new Date(filters.startDate);
      const e = new Date(filters.endDate);
      const diff = e.getTime() - s.getTime();
      const prevEnd = new Date(s.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - diff);
      const prev = {
        startDate: prevStart.toISOString().slice(0, 10),
        endDate: prevEnd.toISOString().slice(0, 10),
      };
      const [curRev, prevRev] = await Promise.all([
        fetchActualValue("revenue", filters, companyUnitIds),
        fetchActualValue("revenue", prev, companyUnitIds),
      ]);
      if (prevRev === 0) return curRev > 0 ? 100 : 0;
      return ((curRev - prevRev) / prevRev) * 100;
    }
    default:
      return 0;
  }
}

// ── Main exports ───────────────────────────────────────────

export async function getGoalsWithProgress(filters: Filters): Promise<GoalProgress[]> {
  const { data: goals } = await supabase
    .from("executive_goals")
    .select("*")
    .eq("is_active", true)
    .lte("period_start", filters.endDate || new Date().toISOString().slice(0, 10))
    .gte("period_end", filters.startDate || "2020-01-01")
    .order("objective_label");

  if (!goals || goals.length === 0) return [];

  // Get company names
  const companyIds = [...new Set((goals as any[]).filter((g) => g.company_id).map((g) => g.company_id))];
  const { data: companies } = companyIds.length > 0
    ? await supabase.from("companies").select("id, name").in("id", companyIds)
    : { data: [] };
  const companyMap = new Map((companies || []).map((c: any) => [c.id, c.name]));

  // Get unit IDs per company
  const unitCache = new Map<string, string[]>();
  for (const cid of companyIds) {
    const { data } = await supabase.from("units").select("id").eq("company_id", cid);
    unitCache.set(cid, (data || []).map((u) => u.id));
  }

  const results: GoalProgress[] = [];
  for (const g of goals as any[]) {
    const goalFilters = {
      startDate: g.period_start,
      endDate: g.period_end,
    };
    const unitIds = g.company_id ? (unitCache.get(g.company_id) || []) : null;
    const actual = await fetchActualValue(g.metric_key, goalFilters, unitIds);

    const now = new Date();
    const end = new Date(g.period_end);
    const start = new Date(g.period_start);
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

    // For cost metric, lower is better — invert progress
    let progress: number;
    if (g.metric_key === "cost") {
      progress = g.target_value > 0 ? Math.max(0, (1 - (actual - g.target_value) / g.target_value)) * 100 : 100;
      progress = Math.min(progress, 200);
    } else {
      progress = g.target_value > 0 ? (actual / g.target_value) * 100 : 0;
    }

    results.push({
      id: g.id,
      company_id: g.company_id,
      company_name: g.company_id ? companyMap.get(g.company_id) || null : null,
      metric_key: g.metric_key,
      target_value: Number(g.target_value),
      objective_label: g.objective_label,
      period_start: g.period_start,
      period_end: g.period_end,
      actual_value: actual,
      progress_percent: Math.round(progress * 10) / 10,
      status: deriveStatus(progress, daysRemaining, totalDays),
    });
  }

  return results;
}

export function buildOkrObjectives(goals: GoalProgress[]): OkrObjective[] {
  const map = new Map<string, GoalProgress[]>();
  goals.forEach((g) => {
    const list = map.get(g.objective_label) || [];
    list.push(g);
    map.set(g.objective_label, list);
  });

  return Array.from(map.entries()).map(([label, results]) => {
    const avg = results.reduce((s, r) => s + r.progress_percent, 0) / results.length;
    const hasAnyCritical = results.some((r) => r.status === "crítica");
    const hasAnyAtRisk = results.some((r) => r.status === "em risco");
    const allAchieved = results.every((r) => r.status === "atingida");
    const status: GoalProgress["status"] = allAchieved
      ? "atingida"
      : hasAnyCritical
      ? "crítica"
      : hasAnyAtRisk
      ? "em risco"
      : "saudável";

    return { label, results, avg_progress: avg, status };
  });
}

export function deriveGoalsSummary(goals: GoalProgress[]): GoalsSummary {
  const achieved = goals.filter((g) => g.status === "atingida").length;
  const healthy = goals.filter((g) => g.status === "saudável").length;
  const atRisk = goals.filter((g) => g.status === "em risco").length;
  const critical = goals.filter((g) => g.status === "crítica").length;
  const avg = goals.length > 0 ? goals.reduce((s, g) => s + g.progress_percent, 0) / goals.length : 0;

  // Best/worst company
  const companyScores = new Map<string, { total: number; count: number }>();
  goals.forEach((g) => {
    const name = g.company_name || "Global";
    const cur = companyScores.get(name) || { total: 0, count: 0 };
    cur.total += g.progress_percent;
    cur.count++;
    companyScores.set(name, cur);
  });
  let best: string | null = null;
  let worst: string | null = null;
  let bestAvg = -1;
  let worstAvg = Infinity;
  companyScores.forEach((v, k) => {
    const a = v.total / v.count;
    if (a > bestAvg) { bestAvg = a; best = k; }
    if (a < worstAvg) { worstAvg = a; worst = k; }
  });

  return { total: goals.length, achieved, healthy, at_risk: atRisk, critical, avg_progress: avg, best_company: best, worst_company: worst };
}

export function deriveGoalInsights(goals: GoalProgress[]): GoalInsight[] {
  const insights: GoalInsight[] = [];

  const achieved = goals.filter((g) => g.status === "atingida");
  if (achieved.length > 0) {
    insights.push({
      type: "success",
      title: `${achieved.length} meta(s) atingida(s)`,
      description: achieved.map((g) => `${getMetricLabel(g.metric_key)}${g.company_name ? ` (${g.company_name})` : ""}`).slice(0, 3).join(", "),
      metric: `${achieved.length}/${goals.length}`,
    });
  }

  const critical = goals.filter((g) => g.status === "crítica");
  if (critical.length > 0) {
    insights.push({
      type: "danger",
      title: `${critical.length} meta(s) em situação crítica`,
      description: critical.map((g) => `${getMetricLabel(g.metric_key)} (${g.progress_percent.toFixed(0)}%)`).slice(0, 3).join(", "),
      metric: `${critical.length} crítica(s)`,
    });
  }

  const atRisk = goals.filter((g) => g.status === "em risco");
  if (atRisk.length > 0) {
    insights.push({
      type: "warning",
      title: `${atRisk.length} meta(s) em risco`,
      description: atRisk.map((g) => `${getMetricLabel(g.metric_key)} (${g.progress_percent.toFixed(0)}%)`).slice(0, 3).join(", "),
      metric: `${atRisk.length} em risco`,
    });
  }

  const exceeded = goals.filter((g) => g.progress_percent > 120);
  if (exceeded.length > 0) {
    insights.push({
      type: "success",
      title: "Metas superadas",
      description: exceeded.map((g) => `${getMetricLabel(g.metric_key)} (${g.progress_percent.toFixed(0)}%)`).slice(0, 3).join(", "),
      metric: `${exceeded.length} superada(s)`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success",
      title: "Sem metas cadastradas no período",
      description: "Cadastre metas executivas para acompanhar o progresso do grupo",
    });
  }

  return insights;
}
