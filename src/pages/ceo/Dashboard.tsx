import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, subMonths } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  FileText,
  ShoppingCart,
  Percent,
  AlertTriangle,
  CheckCircle,
  Info,
  CalendarIcon,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  getCeoKPIs,
  getCompanyComparisons,
  getMonthlyEvolution,
  deriveCeoAlerts,
} from "@/services/ceoDashboardService";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
};

const tooltipStyle = {
  backgroundColor: "hsl(230, 15%, 8%)",
  border: "1px solid hsl(230, 15%, 18%)",
  borderRadius: "8px",
};

const COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(217, 91%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(339, 90%, 51%)",
  "hsl(262, 83%, 58%)",
];

export default function CeoDashboard() {
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 6),
    to: new Date(),
  });

  const filters = useMemo(
    () => ({
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
    }),
    [dateRange]
  );

  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ["ceo-kpis", filters],
    queryFn: () => getCeoKPIs(filters),
  });

  const { data: comparisons = [], isLoading: loadingComparisons } = useQuery({
    queryKey: ["ceo-comparisons", filters],
    queryFn: () => getCompanyComparisons(filters),
  });

  const { data: monthly = [], isLoading: loadingMonthly } = useQuery({
    queryKey: ["ceo-monthly", filters],
    queryFn: () => getMonthlyEvolution(filters),
  });

  const alerts = useMemo(
    () =>
      kpis && comparisons.length
        ? deriveCeoAlerts(kpis, comparisons)
        : [],
    [kpis, comparisons]
  );

  const isLoading = loadingKPIs || loadingComparisons;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Executivo</h1>
          <p className="text-muted-foreground">
            Visão consolidada de desempenho do grupo
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-fit">
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.from, "dd/MM/yy")} — {format(dateRange.to, "dd/MM/yy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to });
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard
              title="Faturamento Total"
              value={fmt(kpis?.total_revenue || 0)}
              icon={DollarSign}
              accent="text-emerald-400"
            />
            <KpiCard
              title="Custo Total"
              value={fmt(kpis?.total_cost || 0)}
              icon={TrendingDown}
              accent="text-rose-400"
            />
            <KpiCard
              title="Margem Estimada"
              value={fmt(kpis?.estimated_margin || 0)}
              icon={TrendingUp}
              accent="text-emerald-400"
            />
            <KpiCard
              title="Margem %"
              value={`${(kpis?.margin_percent || 0).toFixed(1)}%`}
              icon={Percent}
              accent={(kpis?.margin_percent || 0) >= 30 ? "text-emerald-400" : "text-amber-400"}
            />
            <KpiCard
              title="Empresas Ativas"
              value={String(kpis?.companies_active || 0)}
              icon={Building2}
              accent="text-emerald-400"
            />
            <KpiCard
              title="Unidades Ativas"
              value={String(kpis?.units_active || 0)}
              icon={Users}
              accent="text-emerald-400"
            />
            <KpiCard
              title="Pedidos"
              value={String(kpis?.total_orders || 0)}
              icon={ShoppingCart}
              accent="text-primary"
            />
            <KpiCard
              title="Arquivos ECU"
              value={String(kpis?.total_files || 0)}
              icon={FileText}
              accent="text-primary"
            />
          </>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.map((alert, i) => (
            <Card
              key={i}
              className={`border-l-4 ${
                alert.type === "danger"
                  ? "border-l-destructive"
                  : alert.type === "warning"
                  ? "border-l-amber-500"
                  : "border-l-emerald-500"
              }`}
            >
              <CardContent className="pt-4 pb-3 flex items-start gap-3">
                {alert.type === "danger" ? (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                ) : alert.type === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? (
              <Skeleton className="h-[280px] w-full" />
            ) : monthly.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Sem dados no período
              </p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                    <XAxis dataKey="label" stroke="hsl(230,10%,55%)" fontSize={12} />
                    <YAxis
                      stroke="hsl(230,10%,55%)"
                      fontSize={12}
                      tickFormatter={(v) => fmtShort(v)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number, name: string) => [
                        fmt(v),
                        name === "revenue" ? "Faturamento" : "Margem",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(160,84%,39%)"
                      fill="hsl(160,84%,39%)"
                      fillOpacity={0.15}
                      name="revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="margin"
                      stroke="hsl(217,91%,60%)"
                      fill="hsl(217,91%,60%)"
                      fillOpacity={0.1}
                      name="margin"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Company */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              Faturamento por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingComparisons ? (
              <Skeleton className="h-[280px] w-full" />
            ) : comparisons.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Sem dados no período
              </p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisons} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                    <XAxis
                      type="number"
                      stroke="hsl(230,10%,55%)"
                      fontSize={12}
                      tickFormatter={(v) => fmtShort(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(230,10%,55%)"
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [fmt(v), "Faturamento"]}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {comparisons.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            Comparativo de Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingComparisons ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : comparisons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma empresa encontrada
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Empresa</th>
                    <th className="text-right py-3 px-2 font-medium">Unidades</th>
                    <th className="text-right py-3 px-2 font-medium">Faturamento</th>
                    <th className="text-right py-3 px-2 font-medium">Pedidos</th>
                    <th className="text-right py-3 px-2 font-medium">Arquivos</th>
                    <th className="text-right py-3 px-2 font-medium">Margem %</th>
                    <th className="text-center py-3 px-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          {c.brand_name && (
                            <p className="text-xs text-muted-foreground">{c.brand_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 text-muted-foreground">
                        {c.units}
                      </td>
                      <td className="text-right py-3 px-2 font-medium text-emerald-400">
                        {fmt(c.revenue)}
                      </td>
                      <td className="text-right py-3 px-2 text-muted-foreground">
                        {c.orders}
                      </td>
                      <td className="text-right py-3 px-2 text-muted-foreground">
                        {c.files}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span
                          className={
                            c.margin_percent >= 30
                              ? "text-emerald-400"
                              : c.margin_percent >= 15
                              ? "text-amber-400"
                              : "text-destructive"
                          }
                        >
                          {c.margin_percent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Link to={`/ceo/empresas/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: any;
  accent: string;
}) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${accent}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
