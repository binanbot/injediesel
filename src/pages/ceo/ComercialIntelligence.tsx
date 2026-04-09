import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Percent,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  Target,
  DollarSign,
  Zap,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Crosshair,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ExecutivePageHeader } from "@/components/ceo/ExecutivePageHeader";
import {
  calcCrossCompanyPlaybook,
  type CompanyPlaybookSummary,
} from "@/services/crmPlaybookAnalyticsService";
import {
  fetchCompanyProfitability,
  type CompanyProfitability,
} from "@/services/profitabilityService";
import {
  fetchCommercialTrends,
  calcTrendComparisons,
  type CompanyMonthlyTrend,
  type TrendComparison,
} from "@/services/ceoCommercialTrendsService";
import {
  calcCompanyForecasts,
  detectExecutiveRisks,
  calcTrendDeviations,
  type CompanyForecast,
  type ExecutiveRisk,
  type TrendDeviation,
  type RiskLevel,
} from "@/services/ceoCommercialForecastService";
import { fmtCurrency, fmtPercent } from "@/utils/ceoFormatters";

// ─── Combined company data ──────────────────────────────────

interface CompanyCombined {
  company_id: string;
  company_name: string;
  conversion_rate: number;
  avg_cycle_hours: number | null;
  total_opportunities: number;
  total_lost: number;
  top_loss_reason: string | null;
  top_origin: string | null;
  pipeline_bottleneck: string | null;
  revenue_total: number;
  cost_total: number;
  cost_personnel: number;
  margin: number;
  margin_pct: number;
  efficiency: number;
  estimated_loss_value: number;
  commercial_roi: number;
}

function combineData(
  playbook: CompanyPlaybookSummary[],
  profitability: CompanyProfitability[]
): CompanyCombined[] {
  const profMap = new Map(profitability.map((p) => [p.company_id, p]));
  return playbook.map((pb) => {
    const pr = profMap.get(pb.company_id);
    const avgTicket =
      pb.total_opportunities > 0 && pr
        ? pr.revenue_total / Math.max(pb.total_opportunities - pb.total_lost, 1)
        : 0;
    return {
      company_id: pb.company_id,
      company_name: pb.company_name,
      conversion_rate: pb.conversion_rate,
      avg_cycle_hours: pb.avg_cycle_hours,
      total_opportunities: pb.total_opportunities,
      total_lost: pb.total_lost,
      top_loss_reason: pb.top_loss_reason,
      top_origin: pb.top_origin,
      pipeline_bottleneck: pb.pipeline_bottleneck,
      revenue_total: pr?.revenue_total || 0,
      cost_total: pr?.cost_total || 0,
      cost_personnel: pr?.cost_personnel || 0,
      margin: pr?.margin || 0,
      margin_pct: pr?.margin_pct || 0,
      efficiency: pr?.efficiency || 0,
      estimated_loss_value: pb.total_lost * avgTicket,
      commercial_roi:
        pr && pr.cost_personnel > 0
          ? (pr.revenue_total / pr.cost_personnel) * 100
          : 0,
    };
  });
}

// ─── Chart colors ───────────────────────────────────────────

const COMPANY_COLORS = [
  "hsl(var(--primary))",
  "hsl(160, 60%, 45%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 55%)",
];

// ─── Chart data builder ─────────────────────────────────────

function buildChartData(
  trends: CompanyMonthlyTrend[],
  metric: keyof CompanyMonthlyTrend["months"][0]
): Record<string, string | number>[] {
  if (trends.length === 0) return [];
  const allMonths = trends[0]?.months.map((m) => m.label) || [];
  return allMonths.map((label, i) => {
    const point: Record<string, string | number> = { month: label };
    trends.forEach((t) => {
      const val = t.months[i]?.[metric];
      point[t.company_name] = typeof val === "number" ? val : 0;
    });
    return point;
  });
}

// ─── Main Component ─────────────────────────────────────────

