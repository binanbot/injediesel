import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Crown,
  Percent,
  Building2,
  MapPin,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCompanyShares,
  getUnitShares,
  getCategoryShares,
  deriveMarketShareKPIs,
  deriveShareInsights,
} from "@/services/ceoMarketShareService";
import { CeoKpiCard } from "@/components/ceo/CeoKpiCard";
import { CompanyShareDistributionChart } from "@/components/ceo/CompanyShareDistributionChart";
import { ShareVariationRanking } from "@/components/ceo/ShareVariationRanking";
import { CategoryShareBreakdown } from "@/components/ceo/CategoryShareBreakdown";
import { ConcentrationCard } from "@/components/ceo/ConcentrationCard";
import { ShareInsightsPanel } from "@/components/ceo/ShareInsightsPanel";
import { useCeoFilters } from "@/contexts/CeoFiltersContext";

export default function MarketShare() {
  const { filters } = useCeoFilters();

  const { data: companyShares = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["ceo-company-shares", filters],
    queryFn: () => getCompanyShares(filters),
  });

  const { data: unitShares = [], isLoading: loadingUnits } = useQuery({
    queryKey: ["ceo-unit-shares", filters],
    queryFn: () => getUnitShares(filters),
  });

  const { data: categoryShares = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["ceo-category-shares", filters],
    queryFn: () => getCategoryShares(filters),
  });

  const kpis = useMemo(
    () => companyShares.length > 0 || unitShares.length > 0 ? deriveMarketShareKPIs(companyShares, unitShares) : null,
    [companyShares, unitShares]
  );

  const insights = useMemo(
    () => kpis ? deriveShareInsights(kpis, companyShares, unitShares) : [],
    [kpis, companyShares, unitShares]
  );

  const isLoading = loadingCompanies;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PieChart className="h-6 w-6 text-emerald-400" />
          Market Share
        </h1>
        <p className="text-muted-foreground">
          Participação relativa, concentração e distribuição de receita do grupo
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-7 w-32" /></CardContent></Card>
          ))
        ) : kpis ? (
          <>
            <CeoKpiCard title="Líder do Grupo" value={kpis.leader_name} icon={Crown} accent="text-emerald-400" subtitle={`${kpis.leader_share.toFixed(1)}% do total`} />
            <CeoKpiCard title="Share do Líder" value={`${kpis.leader_share.toFixed(1)}%`} icon={kpis.leader_share_delta >= 0 ? ArrowUpRight : ArrowDownRight} accent={kpis.leader_share > 70 ? "text-rose-400" : kpis.leader_share > 50 ? "text-amber-400" : "text-emerald-400"} variation={kpis.leader_share_delta} subtitle="vs período anterior" />
            <CeoKpiCard title="Top 3 Empresas" value={`${kpis.top3_share.toFixed(1)}%`} icon={Building2} accent={kpis.top3_share > 90 ? "text-amber-400" : "text-emerald-400"} subtitle="do faturamento total" />
            <CeoKpiCard title="Top 10 Unidades" value={`${kpis.top10_units_share.toFixed(1)}%`} icon={MapPin} accent="text-primary" subtitle="do faturamento total" />
            <CeoKpiCard title="Diversificação" value={`${kpis.diversification_percent.toFixed(1)}%`} icon={Percent} accent={kpis.diversification_percent > 40 ? "text-emerald-400" : "text-amber-400"} subtitle="receita fora do líder" />
            <CeoKpiCard title="Concentração (HHI)" value={kpis.hhi.toLocaleString("pt-BR")} icon={BarChart3} accent={kpis.concentration_level === "baixa" ? "text-emerald-400" : kpis.concentration_level === "moderada" ? "text-amber-400" : "text-rose-400"} subtitle={kpis.concentration_level.charAt(0).toUpperCase() + kpis.concentration_level.slice(1)} />
          </>
        ) : null}
      </div>

      <ShareInsightsPanel insights={insights} />
      <CompanyShareDistributionChart data={companyShares} isLoading={loadingCompanies} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConcentrationCard kpis={kpis} isLoading={isLoading} />
        <CategoryShareBreakdown data={categoryShares} isLoading={loadingCategories} />
      </div>

      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies">Empresas por Variação</TabsTrigger>
          <TabsTrigger value="units">Unidades por Participação</TabsTrigger>
        </TabsList>
        <TabsContent value="companies">
          <ShareVariationRanking data={companyShares} isLoading={loadingCompanies} title="Empresas — Variação de Participação" type="company" />
        </TabsContent>
        <TabsContent value="units">
          <ShareVariationRanking data={unitShares.slice(0, 15)} isLoading={loadingUnits} title="Unidades — Participação no Faturamento" type="unit" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
