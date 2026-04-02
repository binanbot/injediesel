import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  FileText,
  DollarSign,
  TrendingUp,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Activity,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { buildExecutiveReport, type ReportHighlight, type ReportRisk } from "@/services/ceoReportsService";
import { CeoKpiCard, VariationBadge } from "@/components/ceo/CeoKpiCard";
import { getMetricLabel } from "@/services/ceoGoalsService";
import { useCeoFilters } from "@/contexts/CeoFiltersContext";
import { ExecutivePageHeader } from "@/components/ceo/ExecutivePageHeader";
import { fmtCurrency } from "@/utils/ceoFormatters";

export default function CeoRelatorios() {
  const { filters } = useCeoFilters();

  const { data: report, isLoading } = useQuery({
    queryKey: ["ceo-executive-report", filters],
    queryFn: () => buildExecutiveReport(filters),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <ExecutivePageHeader icon={BarChart3} title="Relatório Executivo" subtitle="Consolidação periódica para tomada de decisão" />

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-[120px] w-full" /></CardContent></Card>
          ))}
        </div>
      ) : report ? (
        <>
          {/* Narrative */}
          <div data-export-section="narrative" data-export-title="Resumo Executivo">
          <Card className="border-emerald-400/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90">{report.narrative}</p>
            </CardContent>
          </Card>
          </div>

          {/* Highlights & Risks */}
          <div data-export-section="highlights-risks" data-export-title="Destaques e Riscos" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HighlightsCard highlights={report.highlights} />
            <RisksCard risks={report.risks} />
          </div>

          <ReportSection icon={DollarSign} title="Desempenho Financeiro" exportKey="financial">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CeoKpiCard title="Faturamento" value={fmtCurrency(report.financial.total_revenue)} icon={DollarSign} accent="text-emerald-400" variation={report.financial.revenue_variation} />
              <CeoKpiCard title="Custo" value={fmtCurrency(report.financial.total_cost)} icon={ArrowDownRight} accent="text-rose-400" variation={report.financial.cost_variation} invertColor />
              <CeoKpiCard title="Margem" value={`${report.financial.margin_percent.toFixed(1)}%`} icon={Percent} accent={report.financial.margin_percent >= 30 ? "text-emerald-400" : "text-amber-400"} variation={report.financial.margin_variation} />
              <CeoKpiCard title="Ativação" value={`${report.financial.activation_rate.toFixed(0)}%`} icon={Activity} accent={report.financial.activation_rate >= 70 ? "text-emerald-400" : "text-amber-400"} subtitle={`${report.financial.units_active} unidades`} />
            </div>
          </ReportSection>

          {/* Growth */}
          <ReportSection icon={TrendingUp} title="Crescimento">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <CeoKpiCard title="Crescimento" value={`${report.growth.revenue_growth.toFixed(1)}%`} icon={report.growth.revenue_growth >= 0 ? ArrowUpRight : ArrowDownRight} accent={report.growth.revenue_growth >= 0 ? "text-emerald-400" : "text-rose-400"} subtitle="vs período anterior" />
              <CeoKpiCard title="Pedidos" value={String(report.growth.total_orders)} icon={BarChart3} accent="text-primary" />
              <CeoKpiCard title="Arquivos ECU" value={String(report.growth.total_files)} icon={FileText} accent="text-primary" />
            </div>
            {report.companyGrowth.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Ranking de Crescimento por Empresa</p>
                <div className="space-y-2">
                  {[...report.companyGrowth].sort((a, b) => b.growth_percent - a.growth_percent).slice(0, 5).map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{fmtCurrency(c.revenue)}</span>
                        <VariationBadge value={c.growth_percent} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ReportSection>

          {/* Market Share */}
          <ReportSection icon={PieChart} title="Participação e Concentração">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <CeoKpiCard title="Líder" value={report.shareKPIs.leader_name} icon={PieChart} accent="text-emerald-400" subtitle={`${report.shareKPIs.leader_share.toFixed(1)}% do total`} />
              <CeoKpiCard title="Concentração (HHI)" value={report.shareKPIs.hhi.toLocaleString("pt-BR")} icon={BarChart3} accent={report.shareKPIs.concentration_level === "baixa" ? "text-emerald-400" : "text-amber-400"} subtitle={report.shareKPIs.concentration_level} />
              <CeoKpiCard title="Diversificação" value={`${report.shareKPIs.diversification_percent.toFixed(1)}%`} icon={Percent} accent="text-emerald-400" subtitle="receita fora do líder" />
            </div>
            {report.shares.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Distribuição por Empresa</p>
                <div className="space-y-2">
                  {report.shares.slice(0, 5).map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-emerald-400">{s.share_percent.toFixed(1)}%</span>
                        <span className={`text-xs font-medium ${s.share_delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {s.share_delta >= 0 ? "+" : ""}{s.share_delta.toFixed(1)}pp
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ReportSection>

          {/* Goals */}
          <ReportSection icon={Target} title="Metas & OKRs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CeoKpiCard title="Atingidas" value={`${report.goalsSummary.achieved}/${report.goalsSummary.total}`} icon={CheckCircle2} accent="text-emerald-400" subtitle={report.goalsSummary.total > 0 ? `${((report.goalsSummary.achieved / report.goalsSummary.total) * 100).toFixed(0)}%` : "—"} />
              <CeoKpiCard title="Em Risco" value={String(report.goalsSummary.at_risk)} icon={AlertTriangle} accent={report.goalsSummary.at_risk > 0 ? "text-amber-400" : "text-emerald-400"} />
              <CeoKpiCard title="Críticas" value={String(report.goalsSummary.critical)} icon={ShieldAlert} accent={report.goalsSummary.critical > 0 ? "text-rose-400" : "text-emerald-400"} />
              <CeoKpiCard title="Progresso Médio" value={`${report.goalsSummary.avg_progress.toFixed(0)}%`} icon={TrendingUp} accent={report.goalsSummary.avg_progress >= 80 ? "text-emerald-400" : "text-amber-400"} />
            </div>
            {report.goals.length > 0 && (
              <div className="mt-4 space-y-2">
                {report.goals.map((g) => {
                  const statusColor = g.status === "atingida" ? "text-emerald-400" : g.status === "saudável" ? "text-blue-400" : g.status === "em risco" ? "text-amber-400" : "text-rose-400";
                  const progressColor = g.status === "atingida" ? "[&>div]:bg-emerald-400" : g.status === "saudável" ? "[&>div]:bg-blue-400" : g.status === "em risco" ? "[&>div]:bg-amber-400" : "[&>div]:bg-rose-400";
                  return (
                    <div key={g.id} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {getMetricLabel(g.metric_key)}
                            {g.company_name && <span className="text-muted-foreground ml-1">— {g.company_name}</span>}
                          </span>
                          <Badge variant="outline" className={cn("text-xs", statusColor)}>{g.status}</Badge>
                        </div>
                        <Progress value={Math.min(g.progress_percent, 100)} className={cn("h-1.5", progressColor)} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{g.progress_percent.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </ReportSection>

          {/* Alerts */}
          {report.alerts.length > 0 && (
            <ReportSection icon={AlertTriangle} title="Alertas Executivos">
              <div className="space-y-2">
                {report.alerts.map((a, i) => {
                  const color = a.type === "danger" ? "border-rose-400/20 bg-rose-400/5" : a.type === "warning" ? "border-amber-400/20 bg-amber-400/5" : "border-blue-400/20 bg-blue-400/5";
                  const iconColor = a.type === "danger" ? "text-rose-400" : a.type === "warning" ? "text-amber-400" : "text-blue-400";
                  return (
                    <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", color)}>
                      <AlertTriangle className={cn("h-4 w-4 shrink-0 mt-0.5", iconColor)} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ReportSection>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function ReportSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-400" />
          {title}
        </CardTitle>
        <Separator />
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function HighlightsCard({ highlights }: { highlights: ReportHighlight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          Destaques Positivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {highlights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sem destaques identificados no período</p>
        ) : highlights.map((h, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{h.title}</p>
              <p className="text-xs text-muted-foreground">{h.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RisksCard({ risks }: { risks: ReportRisk[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-400" />
          Riscos e Atenções
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {risks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum risco identificado — cenário saudável 🎯</p>
        ) : risks.map((r, i) => {
          const color = r.severity === "high" ? "border-rose-400/20 bg-rose-400/5" : "border-amber-400/20 bg-amber-400/5";
          const iconColor = r.severity === "high" ? "text-rose-400" : "text-amber-400";
          return (
            <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", color)}>
              <AlertTriangle className={cn("h-4 w-4 shrink-0 mt-0.5", iconColor)} />
              <div>
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
