import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency } from "@/utils/ceoFormatters";
import { getCeoKPIs, getCompanyComparisons, deriveCeoAlerts, type CeoKPIs, type CompanyComparison, type ExecutiveAlert } from "./ceoDashboardService";
import { getGrowthKPIs, getCompanyGrowthRanking, deriveGrowthInsights, type GrowthKPIs, type CompanyGrowthItem, type GrowthInsight } from "./ceoGrowthService";
import { getCompanyShares, deriveMarketShareKPIs, deriveShareInsights, type ShareItem, type MarketShareKPIs, type ShareInsight } from "./ceoMarketShareService";
import { getGoalsWithProgress, deriveGoalsSummary, deriveGoalInsights, type GoalProgress, type GoalsSummary, type GoalInsight } from "./ceoGoalsService";

// ── Types ──────────────────────────────────────────────────

export interface ExecutiveReport {
  period: { startDate: string; endDate: string };
  companyName?: string;
  financial: CeoKPIs;
  growth: GrowthKPIs;
  companies: CompanyComparison[];
  companyGrowth: CompanyGrowthItem[];
  shares: ShareItem[];
  shareKPIs: MarketShareKPIs;
  goals: GoalProgress[];
  goalsSummary: GoalsSummary;
  alerts: ExecutiveAlert[];
  growthInsights: GrowthInsight[];
  shareInsights: ShareInsight[];
  goalInsights: GoalInsight[];
  highlights: ReportHighlight[];
  risks: ReportRisk[];
  narrative: string;
}

export interface ReportHighlight {
  type: "success" | "info";
  title: string;
  detail: string;
}

export interface ReportRisk {
  severity: "high" | "medium";
  title: string;
  detail: string;
}

type Filters = { startDate: string; endDate: string; companyId?: string };

// ── Main ───────────────────────────────────────────────────

export async function buildExecutiveReport(filters: Filters): Promise<ExecutiveReport> {
  // Resolve company name if scoped
  let companyName: string | undefined;
  if (filters.companyId) {
    const { data } = await supabase
      .from("companies")
      .select("name")
      .eq("id", filters.companyId)
      .single();
    companyName = data?.name || undefined;
  }

  const [financial, growth, companies, companyGrowth, shares, goals] = await Promise.all([
    getCeoKPIs(filters),
    getGrowthKPIs(filters),
    getCompanyComparisons(filters),
    getCompanyGrowthRanking(filters),
    getCompanyShares(filters),
    getGoalsWithProgress(filters),
  ]);

  // If scoped to a company, filter company-level arrays
  const scopedCompanies = filters.companyId
    ? companies.filter((c) => c.id === filters.companyId)
    : companies;
  const scopedGrowth = filters.companyId
    ? companyGrowth.filter((c) => c.id === filters.companyId)
    : companyGrowth;
  const scopedShares = filters.companyId
    ? shares.filter((s) => s.id === filters.companyId)
    : shares;
  const scopedGoals = filters.companyId
    ? goals.filter((g) => !g.company_id || g.company_id === filters.companyId)
    : goals;

  const shareKPIs = deriveMarketShareKPIs(scopedShares, []);
  const goalsSummary = deriveGoalsSummary(scopedGoals);
  const alerts = deriveCeoAlerts(financial, scopedCompanies);
  const growthInsights = deriveGrowthInsights(growth, scopedGrowth);
  const shareInsights = deriveShareInsights(shareKPIs, scopedShares, []);
  const goalInsights = deriveGoalInsights(scopedGoals);

  const highlights = deriveHighlights(financial, growth, goalsSummary, scopedCompanies);
  const risks = deriveRisks(financial, growth, shareKPIs, goalsSummary, scopedCompanies);
  const narrative = buildNarrative(financial, growth, shareKPIs, goalsSummary, companyName);

  return {
    period: filters,
    companyName,
    financial,
    growth,
    companies: scopedCompanies,
    companyGrowth: scopedGrowth,
    shares: scopedShares,
    shareKPIs,
    goals: scopedGoals,
    goalsSummary,
    alerts,
    growthInsights,
    shareInsights,
    goalInsights,
    highlights,
    risks,
    narrative,
  };
}

// ── Derived helpers ────────────────────────────────────────

