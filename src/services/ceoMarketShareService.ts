import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────

export interface ShareItem {
  id: string;
  name: string;
  revenue: number;
  share_percent: number;
  prev_revenue: number;
  prev_share_percent: number;
  share_delta: number; // pp change
  units?: number;
}

export interface CategoryShare {
  name: string;
  revenue: number;
  share_percent: number;
  prev_revenue: number;
  prev_share_percent: number;
  share_delta: number;
  count: number;
}

export interface MarketShareKPIs {
  total_revenue: number;
  leader_name: string;
  leader_share: number;
  leader_share_delta: number;
  top3_share: number;
  top10_units_share: number;
  hhi: number; // Herfindahl-Hirschman Index (0-10000)
  concentration_level: "baixa" | "moderada" | "alta" | "muito alta";
  revenue_outside_leader: number;
  diversification_percent: number;
}

export interface ShareInsight {
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

async function fetchRevenueByUnit(filters?: Filters) {
  let oq = supabase
    .from("orders")
    .select("total_amount, unit_id")
    .not("status", "in", `("${EXCLUDED.join('","')}")`);
  if (filters?.startDate) oq = oq.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) oq = oq.lte("created_at", `${filters.endDate}T23:59:59`);

  let fq = supabase.from("received_files").select("valor_brl, unit_id");
  if (filters?.startDate) fq = fq.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) fq = fq.lte("created_at", `${filters.endDate}T23:59:59`);

  const [{ data: orders }, { data: files }] = await Promise.all([oq, fq]);

  const map = new Map<string, number>();
  (orders || []).forEach((o: any) => {
    if (!o.unit_id) return;
    map.set(o.unit_id, (map.get(o.unit_id) || 0) + Number(o.total_amount || 0));
  });
  (files || []).forEach((f: any) => {
    if (!f.unit_id) return;
    map.set(f.unit_id, (map.get(f.unit_id) || 0) + Number(f.valor_brl || 0));
  });
  return map;
}

async function fetchCategoryRevenue(filters?: Filters) {
  let q = supabase.from("received_files").select("valor_brl, servico");
  if (filters?.startDate) q = q.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) q = q.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data } = await q;

  const map = new Map<string, { revenue: number; count: number }>();
  (data || []).forEach((f: any) => {
    const key = f.servico || "Outros";
    const cur = map.get(key) || { revenue: 0, count: 0 };
    cur.revenue += Number(f.valor_brl || 0);
    cur.count++;
    map.set(key, cur);
  });
  return map;
}

function calcHHI(shares: number[]): number {
  return shares.reduce((sum, s) => sum + s * s, 0);
}

function concentrationLevel(hhi: number): MarketShareKPIs["concentration_level"] {
  if (hhi < 1500) return "baixa";
  if (hhi < 2500) return "moderada";
  if (hhi < 5000) return "alta";
  return "muito alta";
}

// ── Main exports ───────────────────────────────────────────

