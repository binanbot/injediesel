import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  ShoppingCart,
  Percent,
  Activity,
  Building2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCeoKPIs,
  getCompanyComparisons,
  getMonthlyEvolution,
  deriveCeoAlerts,
} from "@/services/ceoDashboardService";
import {
  getTopUnits,
  getTopClients,
  getTopProducts,
  getCategoryBreakdown,
} from "@/services/ceoRankingService";
import { CeoKpiCard } from "@/components/ceo/CeoKpiCard";
import { CeoMonthlyChart } from "@/components/ceo/CeoMonthlyChart";
import { CeoAlertsFeed } from "@/components/ceo/CeoAlertsFeed";
import { CeoCompanyTable } from "@/components/ceo/CeoCompanyTable";
import { CeoRevenueByCompanyChart } from "@/components/ceo/CeoRevenueByCompanyChart";
import { CeoUnitRanking } from "@/components/ceo/CeoUnitRanking";
import { CeoTopClients } from "@/components/ceo/CeoTopClients";
import { CeoTopProducts } from "@/components/ceo/CeoTopProducts";
import { CeoCategoryBreakdown } from "@/components/ceo/CeoCategoryBreakdown";
import { useCeoFilters } from "@/contexts/CeoFiltersContext";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CeoDashboard() {
  const { filters } = useCeoFilters();

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

  const { data: topUnits = [], isLoading: loadingUnits } = useQuery({
    queryKey: ["ceo-top-units", filters],
    queryFn: () => getTopUnits(filters),
  });

  const { data: topClients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["ceo-top-clients", filters],
    queryFn: () => getTopClients(filters),
  });

  const { data: topProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["ceo-top-products", filters],
    queryFn: () => getTopProducts(filters),
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["ceo-categories", filters],
    queryFn: () => getCategoryBreakdown(filters),
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Executivo</h1>
        <p className="text-muted-foreground">
          Visão consolidada de desempenho do grupo
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <CeoKpiCard title="Faturamento Total" value={fmt(kpis?.total_revenue || 0)} icon={DollarSign} accent="text-emerald-400" variation={kpis?.revenue_variation} />
            <CeoKpiCard title="Custo Total" value={fmt(kpis?.total_cost || 0)} icon={TrendingDown} accent="text-rose-400" variation={kpis?.cost_variation} invertColor />
            <CeoKpiCard title="Margem Estimada" value={fmt(kpis?.estimated_margin || 0)} icon={TrendingUp} accent="text-emerald-400" variation={kpis?.margin_variation} />
            <CeoKpiCard title="Margem %" value={`${(kpis?.margin_percent || 0).toFixed(1)}%`} icon={Percent} accent={(kpis?.margin_percent || 0) >= 30 ? "text-emerald-400" : "text-amber-400"} />
            <CeoKpiCard title="Ativação Operacional" value={`${(kpis?.activation_rate || 0).toFixed(0)}%`} icon={Activity} accent={(kpis?.activation_rate || 0) >= 70 ? "text-emerald-400" : (kpis?.activation_rate || 0) >= 40 ? "text-amber-400" : "text-destructive"} subtitle={`${kpis?.units_active || 0} unidades`} />
            <CeoKpiCard title="Empresas Ativas" value={String(kpis?.companies_active || 0)} icon={Building2} accent="text-emerald-400" />
            <CeoKpiCard title="Unidades Ativas" value={String(kpis?.units_active || 0)} icon={Users} accent="text-emerald-400" />
            <CeoKpiCard title="Pedidos" value={String(kpis?.total_orders || 0)} icon={ShoppingCart} accent="text-primary" />
            <CeoKpiCard title="Arquivos ECU" value={String(kpis?.total_files || 0)} icon={FileText} accent="text-primary" />
            <CeoKpiCard title="Ticket Médio" value={kpis && kpis.total_orders > 0 ? fmt(kpis.total_revenue / kpis.total_orders) : "—"} icon={DollarSign} accent="text-primary" />
          </>
        )}
      </div>

      {/* Alerts */}
      <CeoAlertsFeed alerts={alerts} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CeoMonthlyChart data={monthly} isLoading={loadingMonthly} showCost />
        <CeoRevenueByCompanyChart comparisons={comparisons} isLoading={loadingComparisons} />
      </div>

      {/* Company Comparison Table */}
      <CeoCompanyTable comparisons={comparisons} isLoading={loadingComparisons} />

      {/* Rankings & Analysis */}
      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="units">
          <CeoUnitRanking data={topUnits} isLoading={loadingUnits} />
        </TabsContent>
        <TabsContent value="clients">
          <CeoTopClients data={topClients} isLoading={loadingClients} />
        </TabsContent>
        <TabsContent value="products">
          <CeoTopProducts data={topProducts} isLoading={loadingProducts} />
        </TabsContent>
        <TabsContent value="categories">
          <CeoCategoryBreakdown data={categories} isLoading={loadingCategories} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