function deriveHighlights(
  fin: CeoKPIs,
  growth: GrowthKPIs,
  goals: GoalsSummary,
  companies: CompanyComparison[]
): ReportHighlight[] {
  const h: ReportHighlight[] = [];

  if (growth.revenue_growth > 10)
    h.push({ type: "success", title: "Crescimento expressivo", detail: `Receita cresceu ${growth.revenue_growth.toFixed(1)}% vs período anterior` });

  if (fin.margin_percent >= 30)
    h.push({ type: "success", title: "Margem saudável", detail: `Margem global de ${fin.margin_percent.toFixed(1)}%` });

  if (fin.activation_rate >= 70)
    h.push({ type: "success", title: "Alta ativação", detail: `${fin.activation_rate.toFixed(0)}% das unidades ativas no período` });

  if (goals.achieved > 0)
    h.push({ type: "success", title: "Metas atingidas", detail: `${goals.achieved} de ${goals.total} metas atingidas` });

  const topGrower = [...companies].sort((a, b) => (b.growth_percent || 0) - (a.growth_percent || 0))[0];
  if (topGrower && topGrower.growth_percent && topGrower.growth_percent > 0)
    h.push({ type: "info", title: `Destaque: ${topGrower.name}`, detail: `Crescimento de ${topGrower.growth_percent.toFixed(1)}% no período` });

  return h;
}

function deriveRisks(
  fin: CeoKPIs,
  growth: GrowthKPIs,
  share: MarketShareKPIs,
  goals: GoalsSummary,
  companies: CompanyComparison[]
): ReportRisk[] {
  const r: ReportRisk[] = [];

  if (growth.revenue_growth < -5 && fin.prev_revenue > 0)
    r.push({ severity: "high", title: "Queda de receita", detail: `Receita recuou ${Math.abs(growth.revenue_growth).toFixed(1)}% vs anterior` });

  if (growth.cost_growth > growth.revenue_growth + 5 && growth.cost_growth > 0)
    r.push({ severity: "high", title: "Custo crescendo acima da receita", detail: `Custo +${growth.cost_growth.toFixed(1)}% vs receita +${growth.revenue_growth.toFixed(1)}%` });

  if (fin.margin_percent < 20 && fin.total_revenue > 0)
    r.push({ severity: "medium", title: "Margem comprimida", detail: `Margem global em ${fin.margin_percent.toFixed(1)}%` });

  if (share.leader_share > 70)
    r.push({ severity: "medium", title: "Concentração excessiva", detail: `${share.leader_name} concentra ${share.leader_share.toFixed(1)}% da receita` });

  if (goals.critical > 0)
    r.push({ severity: "high", title: `${goals.critical} meta(s) em situação crítica`, detail: "Progresso significativamente abaixo do esperado" });

  if (goals.at_risk > 0)
    r.push({ severity: "medium", title: `${goals.at_risk} meta(s) em risco`, detail: "Progresso abaixo do ritmo necessário" });

  const declining = companies.filter((c) => c.growth_percent !== null && c.growth_percent < -15);
  if (declining.length > 0)
    r.push({ severity: "medium", title: "Empresas em queda", detail: declining.map((c) => c.name).join(", ") });

  return r;
}

const fmt = fmtCurrency;

function buildNarrative(fin: CeoKPIs, growth: GrowthKPIs, share: MarketShareKPIs, goals: GoalsSummary): string {
  const parts: string[] = [];

  parts.push(`O grupo registrou faturamento de ${fmt(fin.total_revenue)} no período analisado`);

  if (fin.prev_revenue > 0) {
    const dir = growth.revenue_growth >= 0 ? "crescimento" : "queda";
    parts.push(`representando ${dir} de ${Math.abs(growth.revenue_growth).toFixed(1)}% em relação ao período anterior`);
  }

  if (fin.total_cost > 0)
    parts.push(`O custo operacional foi de ${fmt(fin.total_cost)}, resultando em margem de ${fin.margin_percent.toFixed(1)}%`);

  parts.push(`A concentração do grupo está ${share.concentration_level}, com ${share.leader_name} respondendo por ${share.leader_share.toFixed(1)}% da receita`);

  if (goals.total > 0) {
    parts.push(`Das ${goals.total} metas executivas, ${goals.achieved} foram atingidas e ${goals.critical + goals.at_risk} requerem atenção`);
  }

  parts.push(`A taxa de ativação operacional é de ${fin.activation_rate.toFixed(0)}%, com ${fin.units_active} unidades ativas`);

  return parts.join(". ") + ".";
}
