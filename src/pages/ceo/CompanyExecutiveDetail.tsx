import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Building2,
  Users,
  ShoppingCart,
  FileText,
  CalendarIcon,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCompanyExecutiveDetail } from "@/services/ceoDashboardService";
import {
  getTopUnits,
  getTopClients,
  getTopProducts,
  getCategoryBreakdown,
} from "@/services/ceoRankingService";
import { CeoKpiCard } from "@/components/ceo/CeoKpiCard";
import { CeoMonthlyChart } from "@/components/ceo/CeoMonthlyChart";
import { CeoUnitRanking } from "@/components/ceo/CeoUnitRanking";
import { CeoTopClients } from "@/components/ceo/CeoTopClients";
import { CeoTopProducts } from "@/components/ceo/CeoTopProducts";
import { CeoCategoryBreakdown } from "@/components/ceo/CeoCategoryBreakdown";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CompanyExecutiveDetail() {
  const { companyId } = useParams<{ companyId: string }>();
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

  const rankingFilters = useMemo(
    () => ({ ...filters, companyId }),
    [filters, companyId]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["ceo-company-detail", companyId, filters],
    queryFn: () => getCompanyExecutiveDetail(companyId!, filters),
    enabled: !!companyId,
  });

  const { data: topUnits = [], isLoading: loadingUnits } = useQuery({
    queryKey: ["ceo-top-units", rankingFilters],
    queryFn: () => getTopUnits(rankingFilters),
    enabled: !!companyId,
  });

  const { data: topClients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["ceo-top-clients", rankingFilters],
    queryFn: () => getTopClients(rankingFilters),
    enabled: !!companyId,
  });

  const { data: topProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["ceo-top-products", rankingFilters],
    queryFn: () => getTopProducts(rankingFilters),
    enabled: !!companyId,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["ceo-categories", rankingFilters],
    queryFn: () => getCategoryBreakdown(rankingFilters),
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[320px]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Empresa não encontrada</p>
        <Link to="/ceo">
          <Button variant="outline" className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/ceo">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {data.company.name}
            </h1>
            {data.company.brand_name && (
              <p className="text-muted-foreground">{data.company.brand_name}</p>
            )}
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-fit">
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.from, "dd/MM/yy")} —{" "}
              {format(dateRange.to, "dd/MM/yy")}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <CeoKpiCard
          title="Faturamento"
          value={fmt(data.revenue)}
          icon={DollarSign}
          accent="text-emerald-400"
        />
        <CeoKpiCard
          title="Custo"
          value={fmt(data.cost)}
          icon={TrendingDown}
          accent="text-rose-400"
        />
        <CeoKpiCard
          title="Margem"
          value={fmt(data.margin)}
          icon={TrendingUp}
          accent="text-emerald-400"
        />
        <CeoKpiCard
          title="Margem %"
          value={`${data.margin_percent.toFixed(1)}%`}
          icon={Percent}
          accent={data.margin_percent >= 30 ? "text-emerald-400" : "text-amber-400"}
        />
        <CeoKpiCard
          title="Ativação"
          value={`${data.activation_rate.toFixed(0)}%`}
          icon={Activity}
          accent={
            data.activation_rate >= 70
              ? "text-emerald-400"
              : data.activation_rate >= 40
              ? "text-amber-400"
              : "text-destructive"
          }
        />
        <CeoKpiCard
          title="Unidades"
          value={String(data.units_count)}
          icon={Building2}
          accent="text-emerald-400"
        />
        <CeoKpiCard
          title="Clientes"
          value={String(data.customers_count)}
          icon={Users}
          accent="text-emerald-400"
        />
        <CeoKpiCard
          title="Pedidos"
          value={String(data.orders)}
          icon={ShoppingCart}
          accent="text-primary"
        />
        <CeoKpiCard
          title="Arquivos ECU"
          value={String(data.files)}
          icon={FileText}
          accent="text-primary"
        />
        <CeoKpiCard
          title="Ticket Médio"
          value={data.orders > 0 ? fmt(data.revenue / data.orders) : "—"}
          icon={DollarSign}
          accent="text-primary"
        />
      </div>

      {/* Monthly Chart with 3 lines */}
      <CeoMonthlyChart
        data={data.monthly}
        title={`Evolução Mensal — ${data.company.name}`}
        showCost
      />

      {/* Rankings Tabs — reusing shared components */}
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