export async function getCompanyShares(filters: Filters): Promise<ShareItem[]> {
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("is_active", true);
  if (!companies) return [];

  const { data: units } = await supabase.from("units").select("id, company_id");
  const unitCompanyMap = new Map<string, string>();
  (units || []).forEach((u) => { if (u.company_id) unitCompanyMap.set(u.id, u.company_id); });

  const prev = getPreviousPeriod(filters.startDate!, filters.endDate!);
  const [curMap, prevMap] = await Promise.all([
    fetchRevenueByUnit(filters),
    fetchRevenueByUnit(prev),
  ]);

  // Aggregate by company
  const companyRevCur = new Map<string, number>();
  const companyRevPrev = new Map<string, number>();
  const companyUnits = new Map<string, number>();

  companies.forEach((c) => { companyRevCur.set(c.id, 0); companyRevPrev.set(c.id, 0); companyUnits.set(c.id, 0); });

  for (const [unitId, rev] of curMap) {
    const cid = unitCompanyMap.get(unitId);
    if (cid && companyRevCur.has(cid)) companyRevCur.set(cid, companyRevCur.get(cid)! + rev);
  }
  for (const [unitId, rev] of prevMap) {
    const cid = unitCompanyMap.get(unitId);
    if (cid && companyRevPrev.has(cid)) companyRevPrev.set(cid, companyRevPrev.get(cid)! + rev);
  }
  (units || []).forEach((u) => {
    if (u.company_id && companyUnits.has(u.company_id))
      companyUnits.set(u.company_id, companyUnits.get(u.company_id)! + 1);
  });

  const totalCur = Array.from(companyRevCur.values()).reduce((a, b) => a + b, 0);
  const totalPrev = Array.from(companyRevPrev.values()).reduce((a, b) => a + b, 0);

  return companies
    .map((c) => {
      const rev = companyRevCur.get(c.id) || 0;
      const prevRev = companyRevPrev.get(c.id) || 0;
      const share = totalCur > 0 ? (rev / totalCur) * 100 : 0;
      const prevShare = totalPrev > 0 ? (prevRev / totalPrev) * 100 : 0;
      return {
        id: c.id,
        name: c.name,
        revenue: rev,
        share_percent: share,
        prev_revenue: prevRev,
        prev_share_percent: prevShare,
        share_delta: share - prevShare,
        units: companyUnits.get(c.id) || 0,
      };
    })
    .sort((a, b) => b.share_percent - a.share_percent);
}

export async function getUnitShares(filters: Filters): Promise<ShareItem[]> {
  const { data: unitsData } = await supabase
    .from("units")
    .select("id, name")
    .eq("is_active", true);
  if (!unitsData) return [];

  const prev = getPreviousPeriod(filters.startDate!, filters.endDate!);
  const [curMap, prevMap] = await Promise.all([
    fetchRevenueByUnit(filters),
    fetchRevenueByUnit(prev),
  ]);

  const totalCur = Array.from(curMap.values()).reduce((a, b) => a + b, 0);
  const totalPrev = Array.from(prevMap.values()).reduce((a, b) => a + b, 0);

  return unitsData
    .map((u) => {
      const rev = curMap.get(u.id) || 0;
      const prevRev = prevMap.get(u.id) || 0;
      const share = totalCur > 0 ? (rev / totalCur) * 100 : 0;
      const prevShare = totalPrev > 0 ? (prevRev / totalPrev) * 100 : 0;
      return {
        id: u.id,
        name: u.name,
        revenue: rev,
        share_percent: share,
        prev_revenue: prevRev,
        prev_share_percent: prevShare,
        share_delta: share - prevShare,
      };
    })
    .sort((a, b) => b.share_percent - a.share_percent);
}

export async function getCategoryShares(filters: Filters): Promise<CategoryShare[]> {
  const prev = getPreviousPeriod(filters.startDate!, filters.endDate!);
  const [curMap, prevMap] = await Promise.all([
    fetchCategoryRevenue(filters),
    fetchCategoryRevenue(prev),
  ]);

  const totalCur = Array.from(curMap.values()).reduce((a, b) => a + b.revenue, 0);
  const totalPrev = Array.from(prevMap.values()).reduce((a, b) => a + b.revenue, 0);

  const allKeys = new Set([...curMap.keys(), ...prevMap.keys()]);
  return Array.from(allKeys)
    .map((key) => {
      const cur = curMap.get(key) || { revenue: 0, count: 0 };
      const prevData = prevMap.get(key) || { revenue: 0, count: 0 };
      const share = totalCur > 0 ? (cur.revenue / totalCur) * 100 : 0;
      const prevShare = totalPrev > 0 ? (prevData.revenue / totalPrev) * 100 : 0;
      return {
        name: key,
        revenue: cur.revenue,
        share_percent: share,
        prev_revenue: prevData.revenue,
        prev_share_percent: prevShare,
        share_delta: share - prevShare,
        count: cur.count,
      };
    })
    .sort((a, b) => b.share_percent - a.share_percent);
}

