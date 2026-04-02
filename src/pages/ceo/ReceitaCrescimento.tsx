import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  CalendarIcon,
  Activity,
  ShoppingCart,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getGrowthKPIs,
  getCompanyGrowthRanking,
  getUnitGrowthRanking,
  deriveGrowthInsights,
} from "@/services/ceoGrowthService";
import { getMonthlyEvolution } from "@/services/ceoDashboardService";
import { CeoKpiCard } from "@/components/ceo/CeoKpiCard";
import { CeoMonthlyChart } from "@/components/ceo/CeoMonthlyChart";
import { CompanyGrowthRanking } from "@/components/ceo/CompanyGrowthRanking";
import { UnitGrowthRanking } from "@/components/ceo/UnitGrowthRanking";
import { GrowthInsightsPanel } from "@/components/ceo/GrowthInsightsPanel";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ReceitaCrescimento() {
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
    queryKey: ["ceo-growth-kpis", filters],
    queryFn: () => getGrowthKPIs(filters),
  });

  const { data: companyGrowth = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["ceo-company-growth", filters],
    queryFn: () => getCompanyGrowthRanking(filters),
  });

  const { data: unitGrowth = [], isLoading: loadingUnits } = useQuery({
    queryKey: ["ceo-unit-growth", filters],
    queryFn: () => getUnitGrowthRanking(filters),
  });

  const { data: monthly = [], isLoading: loadingMonthly } = useQuery({
    queryKey: ["ceo-growth-monthly", filters],
    queryFn: () => getMonthlyEvolution(filters),
  });

  const insights = useMemo(
    () => (kpis && companyGrowth.length ? deriveGrowthInsights(kpis, companyGrowth) : []),
    [kpis, companyGrowth]
  );

  // Sort units by growth for the growth tab
  const unitsByGrowth = useMemo(
    () => [...unitGrowth].sort((a, b) => b.growth_percent - a.growth_percent),
    [unitGrowth]
  );

  const isLoading = loadingKPIs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
            Receita & Crescimento
          </h1>
          <p className="text-muted-foreground">
            Análise de crescimento, tendências e performance financeira do grupo
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
                if (range?.from && range?.to)
                  setDateRange({ from: range.from, to: range.to });
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <CeoKpiCard
              title="Faturamento"
              value={fmt(kpis?.revenue || 0)}
              icon={DollarSign}
              accent="text-emerald-400"
              variation={kpis?.revenue_growth}
            />
            <CeoKpiCard
              title="Crescimento"
              value={`${(kpis?.revenue_growth || 0).toFixed(1)}%`}
              icon={kpis && kpis.revenue_growth >= 0 ? ArrowUpRight : ArrowDownRight}
              accent={
                (kpis?.revenue_growth || 0) >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }
              subtitle="vs período anterior"
            />
            <CeoKpiCard
              title="Custo"
              value={fmt(kpis?.cost || 0)}
              icon={TrendingDown}
              accent="text-rose-400"
              variation={kpis?.cost_growth}
              invertColor
            />
            <CeoKpiCard
              title="Margem"
              value={`${(kpis?.margin_percent || 0).toFixed(1)}%`}
              icon={Percent}
              accent={
                (kpis?.margin_percent || 0) >= 30
                  ? "text-emerald-400"
                  : "text-amber-400"
              }
              variation={kpis?.margin_growth}
            />
            <CeoKpiCard
              title="Ticket Médio"
              value={kpis && kpis.ticket_medio > 0 ? fmt(kpis.ticket_medio) : "—"}
              icon={ShoppingCart}
              accent="text-primary"
            />
            <CeoKpiCard
              title="Ativação"
              value={`${(kpis?.activation_rate || 0).toFixed(0)}%`}
              icon={Activity}
              accent={
                (kpis?.activation_rate || 0) >= 70
                  ? "text-emerald-400"
                  : "text-amber-400"
              }
              subtitle={`${kpis?.units_active || 0} de ${kpis?.units_total || 0}`}
            />
            <CeoKpiCard
              title="Pedidos"
              value={String(kpis?.total_orders || 0)}
              icon={ShoppingCart}
              accent="text-primary"
            />
            <CeoKpiCard
              title="Arquivos ECU"
              value={String(kpis?.total_files || 0)}
              icon={FileText}
              accent="text-primary"
            />
          </>
        )}
      </div>

      {/* Insights */}
      <GrowthInsightsPanel insights={insights} />

      {/* Monthly Chart */}
      <CeoMonthlyChart data={monthly} isLoading={loadingMonthly} showCost title="Evolução Mensal — Faturamento, Custo e Margem" />

      {/* Company Growth */}
      <CompanyGrowthRanking data={companyGrowth} isLoading={loadingCompanies} />

      {/* Unit Rankings */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Por Faturamento</TabsTrigger>
          <TabsTrigger value="growth">Por Crescimento</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue">
          <UnitGrowthRanking data={unitGrowth} isLoading={loadingUnits} title="Unidades por Faturamento" />
        </TabsContent>
        <TabsContent value="growth">
          <UnitGrowthRanking data={unitsByGrowth} isLoading={loadingUnits} title="Unidades por Crescimento" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
