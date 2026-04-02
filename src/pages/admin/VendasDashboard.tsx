import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Crown,
  Medal,
  Award,
  DollarSign,
  Target,
  ShoppingCart,
  FileText,
  Users,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getSellerRanking, type SellerRankingRow } from "@/services/salesRankingService";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useLocation } from "react-router-dom";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getMedalIcon = (index: number) => {
  switch (index) {
    case 0: return <Crown className="h-5 w-5 text-yellow-500" />;
    case 1: return <Medal className="h-5 w-5 text-gray-400" />;
    case 2: return <Award className="h-5 w-5 text-amber-600" />;
    default: return (
      <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
        {index + 1}
      </span>
    );
  }
};

const modeLabel: Record<string, string> = {
  ecu: "ECU",
  parts: "Peças",
  both: "Misto",
};

export default function VendasDashboard() {
  const location = useLocation();
  const isMaster = location.pathname.startsWith("/master");
  const { company } = useCompany();
  const { userRole } = useAuth();

  const now = new Date();
  const [dateRange] = useState({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });
  const [saleTypeFilter, setSaleTypeFilter] = useState("total");

  const companyId = isMaster ? undefined : company?.id;

  const { data: ranking = [], isLoading } = useQuery({
    queryKey: [
      "seller-ranking",
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
      companyId,
      saleTypeFilter,
    ],
    queryFn: () =>
      getSellerRanking({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
        companyId,
        saleType: saleTypeFilter,
      }),
  });

  const kpis = useMemo(() => {
    const totalRevenue = ranking.reduce((s, r) => s + r.total_revenue, 0);
    const totalOrders = ranking.reduce((s, r) => s + r.orders_count, 0);
    const totalFiles = ranking.reduce((s, r) => s + r.files_count, 0);
    const totalCommission = ranking.reduce((s, r) => s + r.estimated_commission, 0);
    const avgTicket = (totalOrders + totalFiles) > 0 ? totalRevenue / (totalOrders + totalFiles) : 0;
    return { totalRevenue, totalOrders, totalFiles, totalCommission, avgTicket, sellersCount: ranking.length };
  }, [ranking]);

  const periodLabel = format(dateRange.from, "MMMM yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Painel Comercial
          </h1>
          <p className="text-muted-foreground text-sm capitalize">{periodLabel}</p>
        </div>
        <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Consolidado</SelectItem>
            <SelectItem value="ecu">Serviços ECU</SelectItem>
            <SelectItem value="parts">Peças / Produtos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-28" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard icon={DollarSign} label="Faturamento" value={fmtCurrency(kpis.totalRevenue)} accent="text-emerald-500" />
            <KpiCard icon={ShoppingCart} label="Pedidos" value={String(kpis.totalOrders)} accent="text-primary" />
            <KpiCard icon={FileText} label="Arquivos ECU" value={String(kpis.totalFiles)} accent="text-primary" />
            <KpiCard icon={Users} label="Vendedores" value={String(kpis.sellersCount)} accent="text-primary" />
            <KpiCard icon={Target} label="Ticket Médio" value={fmtCurrency(kpis.avgTicket)} accent="text-amber-500" />
            <KpiCard icon={Percent} label="Comissão Est." value={fmtCurrency(kpis.totalCommission)} accent="text-rose-500" />
          </>
        )}
      </div>

      {/* Ranking Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="orders">Volume</TabsTrigger>
          <TabsTrigger value="ticket">Ticket Médio</TabsTrigger>
          <TabsTrigger value="targets">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RankingList
            data={[...ranking].sort((a, b) => b.total_revenue - a.total_revenue)}
            isLoading={isLoading}
            renderValue={(r) => fmtCurrency(r.total_revenue)}
            renderSub={(r) => `${r.orders_count} pedidos • ${r.files_count} arquivos`}
            maxExtractor={(r) => r.total_revenue}
          />
        </TabsContent>

        <TabsContent value="orders">
          <RankingList
            data={[...ranking].sort((a, b) => (b.orders_count + b.files_count) - (a.orders_count + a.files_count))}
            isLoading={isLoading}
            renderValue={(r) => `${r.orders_count + r.files_count} vendas`}
            renderSub={(r) => fmtCurrency(r.total_revenue)}
            maxExtractor={(r) => r.orders_count + r.files_count}
          />
        </TabsContent>

        <TabsContent value="ticket">
          <RankingList
            data={[...ranking].sort((a, b) => b.avg_ticket - a.avg_ticket)}
            isLoading={isLoading}
            renderValue={(r) => fmtCurrency(r.avg_ticket)}
            renderSub={(r) => `${r.orders_count + r.files_count} vendas`}
            maxExtractor={(r) => r.avg_ticket}
          />
        </TabsContent>

        <TabsContent value="targets">
          <TargetsView data={ranking} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={cn("h-4 w-4", accent)} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function RankingList({
  data,
  isLoading,
  renderValue,
  renderSub,
  maxExtractor,
}: {
  data: SellerRankingRow[];
  isLoading: boolean;
  renderValue: (r: SellerRankingRow) => string;
  renderSub: (r: SellerRankingRow) => string;
  maxExtractor: (r: SellerRankingRow) => number;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Carregando ranking...
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum vendedor com vendas no período.
        </CardContent>
      </Card>
    );
  }

  const maxVal = maxExtractor(data[0]) || 1;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {data.map((row, index) => {
            const barPct = (maxExtractor(row) / maxVal) * 100;
            return (
              <motion.div
                key={row.seller_profile_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  index === 0 ? "border-yellow-500/50 bg-yellow-500/10"
                    : index === 1 ? "border-gray-400/50 bg-gray-400/10"
                    : index === 2 ? "border-amber-600/50 bg-amber-600/10"
                    : "border-border/50 bg-secondary/20"
                )}
              >
                <div className="flex-shrink-0">{getMedalIcon(index)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{row.seller_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {modeLabel[row.seller_mode] || row.seller_mode}
                    </Badge>
                    <span>{row.company_name}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold">{renderValue(row)}</p>
                  <p className="text-xs text-muted-foreground">{renderSub(row)}</p>
                </div>
                <div className="hidden sm:block flex-shrink-0 w-20">
                  <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TargetsView({ data, isLoading }: { data: SellerRankingRow[]; isLoading: boolean }) {
  const sellersWithTargets = data.filter((r) => r.target_value !== null && r.target_value > 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Carregando metas...
        </CardContent>
      </Card>
    );
  }

  if (!sellersWithTargets.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma meta configurada para o período. Configure metas na página de Colaboradores.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Progresso de Metas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sellersWithTargets.map((row) => {
            const progress = Math.min(row.target_progress || 0, 100);
            const status = progress >= 100 ? "atingida" : progress >= 75 ? "saudável" : progress >= 50 ? "em risco" : "crítica";
            const statusColor = {
              atingida: "text-emerald-500",
              "saudável": "text-emerald-400",
              "em risco": "text-amber-500",
              "crítica": "text-destructive",
            }[status];

            return (
              <div key={row.seller_profile_id} className="p-4 rounded-xl border border-border/50 bg-secondary/10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{row.seller_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.company_name} • {modeLabel[row.seller_mode] || row.seller_mode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold text-sm", statusColor)}>
                      {progress.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtCurrency(row.total_revenue)} / {fmtCurrency(row.target_value!)}
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className={cn("text-[10px]", statusColor)}>
                    {status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Comissão est.: {fmtCurrency(row.estimated_commission)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