export default function ComercialIntelligence() {
  const { data: playbookData = [], isLoading: loadingPB } = useQuery({
    queryKey: ["ceo-playbook-cross"],
    queryFn: calcCrossCompanyPlaybook,
  });

  const { data: profitData = [], isLoading: loadingProfit } = useQuery({
    queryKey: ["ceo-profitability-companies"],
    queryFn: fetchCompanyProfitability,
  });

  const { data: trendsData = [], isLoading: loadingTrends } = useQuery({
    queryKey: ["ceo-commercial-trends"],
    queryFn: () => fetchCommercialTrends(6),
  });

  const isLoading = loadingPB || loadingProfit;
  const companies = useMemo(
    () => combineData(playbookData, profitData),
    [playbookData, profitData]
  );

  const trendComparisons = useMemo(
    () => calcTrendComparisons(trendsData),
    [trendsData]
  );

  // ── Predictive layer
  const forecasts = useMemo(
    () => calcCompanyForecasts(trendsData),
    [trendsData]
  );

  const executiveRisks = useMemo(
    () => detectExecutiveRisks(trendComparisons, trendsData),
    [trendComparisons, trendsData]
  );

  const trendDeviations = useMemo(
    () => calcTrendDeviations(trendsData),
    [trendsData]
  );

  // ── Global KPIs
  const totals = useMemo(() => {
    const avgConversion =
      companies.length > 0
        ? companies.reduce((s, c) => s + c.conversion_rate, 0) / companies.length
        : 0;
    const avgCycleH =
      companies.filter((c) => c.avg_cycle_hours !== null).length > 0
        ? companies
            .filter((c) => c.avg_cycle_hours !== null)
            .reduce((s, c) => s + (c.avg_cycle_hours || 0), 0) /
          companies.filter((c) => c.avg_cycle_hours !== null).length
        : null;
    const totalRev = companies.reduce((s, c) => s + c.revenue_total, 0);
    const totalCostPers = companies.reduce((s, c) => s + c.cost_personnel, 0);
    const totalLoss = companies.reduce((s, c) => s + c.estimated_loss_value, 0);
    const totalMargin = companies.reduce((s, c) => s + c.margin, 0);
    const marginPct = totalRev > 0 ? (totalMargin / totalRev) * 100 : 0;
    const globalRoi = totalCostPers > 0 ? (totalRev / totalCostPers) * 100 : 0;
    return { avgConversion, avgCycleH, totalRev, totalCostPers, totalLoss, totalMargin, marginPct, globalRoi };
  }, [companies]);

  // ── Insights
  const insights = useMemo(() => {
    if (companies.length === 0) return null;
    const bestEfficiency = [...companies].sort((a, b) => b.efficiency - a.efficiency)[0];
    const worstLoss = [...companies].sort((a, b) => b.estimated_loss_value - a.estimated_loss_value)[0];
    const bestRoi = [...companies].sort((a, b) => b.commercial_roi - a.commercial_roi)[0];
    const costConversionAlert = companies.find(
      (c) => c.cost_personnel > 0 && c.conversion_rate < 20 && c.efficiency < 2
    );
    return { bestEfficiency, worstLoss, bestRoi, costConversionAlert };
  }, [companies]);

  // ── Trend insights
  const trendInsights = useMemo(() => {
    if (trendComparisons.length === 0) return null;
    const bestImprover = [...trendComparisons].sort((a, b) => b.conversion_delta - a.conversion_delta)[0];
    const worstDecline = [...trendComparisons].sort((a, b) => a.conversion_delta - b.conversion_delta)[0];
    const lossAccelerating = trendComparisons.find((t) => t.loss_delta_pct > 50);
    const worstMarginDecline = [...trendComparisons].sort((a, b) => a.margin_delta - b.margin_delta)[0];
    const bestRoiGain = [...trendComparisons].sort((a, b) => b.roi_delta - a.roi_delta)[0];
    const bestRevenueGrowth = [...trendComparisons].sort((a, b) => b.revenue_delta_pct - a.revenue_delta_pct)[0];
    return { bestImprover, worstDecline, lossAccelerating, worstMarginDecline, bestRoiGain, bestRevenueGrowth };
  }, [trendComparisons]);

  // ── Chart datasets
  const chartDatasets = useMemo(() => ({
    conversion: buildChartData(trendsData, "conversion_rate"),
    cycle: buildChartData(trendsData, "avg_cycle_hours"),
    revenue: buildChartData(trendsData, "revenue"),
    costPersonnel: buildChartData(trendsData, "cost_personnel"),
    margin: buildChartData(trendsData, "margin_pct"),
    roi: buildChartData(trendsData, "commercial_roi"),
    losses: buildChartData(trendsData, "estimated_loss_value"),
    volume: buildChartData(trendsData, "total_opps"),
  }), [trendsData]);

  const companyNames = trendsData.map((t) => t.company_name);

  return (
    <div className="space-y-6">
      <ExecutivePageHeader
        icon={Target}
        title="Inteligência Comercial"
        subtitle="Visão executiva integrada: playbook, custos, rentabilidade, tendências e projeções"
      />

      {/* ── KPI Rows ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKpi label="Conversão Média" value={isLoading ? null : fmtPercent(totals.avgConversion)} icon={Percent} accent={totals.avgConversion >= 30 ? "text-emerald-400" : "text-amber-400"} loading={isLoading} />
        <MiniKpi label="Ciclo Médio" value={isLoading ? null : totals.avgCycleH !== null ? `${Math.round(totals.avgCycleH)}h` : "—"} icon={Clock} accent="text-primary" loading={isLoading} />
        <MiniKpi label="ROI Comercial" value={isLoading ? null : fmtPercent(totals.globalRoi, 0)} icon={Zap} accent={totals.globalRoi >= 300 ? "text-emerald-400" : "text-amber-400"} loading={isLoading} />
        <MiniKpi label="Perda Estimada" value={isLoading ? null : fmtCurrency(totals.totalLoss)} icon={TrendingDown} accent="text-rose-400" loading={isLoading} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKpi label="Receita Total" value={isLoading ? null : fmtCurrency(totals.totalRev)} icon={DollarSign} accent="text-emerald-400" loading={isLoading} />
        <MiniKpi label="Custo Pessoal" value={isLoading ? null : fmtCurrency(totals.totalCostPers)} icon={DollarSign} accent="text-rose-400" loading={isLoading} />
        <MiniKpi label="Margem" value={isLoading ? null : fmtPercent(totals.marginPct)} icon={BarChart3} accent={totals.marginPct >= 30 ? "text-emerald-400" : "text-amber-400"} loading={isLoading} />
        <MiniKpi label="Margem Abs." value={isLoading ? null : fmtCurrency(totals.totalMargin)} icon={TrendingUp} accent={totals.totalMargin >= 0 ? "text-emerald-400" : "text-rose-400"} loading={isLoading} />
      </div>

      {/* ── PREDICTIVE: Executive Risks ──────────────────────── */}
      {!loadingTrends && executiveRisks.length > 0 && (
        <Card className="glass-card border border-rose-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              Riscos Executivos Identificados
              <Badge variant="destructive" className="ml-2 text-xs">{executiveRisks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {executiveRisks.slice(0, 6).map((risk, i) => (
                <RiskCard key={`${risk.company_id}-${risk.risk_type}-${i}`} risk={risk} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── PREDICTIVE: Forecast Cards ───────────────────────── */}
      {!loadingTrends && forecasts.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crosshair className="h-5 w-5 text-primary" />
              Projeções de Fechamento — Mês Atual
              <Badge variant="outline" className="ml-2 text-xs">
                {Math.round(forecasts[0]?.month_progress * 100 || 0)}% do mês
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forecasts.map((fc) => (
                <ForecastCard key={fc.company_id} forecast={fc} comparison={trendComparisons.find((tc) => tc.company_id === fc.company_id)} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── PREDICTIVE: Trend Deviations ─────────────────────── */}
      {!loadingTrends && trendDeviations.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-amber-400" />
              Desvios Contra Tendência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {trendDeviations.slice(0, 6).map((dev, i) => (
                <DeviationCard key={`${dev.company_id}-${dev.metric}-${i}`} deviation={dev} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Trend Charts ─────────────────────────────────────── */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Tendências — Últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTrends ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Tabs defaultValue="conversion" className="space-y-4">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="conversion">Conversão</TabsTrigger>
                <TabsTrigger value="cycle">Ciclo</TabsTrigger>
                <TabsTrigger value="revenue">Receita</TabsTrigger>
                <TabsTrigger value="cost">Custo Pessoal</TabsTrigger>
                <TabsTrigger value="margin">Margem %</TabsTrigger>
                <TabsTrigger value="roi">ROI Comercial</TabsTrigger>
                <TabsTrigger value="losses">Perdas (R$)</TabsTrigger>
                <TabsTrigger value="volume">Volume</TabsTrigger>
              </TabsList>

              <TabsContent value="conversion">
                <TrendChart data={chartDatasets.conversion} companies={companyNames} tooltipFormatter={(v: number) => `${v.toFixed(1)}%`} />
              </TabsContent>
              <TabsContent value="cycle">
                <TrendChart data={chartDatasets.cycle} companies={companyNames} tooltipFormatter={(v: number) => `${Math.round(v)}h`} />
              </TabsContent>
              <TabsContent value="revenue">
                <TrendChart data={chartDatasets.revenue} companies={companyNames} tooltipFormatter={(v: number) => fmtCurrency(v)} />
              </TabsContent>
              <TabsContent value="cost">
                <TrendChart data={chartDatasets.costPersonnel} companies={companyNames} tooltipFormatter={(v: number) => fmtCurrency(v)} />
              </TabsContent>
              <TabsContent value="margin">
                <TrendChart data={chartDatasets.margin} companies={companyNames} tooltipFormatter={(v: number) => `${v.toFixed(1)}%`} />
              </TabsContent>
              <TabsContent value="roi">
                <TrendChart data={chartDatasets.roi} companies={companyNames} tooltipFormatter={(v: number) => `${v.toFixed(0)}%`} />
              </TabsContent>
              <TabsContent value="losses">
                <TrendChart data={chartDatasets.losses} companies={companyNames} tooltipFormatter={(v: number) => fmtCurrency(v)} />
              </TabsContent>
              <TabsContent value="volume">
                <TrendChart data={chartDatasets.volume} companies={companyNames} tooltipFormatter={(v: number) => String(v)} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* ── MoM Comparison Cards ─────────────────────────────── */}
      {trendComparisons.length > 0 && !loadingTrends && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendComparisons.map((tc) => (
            <MoMCard key={tc.company_id} data={tc} />
          ))}
        </div>
      )}

      {/* ── Trend Insights ───────────────────────────────────── */}
      {trendInsights && !loadingTrends && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            title="Maior Ganho de Conversão"
            icon={<ArrowUpRight className="h-4 w-4 text-emerald-400" />}
            content={
              trendInsights.bestImprover && trendInsights.bestImprover.conversion_delta > 0
                ? `${trendInsights.bestImprover.company_name}: +${trendInsights.bestImprover.conversion_delta.toFixed(1)}pp`
                : "Sem melhoria no período"
            }
            subtitle="Conversão mês atual vs anterior"
            variant={trendInsights.bestImprover?.conversion_delta > 0 ? "success" : "neutral"}
            loading={false}
          />
          <InsightCard
            title="Pior Deterioração de Margem"
            icon={<ArrowDownRight className="h-4 w-4 text-rose-400" />}
            content={
              trendInsights.worstMarginDecline && trendInsights.worstMarginDecline.margin_delta < 0
                ? `${trendInsights.worstMarginDecline.company_name}: ${trendInsights.worstMarginDecline.margin_delta.toFixed(1)}pp`
                : "Sem deterioração"
            }
            subtitle="Margem mês atual vs anterior"
            variant={trendInsights.worstMarginDecline?.margin_delta < 0 ? "danger" : "neutral"}
            loading={false}
          />
          <InsightCard
            title="Perda em Aceleração"
            icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
            content={
              trendInsights.lossAccelerating
                ? `${trendInsights.lossAccelerating.company_name}: +${trendInsights.lossAccelerating.loss_delta_pct.toFixed(0)}%`
                : "Nenhuma aceleração"
            }
            subtitle="Valor de perdas crescendo >50% MoM"
            variant={trendInsights.lossAccelerating ? "warning" : "neutral"}
            loading={false}
          />
          <InsightCard
            title="Melhor Ganho de ROI"
            icon={<Zap className="h-4 w-4 text-emerald-400" />}
            content={
              trendInsights.bestRoiGain && trendInsights.bestRoiGain.roi_delta > 0
                ? `${trendInsights.bestRoiGain.company_name}: +${trendInsights.bestRoiGain.roi_delta.toFixed(0)}pp`
                : "Sem melhoria de ROI"
            }
            subtitle="ROI Comercial mês atual vs anterior"
            variant={trendInsights.bestRoiGain?.roi_delta > 0 ? "success" : "neutral"}
            loading={false}
          />
          <InsightCard
            title="Maior Crescimento de Receita"
            icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
            content={
              trendInsights.bestRevenueGrowth && trendInsights.bestRevenueGrowth.revenue_delta_pct > 0
                ? `${trendInsights.bestRevenueGrowth.company_name}: +${trendInsights.bestRevenueGrowth.revenue_delta_pct.toFixed(0)}%`
                : "Sem crescimento"
            }
            subtitle="Receita mês atual vs anterior"
            variant={trendInsights.bestRevenueGrowth?.revenue_delta_pct > 0 ? "success" : "neutral"}
            loading={false}
          />
          <InsightCard
            title="Maior Queda de Conversão"
            icon={<ArrowDownRight className="h-4 w-4 text-rose-400" />}
            content={
              trendInsights.worstDecline && trendInsights.worstDecline.conversion_delta < 0
                ? `${trendInsights.worstDecline.company_name}: ${trendInsights.worstDecline.conversion_delta.toFixed(1)}pp`
                : "Sem deterioração"
            }
            subtitle="Conversão mês atual vs anterior"
            variant={trendInsights.worstDecline?.conversion_delta < 0 ? "danger" : "neutral"}
            loading={false}
          />
        </div>
      )}

      {/* ── Company Comparison Cards ─────────────────────────── */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-emerald-400" />
            Comparativo Comercial + Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : companies.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma empresa com dados disponíveis.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((c) => (
                <CompanyComparisonCard key={c.company_id} company={c} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Executive Insights ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard title="Melhor Eficiência" loading={isLoading} icon={<Award className="h-4 w-4 text-emerald-400" />} content={insights?.bestEfficiency ? `${insights.bestEfficiency.company_name}: ${insights.bestEfficiency.efficiency.toFixed(1)}x` : null} subtitle="Receita por R$ 1 de custo" variant="success" />
        <InsightCard title="Maior Perda Potencial" loading={isLoading} icon={<TrendingDown className="h-4 w-4 text-rose-400" />} content={insights?.worstLoss && insights.worstLoss.estimated_loss_value > 0 ? `${insights.worstLoss.company_name}: ${fmtCurrency(insights.worstLoss.estimated_loss_value)}` : "Sem perdas estimadas"} subtitle="Oportunidades perdidas × ticket médio" variant="danger" />
        <InsightCard title="Melhor ROI Comercial" loading={isLoading} icon={<Zap className="h-4 w-4 text-emerald-400" />} content={insights?.bestRoi ? `${insights.bestRoi.company_name}: ${fmtPercent(insights.bestRoi.commercial_roi, 0)}` : null} subtitle="Receita ÷ custo de pessoal" variant="success" />
        <InsightCard title="Alerta de Ineficiência" loading={isLoading} icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} content={insights?.costConversionAlert ? `${insights.costConversionAlert.company_name}: conversão ${fmtPercent(insights.costConversionAlert.conversion_rate)} com eficiência ${insights.costConversionAlert.efficiency.toFixed(1)}x` : "Nenhum alerta"} subtitle="Custo alto + baixa conversão" variant={insights?.costConversionAlert ? "warning" : "neutral"} />
      </div>

      {/* ── Bottom: Loss/Origin/Bottleneck ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Motivo de Perda + Impacto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                {companies.filter((c) => c.top_loss_reason).map((c) => (
                  <div key={c.company_id} className="space-y-0.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">{c.company_name}</span>
                      <Badge variant="destructive" className="text-xs shrink-0">{c.top_loss_reason}</Badge>
                    </div>
                    {c.estimated_loss_value > 0 && (
                      <p className="text-[11px] text-rose-400/70 text-right">~{fmtCurrency(c.estimated_loss_value)} em perdas</p>
                    )}
                  </div>
                ))}
                {companies.every((c) => !c.top_loss_reason) && <p className="text-xs text-muted-foreground text-center">Sem dados de perda</p>}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Origem Mais Eficiente</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                {companies.filter((c) => c.top_origin).map((c) => (
                  <div key={c.company_id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{c.company_name}</span>
                    <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shrink-0">{c.top_origin}</Badge>
                  </div>
                ))}
                {companies.every((c) => !c.top_origin) && <p className="text-xs text-muted-foreground text-center">Sem dados de origem</p>}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Gargalos Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                {companies.filter((c) => c.pipeline_bottleneck).map((c) => (
                  <div key={c.company_id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{c.company_name}</span>
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 shrink-0">{c.pipeline_bottleneck}</Badge>
                  </div>
                ))}
                {companies.every((c) => !c.pipeline_bottleneck) && <p className="text-xs text-muted-foreground text-center">Sem gargalos identificados</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function MiniKpi({ label, value, icon: Icon, accent, loading }: {
  label: string; value: string | null; icon: typeof Percent; accent: string; loading: boolean;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-5 pb-4 flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${accent}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="h-6 w-20 mt-1" /> : <p className="text-xl font-bold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendChart({ data, companies, tooltipFormatter }: {
  data: Record<string, string | number>[];
  companies: string[];
  tooltipFormatter: (v: number) => string;
}) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">Sem dados temporais</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number, name: string) => [tooltipFormatter(value), name]}
          />
          <Legend />
          {companies.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COMPANY_COLORS[i % COMPANY_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MoMCard({ data: tc }: { data: TrendComparison }) {
  const convUp = tc.conversion_delta >= 0;
  const lossUp = tc.loss_delta_pct > 0;
  const marginUp = tc.margin_delta >= 0;
  const revUp = tc.revenue_delta_pct >= 0;
  return (
    <Card className="border border-border/50 bg-card/50">
      <CardContent className="pt-4 pb-4 space-y-2">
        <h3 className="font-semibold text-sm">{tc.company_name} — MoM</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground">Conversão</p>
            <p className={`text-sm font-bold ${convUp ? "text-emerald-400" : "text-rose-400"}`}>
              {convUp ? "+" : ""}{tc.conversion_delta.toFixed(1)}pp
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmtPercent(tc.prev_conversion)} → {fmtPercent(tc.current_conversion)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Margem</p>
            <p className={`text-sm font-bold ${marginUp ? "text-emerald-400" : "text-rose-400"}`}>
              {marginUp ? "+" : ""}{tc.margin_delta.toFixed(1)}pp
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmtPercent(tc.prev_margin_pct)} → {fmtPercent(tc.current_margin_pct)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Receita</p>
            <p className={`text-sm font-bold ${revUp ? "text-emerald-400" : "text-rose-400"}`}>
              {revUp ? "+" : ""}{tc.revenue_delta_pct.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmtCurrency(tc.current_revenue)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center border-t border-border/30 pt-2">
          <div>
            <p className="text-[11px] text-muted-foreground">Ciclo</p>
            <p className="text-sm font-bold">
              {tc.current_cycle !== null ? `${Math.round(tc.current_cycle)}h` : "—"}
            </p>
            {tc.prev_cycle !== null && (
              <p className="text-[10px] text-muted-foreground">ant: {Math.round(tc.prev_cycle)}h</p>
            )}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Perda R$</p>
            <p className={`text-sm font-bold ${lossUp ? "text-rose-400" : "text-emerald-400"}`}>
              {lossUp ? "+" : ""}{tc.loss_delta_pct.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmtCurrency(tc.current_loss_value)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">ROI Com.</p>
            <p className={`text-sm font-bold ${tc.roi_delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {tc.roi_delta >= 0 ? "+" : ""}{tc.roi_delta.toFixed(0)}pp
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmtPercent(tc.current_roi, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastCard({ forecast: fc, comparison: tc }: { forecast: CompanyForecast; comparison?: TrendComparison }) {
  const progressPct = Math.round(fc.month_progress * 100);
  return (
    <Card className="border border-primary/20 bg-card/50">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-primary" />
            {fc.company_name}
          </h3>
          <Badge variant="outline" className="text-[10px]">{progressPct}% do mês</Badge>
        </div>
        <Progress value={progressPct} className="h-1.5" />
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground">Receita Proj.</p>
            <p className="text-sm font-bold text-emerald-400">{fmtCurrency(fc.projected_revenue)}</p>
            {tc && tc.prev_revenue > 0 && (
              <p className={`text-[10px] ${fc.projected_revenue >= tc.prev_revenue ? "text-emerald-400/60" : "text-rose-400/60"}`}>
                vs ant: {fc.projected_revenue >= tc.prev_revenue ? "↑" : "↓"} {Math.abs(((fc.projected_revenue - tc.prev_revenue) / tc.prev_revenue) * 100).toFixed(0)}%
              </p>
            )}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Margem Proj.</p>
            <p className={`text-sm font-bold ${fc.projected_margin_pct >= 20 ? "text-emerald-400" : "text-amber-400"}`}>{fmtPercent(fc.projected_margin_pct)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">ROI Proj.</p>
            <p className={`text-sm font-bold ${fc.projected_roi >= 300 ? "text-emerald-400" : "text-amber-400"}`}>{fmtPercent(fc.projected_roi, 0)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center border-t border-border/30 pt-2">
          <div>
            <p className="text-[11px] text-muted-foreground">Custo Proj.</p>
            <p className="text-sm font-bold text-rose-400">{fmtCurrency(fc.projected_cost_personnel)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Perda Proj.</p>
            <p className="text-sm font-bold text-rose-400">{fmtCurrency(fc.projected_loss_value)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Volume Proj.</p>
            <p className="text-sm font-bold">{fc.projected_volume}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskCard({ risk }: { risk: ExecutiveRisk }) {
  const levelStyles: Record<RiskLevel, string> = {
    critical: "border-rose-500/40 bg-rose-500/5",
    high: "border-rose-500/20 bg-rose-500/5",
    moderate: "border-amber-500/20 bg-amber-500/5",
    low: "border-border/50",
  };
  const levelBadge: Record<RiskLevel, string> = {
    critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    high: "bg-rose-500/15 text-rose-400 border-rose-500/20",
    moderate: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    low: "bg-muted text-muted-foreground",
  };
  const levelLabels: Record<RiskLevel, string> = {
    critical: "Crítico",
    high: "Alto",
    moderate: "Moderado",
    low: "Baixo",
  };
  return (
    <Card className={`border ${levelStyles[risk.level]}`}>
      <CardContent className="pt-3 pb-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{risk.company_name}</span>
          <Badge variant="outline" className={`text-[10px] ${levelBadge[risk.level]}`}>{levelLabels[risk.level]}</Badge>
        </div>
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          {risk.label}
        </p>
        <p className="text-[11px] text-muted-foreground">{risk.description}</p>
      </CardContent>
    </Card>
  );
}

function DeviationCard({ deviation: dev }: { deviation: TrendDeviation }) {
  const isPositive = dev.direction === "above";
  // For losses, above = bad; for others, above = good
  const isLoss = dev.metric === "estimated_loss_value";
  const isGood = isLoss ? !isPositive : isPositive;

  return (
    <Card className={`border ${isGood ? "border-emerald-500/20" : "border-amber-500/20"}`}>
      <CardContent className="pt-3 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{dev.company_name}</span>
          <Badge variant="outline" className={`text-[10px] ${isGood ? "text-emerald-400 border-emerald-500/20" : "text-amber-400 border-amber-500/20"}`}>
            {isPositive ? "↑" : "↓"} {Math.abs(dev.deviation_pct).toFixed(0)}%
          </Badge>
        </div>
        <p className="text-sm font-semibold">{dev.label}</p>
        <p className="text-[11px] text-muted-foreground">
          Atual vs média histórica: {isPositive ? "acima" : "abaixo"} da tendência
        </p>
      </CardContent>
    </Card>
  );
}

function CompanyComparisonCard({ company: c }: { company: CompanyCombined }) {
  return (
    <Card className="border border-border/50 bg-card/50">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{c.company_name}</h3>
          <span className="text-xs text-muted-foreground">{c.total_opportunities} oportunidades</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Conversão</span>
            <span className={c.conversion_rate >= 30 ? "text-emerald-400" : "text-amber-400"}>{fmtPercent(c.conversion_rate)}</span>
          </div>
          <Progress value={Math.min(c.conversion_rate, 100)} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Receita</span><span className="font-medium">{fmtCurrency(c.revenue_total)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Custo Pessoal</span><span className="font-medium text-rose-400">{fmtCurrency(c.cost_personnel)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Margem</span><span className={`font-medium ${c.margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPercent(c.margin_pct)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">ROI Comercial</span><span className={`font-medium ${c.commercial_roi >= 300 ? "text-emerald-400" : "text-amber-400"}`}>{fmtPercent(c.commercial_roi, 0)}</span></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/30">
          <div><p className="text-[11px] text-muted-foreground">Ciclo</p><p className="text-sm font-medium">{c.avg_cycle_hours !== null ? `${Math.round(c.avg_cycle_hours)}h` : "—"}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Perdas</p><p className="text-sm font-medium text-rose-400">{c.total_lost}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Eficiência</p><p className="text-sm font-medium">{c.efficiency > 0 ? `${c.efficiency.toFixed(1)}x` : "—"}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ title, content, subtitle, icon, loading, variant }: {
  title: string; content: string | null; subtitle: string; icon: React.ReactNode; loading: boolean;
  variant: "success" | "danger" | "warning" | "neutral";
}) {
  const borderClasses: Record<string, string> = {
    success: "border-emerald-500/20", danger: "border-rose-500/20",
    warning: "border-amber-500/20", neutral: "border-border/50",
  };
  return (
    <Card className={`glass-card border ${borderClasses[variant]}`}>
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">{icon}{title}</div>
        {loading ? <Skeleton className="h-5 w-full" /> : <p className="text-sm font-semibold">{content || "—"}</p>}
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
