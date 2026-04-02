import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  ShoppingCart,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
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
import { useCeoFilters } from "@/contexts/CeoFiltersContext";
import { fmtCurrency } from "@/utils/ceoFormatters";

export default function ReceitaCrescimento() {
  const { filters } = useCeoFilters();

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

  const unitsByGrowth = useMemo(
    () => [...unitGrowth].sort((a, b) => b.growth_percent - a.growth_percent),
    [unitGrowth]
  );

  const isLoading = loadingKPIs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
          Receita & Crescimento
        </h1>
        <p className="text-muted-foreground">
          Análise de crescimento, tendências e performance financeira do grupo
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-7 w-32" /></CardContent></Card>
          ))
        ) : (
          <>
            <CeoKpiCard title="Faturamento" value={fmt(kpis?.revenue || 0)} icon={DollarSign} accent="text-emerald-400" variation={kpis?.revenue_growth} />
            <CeoKpiCard title="Crescimento" value={`${(kpis?.revenue_growth || 0).toFixed(1)}%`} icon={kpis && kpis.revenue_growth >= 0 ? ArrowUpRight : ArrowDownRight} accent={(kpis?.revenue_growth || 0) >= 0 ? "text-emerald-400" : "text-rose-400"} subtitle="vs período anterior" />
            <CeoKpiCard title="Custo" value={fmt(kpis?.cost || 0)} icon={TrendingDown} accent="text-rose-400" variation={kpis?.cost_growth} invertColor />
            <CeoKpiCard title="Margem" value={`${(kpis?.margin_percent || 0).toFixed(1)}%`} icon={Percent} accent={(kpis?.margin_percent || 0) >= 30 ? "text-emerald-400" : "text-amber-400"} variation={kpis?.margin_growth} />
            <CeoKpiCard title="Ticket Médio" value={kpis && kpis.ticket_medio > 0 ? fmt(kpis.ticket_medio) : "—"} icon={ShoppingCart} accent="text-primary" />
            <CeoKpiCard title="Ativação" value={`${(kpis?.activation_rate || 0).toFixed(0)}%`} icon={Activity} accent={(kpis?.activation_rate || 0) >= 70 ? "text-emerald-400" : "text-amber-400"} subtitle={`${kpis?.units_active || 0} de ${kpis?.units_total || 0}`} />
            <CeoKpiCard title="Pedidos" value={String(kpis?.total_orders || 0)} icon={ShoppingCart} accent="text-primary" />
            <CeoKpiCard title="Arquivos ECU" value={String(kpis?.total_files || 0)} icon={FileText} accent="text-primary" />
          </>
        )}
      </div>

      <GrowthInsightsPanel insights={insights} />
      <CeoMonthlyChart data={monthly} isLoading={loadingMonthly} showCost title="Evolução Mensal — Faturamento, Custo e Margem" />
      <CompanyGrowthRanking data={companyGrowth} isLoading={loadingCompanies} />

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
