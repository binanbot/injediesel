import { useQuery } from "@tanstack/react-query";
import {
  Percent,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  Target,
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
import { fmtPercent } from "@/utils/ceoFormatters";

export default function ComercialIntelligence() {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["ceo-playbook-cross"],
    queryFn: calcCrossCompanyPlaybook,
  });

  const avgConversion =
    companies.length > 0
      ? companies.reduce((s, c) => s + c.conversion_rate, 0) / companies.length
      : 0;

  const avgCycleHours =
    companies.filter((c) => c.avg_cycle_hours !== null).length > 0
      ? companies
          .filter((c) => c.avg_cycle_hours !== null)
          .reduce((s, c) => s + (c.avg_cycle_hours || 0), 0) /
        companies.filter((c) => c.avg_cycle_hours !== null).length
      : null;

  const totalOpportunities = companies.reduce(
    (s, c) => s + c.total_opportunities,
    0
  );

  const totalLost = companies.reduce((s, c) => s + c.total_lost, 0);

  return (
    <div className="space-y-6">
      <ExecutivePageHeader
        icon={Target}
        title="Inteligência Comercial"
        subtitle="Visão executiva do playbook e performance de vendas"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Conversão Média"
          value={isLoading ? null : fmtPercent(avgConversion)}
          icon={Percent}
          accent={avgConversion >= 30 ? "text-emerald-400" : "text-amber-400"}
          loading={isLoading}
        />
        <KpiCard
          label="Ciclo Médio"
          value={
            isLoading
              ? null
              : avgCycleHours !== null
              ? `${Math.round(avgCycleHours)}h`
              : "—"
          }
          icon={Clock}
          accent="text-primary"
          loading={isLoading}
        />
        <KpiCard
          label="Oportunidades"
          value={isLoading ? null : String(totalOpportunities)}
          icon={TrendingUp}
          accent="text-emerald-400"
          loading={isLoading}
        />
        <KpiCard
          label="Perdas Totais"
          value={isLoading ? null : String(totalLost)}
          icon={TrendingDown}
          accent="text-rose-400"
          loading={isLoading}
        />
      </div>

      {/* Company Comparison */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-emerald-400" />
            Comparativo entre Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhuma empresa com oportunidades registradas.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((c) => (
                <CompanyCard
                  key={c.company_id}
                  company={c}
                  maxConversion={Math.max(
                    ...companies.map((x) => x.conversion_rate),
                    1
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Loss Reasons */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Principais Motivos de Perda
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
                    <div
                      key={c.company_id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground truncate">
                        {c.company_name}
                      </span>
                      <Badge variant="destructive" className="text-xs shrink-0">
                        {c.top_loss_reason}
                      </Badge>
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

        {/* Top Origins */}
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

        {/* Bottlenecks */}
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

function KpiCard({
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

function CompanyCard({
  company,
  maxConversion,
}: {
  company: CompanyPlaybookSummary;
  maxConversion: number;
}) {
  const c = company;
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
          <Progress
            value={(c.conversion_rate / Math.max(maxConversion, 1)) * 100}
            className="h-2"
          />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 text-center">
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
            <p className="text-[11px] text-muted-foreground">Gargalo</p>
            <p className="text-sm font-medium truncate">
              {c.pipeline_bottleneck || "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
