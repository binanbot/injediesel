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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ExecutivePageHeader } from "@/components/ceo/ExecutivePageHeader";
import {
  calcCrossCompanyPlaybook,
  type CompanyPlaybookSummary,
} from "@/services/crmPlaybookAnalyticsService";
import {
  fetchCompanyProfitability,
  type CompanyProfitability,
} from "@/services/profitabilityService";
import { fmtCurrency, fmtPercent } from "@/utils/ceoFormatters";

// ─── Combined company data ──────────────────────────────────

interface CompanyCombined {
  company_id: string;
  company_name: string;
  // Playbook
  conversion_rate: number;
  avg_cycle_hours: number | null;
  total_opportunities: number;
  total_lost: number;
  top_loss_reason: string | null;
  top_origin: string | null;
  pipeline_bottleneck: string | null;
  // Profitability
  revenue_total: number;
  cost_total: number;
  cost_personnel: number;
  margin: number;
  margin_pct: number;
  efficiency: number;
  // Derived
  estimated_loss_value: number; // lost opps * avg ticket
  commercial_roi: number; // revenue / cost_personnel
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

  const isLoading = loadingPB || loadingProfit;

  const companies = useMemo(
    () => combineData(playbookData, profitData),
    [playbookData, profitData]
  );

  // ── Global KPIs ────────────────────────────────────────────
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