export function deriveMarketShareKPIs(
  companyShares: ShareItem[],
  unitShares: ShareItem[]
): MarketShareKPIs {
  const totalRevenue = companyShares.reduce((s, c) => s + c.revenue, 0);
  const sorted = [...companyShares].sort((a, b) => b.share_percent - a.share_percent);
  const leader = sorted[0];
  const top3Share = sorted.slice(0, 3).reduce((s, c) => s + c.share_percent, 0);

  const unitsSorted = [...unitShares].sort((a, b) => b.share_percent - a.share_percent);
  const top10UnitsShare = unitsSorted.slice(0, 10).reduce((s, u) => s + u.share_percent, 0);

  const hhi = calcHHI(companyShares.map((c) => c.share_percent));

  return {
    total_revenue: totalRevenue,
    leader_name: leader?.name || "—",
    leader_share: leader?.share_percent || 0,
    leader_share_delta: leader?.share_delta || 0,
    top3_share: top3Share,
    top10_units_share: top10UnitsShare,
    hhi: Math.round(hhi),
    concentration_level: concentrationLevel(hhi),
    revenue_outside_leader: leader ? 100 - leader.share_percent : 100,
    diversification_percent: leader ? 100 - leader.share_percent : 100,
  };
}

export function deriveShareInsights(
  kpis: MarketShareKPIs,
  companyShares: ShareItem[],
  unitShares: ShareItem[]
): ShareInsight[] {
  const insights: ShareInsight[] = [];

  // Excessive leader concentration
  if (kpis.leader_share > 70) {
    insights.push({
      type: "danger",
      title: "Concentração excessiva no líder",
      description: `${kpis.leader_name} concentra ${kpis.leader_share.toFixed(1)}% do faturamento total`,
      metric: `${kpis.leader_share.toFixed(1)}%`,
    });
  } else if (kpis.leader_share > 50) {
    insights.push({
      type: "warning",
      title: "Alta dependência da empresa líder",
      description: `${kpis.leader_name} responde por ${kpis.leader_share.toFixed(1)}% da receita do grupo`,
      metric: `${kpis.leader_share.toFixed(1)}%`,
    });
  }

  // Top 3 concentration
  if (kpis.top3_share > 90 && companyShares.length > 3) {
    insights.push({
      type: "warning",
      title: "Top 3 empresas concentram quase toda receita",
      description: `As 3 maiores empresas respondem por ${kpis.top3_share.toFixed(1)}% do faturamento`,
      metric: `${kpis.top3_share.toFixed(1)}%`,
    });
  }

  // Companies gaining share
  const gaining = companyShares.filter((c) => c.share_delta > 3 && c.revenue > 0);
  if (gaining.length > 0) {
    insights.push({
      type: "success",
      title: "Empresas ganhando participação",
      description: gaining.map((c) => `${c.name} (+${c.share_delta.toFixed(1)}pp)`).join(", "),
      metric: `${gaining.length} empresa(s)`,
    });
  }

  // Companies losing share
  const losing = companyShares.filter((c) => c.share_delta < -3 && c.prev_revenue > 0);
  if (losing.length > 0) {
    insights.push({
      type: "danger",
      title: "Empresas perdendo participação",
      description: losing.map((c) => `${c.name} (${c.share_delta.toFixed(1)}pp)`).join(", "),
      metric: `${losing.length} empresa(s)`,
    });
  }

  // Unit concentration
  const top10Units = unitShares.slice(0, 10);
  if (top10Units.length >= 10 && kpis.top10_units_share > 80 && unitShares.length > 15) {
    insights.push({
      type: "warning",
      title: "Dependência de poucas unidades",
      description: `As 10 maiores unidades representam ${kpis.top10_units_share.toFixed(1)}% do faturamento`,
      metric: `${kpis.top10_units_share.toFixed(1)}%`,
    });
  }

  // Good diversification
  if (kpis.diversification_percent > 60 && companyShares.length > 2) {
    insights.push({
      type: "success",
      title: "Boa diversificação",
      description: `${kpis.diversification_percent.toFixed(1)}% da receita vem de empresas além da líder`,
      metric: `${kpis.diversification_percent.toFixed(1)}%`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success",
      title: "Participação equilibrada",
      description: "Nenhum alerta de concentração no período analisado",
    });
  }

  return insights;
}