    return {
      avgConversion,
      avgCycleH,
      totalRev,
      totalCostPers,
      totalLoss,
      totalMargin,
      marginPct,
      globalRoi,
    };
  }, [companies]);

  // ── Insights ───────────────────────────────────────────────
  const insights = useMemo(() => {
    if (companies.length === 0) return null;

    const bestEfficiency = [...companies].sort(
      (a, b) => b.efficiency - a.efficiency
    )[0];
    const worstLoss = [...companies].sort(
      (a, b) => b.estimated_loss_value - a.estimated_loss_value
    )[0];
    const bestRoi = [...companies].sort(
      (a, b) => b.commercial_roi - a.commercial_roi
    )[0];

    // Alert: cost growing without conversion improvement
    const costConversionAlert = companies.find(
      (c) => c.cost_personnel > 0 && c.conversion_rate < 20 && c.efficiency < 2
    );

    return { bestEfficiency, worstLoss, bestRoi, costConversionAlert };
  }, [companies]);

  return (
    <div className="space-y-6">
      <ExecutivePageHeader
        icon={Target}
        title="Inteligência Comercial"
        subtitle="Visão executiva integrada: playbook, custos e rentabilidade comercial"
      />

      {/* ── KPI Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKpi
          label="Conversão Média"
          value={isLoading ? null : fmtPercent(totals.avgConversion)}
          icon={Percent}
          accent={totals.avgConversion >= 30 ? "text-emerald-400" : "text-amber-400"}
          loading={isLoading}
        />
        <MiniKpi
          label="Ciclo Médio"
          value={
            isLoading
              ? null
              : totals.avgCycleH !== null
              ? `${Math.round(totals.avgCycleH)}h`
              : "—"
          }
          icon={Clock}
          accent="text-primary"
          loading={isLoading}
        />
        <MiniKpi
          label="ROI Comercial"
          value={isLoading ? null : fmtPercent(totals.globalRoi, 0)}
          icon={Zap}
          accent={totals.globalRoi >= 300 ? "text-emerald-400" : "text-amber-400"}
          loading={isLoading}
        />
        <MiniKpi
          label="Perda Estimada"
          value={isLoading ? null : fmtCurrency(totals.totalLoss)}
          icon={TrendingDown}
          accent="text-rose-400"
          loading={isLoading}
        />
      </div>

      {/* ── Second KPI Row ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniKpi
          label="Receita Total"
          value={isLoading ? null : fmtCurrency(totals.totalRev)}
          icon={DollarSign}
          accent="text-emerald-400"
          loading={isLoading}
        />
        <MiniKpi
          label="Custo Pessoal"
          value={isLoading ? null : fmtCurrency(totals.totalCostPers)}
          icon={DollarSign}
          accent="text-rose-400"
          loading={isLoading}
        />
        <MiniKpi
          label="Margem"
          value={isLoading ? null : fmtPercent(totals.marginPct)}
          icon={BarChart3}
          accent={totals.marginPct >= 30 ? "text-emerald-400" : "text-amber-400"}
          loading={isLoading}
        />
        <MiniKpi
          label="Margem Abs."
          value={isLoading ? null : fmtCurrency(totals.totalMargin)}
          icon={TrendingUp}
          accent={totals.totalMargin >= 0 ? "text-emerald-400" : "text-rose-400"}
          loading={isLoading}
        />
      </div>

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
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhuma empresa com dados disponíveis.
            </p>
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
        <InsightCard
          title="Melhor Eficiência"
          loading={isLoading}
          icon={<Award className="h-4 w-4 text-emerald-400" />}
          content={
            insights?.bestEfficiency
              ? `${insights.bestEfficiency.company_name}: ${insights.bestEfficiency.efficiency.toFixed(1)}x`
              : null
          }
          subtitle="Receita por R$ 1 de custo"
          variant="success"
        />
        <InsightCard
          title="Maior Perda Potencial"
          loading={isLoading}
          icon={<TrendingDown className="h-4 w-4 text-rose-400" />}
          content={
            insights?.worstLoss && insights.worstLoss.estimated_loss_value > 0
              ? `${insights.worstLoss.company_name}: ${fmtCurrency(insights.worstLoss.estimated_loss_value)}`
              : "Sem perdas estimadas"
          }
          subtitle="Oportunidades perdidas × ticket médio"
          variant="danger"
        />
        <InsightCard
          title="Melhor ROI Comercial"
          loading={isLoading}
          icon={<Zap className="h-4 w-4 text-emerald-400" />}
          content={
            insights?.bestRoi
              ? `${insights.bestRoi.company_name}: ${fmtPercent(insights.bestRoi.commercial_roi, 0)}`
              : null
          }
          subtitle="Receita ÷ custo de pessoal"
          variant="success"
        />
        <InsightCard
          title="Alerta de Ineficiência"
          loading={isLoading}
          icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
          content={
            insights?.costConversionAlert
              ? `${insights.costConversionAlert.company_name}: conversão ${fmtPercent(insights.costConversionAlert.conversion_rate)} com eficiência ${insights.costConversionAlert.efficiency.toFixed(1)}x`
              : "Nenhum alerta"
          }
          subtitle="Custo alto + baixa conversão"
          variant={insights?.costConversionAlert ? "warning" : "neutral"}
        />
      </div>

      {/* ── Bottom Insights: Loss, Origin, Bottleneck ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Motivo de Perda + Impacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                {companies
                  .filter((c) => c.top_loss_reason)
                  .map((c) => (
                    <div key={c.company_id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">
                          {c.company_name}
                        </span>
                        <Badge variant="destructive" className="text-xs shrink-0">
                          {c.top_loss_reason}
                        </Badge>
                      </div>
                      {c.estimated_loss_value > 0 && (
                        <p className="text-[11px] text-rose-400/70 text-right">
                          ~{fmtCurrency(c.estimated_loss_value)} em perdas
                        </p>
                      )}
                    </div>
                  ))}
                {companies.every((c) => !c.top_loss_reason) && (
                  <p className="text-xs text-muted-foreground text-center">
                    Sem dados de perda
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Origem Mais Eficiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                {companies
                  .filter((c) => c.top_origin)
                  .map((c) => (
                    <div
                      key={c.company_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground truncate">
                        {c.company_name}
                      </span>
                      <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shrink-0">
                        {c.top_origin}
                      </Badge>
                    </div>
                  ))}
                {companies.every((c) => !c.top_origin) && (
                  <p className="text-xs text-muted-foreground text-center">
                    Sem dados de origem
                  </p>
                )}
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
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                {companies
                  .filter((c) => c.pipeline_bottleneck)
                  .map((c) => (
                    <div
                      key={c.company_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground truncate">
                        {c.company_name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs text-amber-400 border-amber-400/30 shrink-0"
                      >
                        {c.pipeline_bottleneck}
                      </Badge>
                    </div>
                  ))}
                {companies.every((c) => !c.pipeline_bottleneck) && (
                  <p className="text-xs text-muted-foreground text-center">
                    Sem gargalos identificados
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function MiniKpi({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | null;
  icon: typeof Percent;
  accent: string;
  loading: boolean;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-5 pb-4 flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${accent}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-6 w-20 mt-1" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
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
          <span className="text-xs text-muted-foreground">
            {c.total_opportunities} oportunidades
          </span>
        </div>

        {/* Conversion bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Conversão</span>
            <span
              className={
                c.conversion_rate >= 30 ? "text-emerald-400" : "text-amber-400"
              }
            >
              {fmtPercent(c.conversion_rate)}
            </span>
          </div>
          <Progress value={Math.min(c.conversion_rate, 100)} className="h-2" />
        </div>

        {/* Financial metrics */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receita</span>
            <span className="font-medium">{fmtCurrency(c.revenue_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo Pessoal</span>
            <span className="font-medium text-rose-400">
              {fmtCurrency(c.cost_personnel)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margem</span>
            <span
              className={`font-medium ${
                c.margin >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {fmtPercent(c.margin_pct)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ROI Comercial</span>
            <span
              className={`font-medium ${
                c.commercial_roi >= 300 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {fmtPercent(c.commercial_roi, 0)}
            </span>
          </div>
        </div>

        {/* Bottom summary */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/30">
          <div>
            <p className="text-[11px] text-muted-foreground">Ciclo</p>
            <p className="text-sm font-medium">
              {c.avg_cycle_hours !== null
                ? `${Math.round(c.avg_cycle_hours)}h`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Perdas</p>
            <p className="text-sm font-medium text-rose-400">{c.total_lost}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Eficiência</p>
            <p className="text-sm font-medium">
              {c.efficiency > 0 ? `${c.efficiency.toFixed(1)}x` : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  title,
  content,
  subtitle,
  icon,
  loading,
  variant,
}: {
  title: string;
  content: string | null;
  subtitle: string;
  icon: React.ReactNode;
  loading: boolean;
  variant: "success" | "danger" | "warning" | "neutral";
}) {
  const borderClasses: Record<string, string> = {
    success: "border-emerald-500/20",
    danger: "border-rose-500/20",
    warning: "border-amber-500/20",
    neutral: "border-border/50",
  };

  return (
    <Card className={`glass-card border ${borderClasses[variant]}`}>
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {icon}
          {title}
        </div>
        {loading ? (
          <Skeleton className="h-5 w-full" />
        ) : (
          <p className="text-sm font-semibold">{content || "—"}</p>
        )}
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
