import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, differenceInCalendarDays } from "date-fns";
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
  AlertTriangle,
  Plus,
  CheckCircle,
  Banknote,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getSellerRanking, upsertSalesTarget, type SellerRankingRow } from "@/services/salesRankingService";
import { getCommissionClosings, generateClosing, updateClosingStatus, type CommissionClosingRow } from "@/services/commissionService";
import { buildTeamSummaries } from "@/services/teamPerformanceService";
import { logAuditEvent } from "@/services/auditService";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [modeFilter, setModeFilter] = useState("all");

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

  // Fetch avg discount given by sellers in orders this period
  const { data: discountData = [] } = useQuery({
    queryKey: ["seller-discounts", dateRange.from.toISOString(), dateRange.to.toISOString(), companyId],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("seller_profile_id, discount_amount, subtotal")
        .gte("created_at", format(dateRange.from, "yyyy-MM-dd"))
        .lte("created_at", format(dateRange.to, "yyyy-MM-dd"))
        .not("status", "in", '("cancelado","reembolsado")')
        .not("seller_profile_id", "is", null);
      const { data } = await q;
      return (data || []) as { seller_profile_id: string; discount_amount: number; subtotal: number }[];
    },
  });

  const discountBySeller = useMemo(() => {
    const map = new Map<string, { totalDiscount: number; totalSubtotal: number; count: number }>();
    for (const o of discountData) {
      if (!o.seller_profile_id) continue;
      const cur = map.get(o.seller_profile_id) || { totalDiscount: 0, totalSubtotal: 0, count: 0 };
      cur.totalDiscount += Number(o.discount_amount || 0);
      cur.totalSubtotal += Number(o.subtotal || 0);
      cur.count += 1;
      map.set(o.seller_profile_id, cur);
    }
    return map;
  }, [discountData]);

  const filteredRanking = useMemo(() => {
    if (modeFilter === "all") return ranking;
    return ranking.filter((r) => r.seller_mode === modeFilter);
  }, [ranking, modeFilter]);

  const kpis = useMemo(() => {
    const totalRevenue = filteredRanking.reduce((s, r) => s + r.total_revenue, 0);
    const totalOrders = filteredRanking.reduce((s, r) => s + r.orders_count, 0);
    const totalFiles = filteredRanking.reduce((s, r) => s + r.files_count, 0);
    const totalCommission = filteredRanking.reduce((s, r) => s + r.estimated_commission, 0);
    const avgTicket = (totalOrders + totalFiles) > 0 ? totalRevenue / (totalOrders + totalFiles) : 0;
    return { totalRevenue, totalOrders, totalFiles, totalCommission, avgTicket, sellersCount: filteredRanking.length };
  }, [filteredRanking]);

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
        <div className="flex gap-2">
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ecu">ECU</SelectItem>
              <SelectItem value="parts">Peças</SelectItem>
              <SelectItem value="both">Misto</SelectItem>
            </SelectContent>
          </Select>
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
        <TabsList className="flex-wrap">
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="orders">Volume</TabsTrigger>
          <TabsTrigger value="ticket">Ticket Médio</TabsTrigger>
          <TabsTrigger value="targets">Metas</TabsTrigger>
          <TabsTrigger value="discounts">Descontos</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RankingList
            data={[...filteredRanking].sort((a, b) => b.total_revenue - a.total_revenue)}
            isLoading={isLoading}
            renderValue={(r) => fmtCurrency(r.total_revenue)}
            renderSub={(r) => `${r.orders_count} pedidos • ${r.files_count} arquivos`}
            maxExtractor={(r) => r.total_revenue}
          />
        </TabsContent>

        <TabsContent value="orders">
          <RankingList
            data={[...filteredRanking].sort((a, b) => (b.orders_count + b.files_count) - (a.orders_count + a.files_count))}
            isLoading={isLoading}
            renderValue={(r) => `${r.orders_count + r.files_count} vendas`}
            renderSub={(r) => fmtCurrency(r.total_revenue)}
            maxExtractor={(r) => r.orders_count + r.files_count}
          />
        </TabsContent>

        <TabsContent value="ticket">
          <RankingList
            data={[...filteredRanking].sort((a, b) => b.avg_ticket - a.avg_ticket)}
            isLoading={isLoading}
            renderValue={(r) => fmtCurrency(r.avg_ticket)}
            renderSub={(r) => `${r.orders_count + r.files_count} vendas`}
            maxExtractor={(r) => r.avg_ticket}
          />
        </TabsContent>

        <TabsContent value="targets">
          <TargetsView
            data={filteredRanking}
            isLoading={isLoading}
            companyId={companyId}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="discounts">
          <DiscountAnalysis data={filteredRanking} discountBySeller={discountBySeller} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionsView
            sellers={filteredRanking}
            companyId={companyId}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamView data={filteredRanking} isLoading={isLoading} isMaster={isMaster} />
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

function TargetsView({
  data,
  isLoading,
  companyId,
  dateRange,
}: {
  data: SellerRankingRow[];
  isLoading: boolean;
  companyId?: string;
  dateRange: { from: Date; to: Date };
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formSellerId, setFormSellerId] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formSaleType, setFormSaleType] = useState("total");
  const [targetSort, setTargetSort] = useState<"progress" | "revenue" | "gap">("progress");

  const sellersWithTargets = data.filter((r) => r.target_value !== null && r.target_value > 0);

  // Forecast calculation
  const now = new Date();
  const daysElapsed = Math.max(1, differenceInCalendarDays(now, dateRange.from) + 1);
  const totalDays = Math.max(1, differenceInCalendarDays(dateRange.to, dateRange.from) + 1);
  const daysFraction = daysElapsed / totalDays;

  const enriched = useMemo(() => {
    return sellersWithTargets.map((row) => {
      const progress = Math.min(row.target_progress || 0, 150);
      const status = progress >= 100 ? "atingida" : progress >= 75 ? "saudável" : progress >= 50 ? "em risco" : "crítica";
      const forecast = daysFraction > 0 ? row.total_revenue / daysFraction : 0;
      const forecastProgress = row.target_value ? (forecast / row.target_value) * 100 : 0;
      const gap = (row.target_value || 0) - row.total_revenue;
      const commOnTarget = row.commission_type === "percentage"
        ? (row.target_value || 0) * (row.commission_value / 100)
        : 0;

      return { ...row, progress, status, forecast, forecastProgress, gap, commOnTarget };
    });
  }, [sellersWithTargets, daysFraction]);

  const sortedTargets = useMemo(() => {
    const sorted = [...enriched];
    if (targetSort === "progress") sorted.sort((a, b) => b.progress - a.progress);
    else if (targetSort === "revenue") sorted.sort((a, b) => b.total_revenue - a.total_revenue);
    else sorted.sort((a, b) => a.gap - b.gap);
    return sorted;
  }, [enriched, targetSort]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formSellerId || !formValue) throw new Error("Vendedor e valor são obrigatórios");
      await upsertSalesTarget({
        seller_profile_id: formSellerId,
        company_id: companyId || null,
        sale_type: formSaleType,
        metric_key: "revenue",
        target_value: Number(formValue),
        period_start: format(dateRange.from, "yyyy-MM-dd"),
        period_end: format(dateRange.to, "yyyy-MM-dd"),
        is_active: true,
      });
      await logAuditEvent({
        action: "sales_target.created",
        module: "metas",
        companyId,
        targetType: "sales_target",
        targetId: formSellerId,
        details: { target_value: Number(formValue), sale_type: formSaleType },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-ranking"] });
      toast.success("Meta salva!");
      setShowForm(false);
      setFormSellerId("");
      setFormValue("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Carregando metas...
        </CardContent>
      </Card>
    );
  }

  const statusColor: Record<string, string> = {
    atingida: "text-emerald-500",
    "saudável": "text-emerald-400",
    "em risco": "text-amber-500",
    "crítica": "text-destructive",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Progresso de Metas
        </h3>
        <div className="flex gap-2">
          <Select value={targetSort} onValueChange={(v) => setTargetSort(v as any)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress">% Atingimento</SelectItem>
              <SelectItem value="revenue">Faturamento</SelectItem>
              <SelectItem value="gap">Gap p/ Meta</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Period info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Dia {daysElapsed} de {totalDays} ({(daysFraction * 100).toFixed(0)}% do período)</span>
        {enriched.length > 0 && (
          <span>
            {enriched.filter(e => e.status === "atingida").length} atingida(s) •{" "}
            {enriched.filter(e => e.status === "crítica").length} crítica(s)
          </span>
        )}
      </div>

      {/* Target creation dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta de Vendas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vendedor</Label>
              <Select value={formSellerId} onValueChange={setFormSellerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {data.map((s) => (
                    <SelectItem key={s.seller_profile_id} value={s.seller_profile_id}>
                      {s.seller_name} ({modeLabel[s.seller_mode] || s.seller_mode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Venda</Label>
              <Select value={formSaleType} onValueChange={setFormSaleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Consolidado</SelectItem>
                  <SelectItem value="ecu">ECU</SelectItem>
                  <SelectItem value="parts">Peças</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor da Meta (R$)</Label>
              <Input
                type="number"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder="Ex: 50000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Período: {format(dateRange.from, "dd/MM/yyyy")} a {format(dateRange.to, "dd/MM/yyyy")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sortedTargets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma meta configurada para o período. Clique em "Nova Meta" para começar.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {sortedTargets.map((row, index) => (
                <motion.div
                  key={row.seller_profile_id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    row.status === "crítica" ? "border-destructive/40 bg-destructive/5" :
                    row.status === "atingida" ? "border-emerald-500/40 bg-emerald-500/5" :
                    "border-border/50 bg-secondary/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{row.seller_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.company_name} • {modeLabel[row.seller_mode] || row.seller_mode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold text-sm", statusColor[row.status])}>
                        {row.progress.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtCurrency(row.total_revenue)} / {fmtCurrency(row.target_value!)}
                      </p>
                    </div>
                  </div>
                  <Progress value={Math.min(row.progress, 100)} className="h-2" />
                  <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px]", statusColor[row.status])}>
                        {row.status}
                      </Badge>
                      {row.gap > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          Faltam {fmtCurrency(row.gap)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className={cn(
                              "text-[10px] font-medium",
                              row.forecastProgress >= 100 ? "text-emerald-500" : row.forecastProgress >= 75 ? "text-amber-500" : "text-destructive"
                            )}>
                              Forecast: {fmtCurrency(row.forecast)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Projeção de fechamento: {row.forecastProgress.toFixed(0)}% da meta
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-[10px] text-muted-foreground">
                        Comissão est.: {fmtCurrency(row.estimated_commission)}
                      </span>
                      {row.commOnTarget > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          Comissão meta: {fmtCurrency(row.commOnTarget)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Alert for critical forecast */}
                  {row.forecastProgress < 80 && row.forecastProgress > 0 && row.status !== "atingida" && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Projeção abaixo de 80% da meta — risco de não atingir
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DiscountAnalysis({
  data,
  discountBySeller,
  isLoading,
}: {
  data: SellerRankingRow[];
  discountBySeller: Map<string, { totalDiscount: number; totalSubtotal: number; count: number }>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Carregando análise de descontos...
        </CardContent>
      </Card>
    );
  }

  const sellersWithOrders = data.filter((r) => r.orders_count > 0);

  if (!sellersWithOrders.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum vendedor com pedidos no período.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          Análise de Descontos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sellersWithOrders.map((row) => {
            const disc = discountBySeller.get(row.seller_profile_id);
            const avgDiscountPct = disc && disc.totalSubtotal > 0
              ? (disc.totalDiscount / disc.totalSubtotal) * 100
              : 0;
            const maxAllowed = row.max_discount_pct > 0 ? row.max_discount_pct : 15;
            const exceedsPolicy = avgDiscountPct > 0 && avgDiscountPct > maxAllowed;

            return (
              <div
                key={row.seller_profile_id}
                className={cn(
                  "p-4 rounded-xl border transition-colors",
                  exceedsPolicy
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border/50 bg-secondary/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{row.seller_name}</p>
                      {exceedsPolicy && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Desconto médio ({avgDiscountPct.toFixed(1)}%) acima do limite ({maxAllowed}%)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row.company_name} • {modeLabel[row.seller_mode] || row.seller_mode} • {disc?.count || 0} pedidos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold text-sm", exceedsPolicy ? "text-destructive" : "text-foreground")}>
                      {avgDiscountPct.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtCurrency(disc?.totalDiscount || 0)} em descontos
                    </p>
                  </div>
                </div>
                {avgDiscountPct > 0 && (
                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", exceedsPolicy ? "bg-destructive" : "bg-primary")}
                        style={{ width: `${Math.min(avgDiscountPct * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CommissionsView({
  sellers,
  companyId,
  dateRange,
}: {
  sellers: SellerRankingRow[];
  companyId?: string;
  dateRange: { from: Date; to: Date };
}) {
  const queryClient = useQueryClient();
  const periodStart = format(dateRange.from, "yyyy-MM-dd");
  const periodEnd = format(dateRange.to, "yyyy-MM-dd");

  const { data: closings = [], isLoading } = useQuery({
    queryKey: ["commission-closings", periodStart, periodEnd, companyId],
    queryFn: () => getCommissionClosings({ startDate: periodStart, endDate: periodEnd, companyId }),
  });

  const generateMutation = useMutation({
    mutationFn: async (seller: SellerRankingRow) => {
      await generateClosing(seller.seller_profile_id, seller.company_id, periodStart, periodEnd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-closings"] });
      toast.success("Fechamento gerado!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aprovada" | "paga" }) => {
      await updateClosingStatus(id, status, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-closings"] });
      toast.success("Status atualizado!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const statusBadge: Record<string, { label: string; className: string }> = {
    apurada: { label: "Apurada", className: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
    aprovada: { label: "Aprovada", className: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
    paga: { label: "Paga", className: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" },
  };

  const sellersWithoutClosing = sellers.filter(
    (s) => !closings.some((c) => c.seller_profile_id === s.seller_profile_id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          Comissões do Período
        </h3>
      </div>

      {sellersWithoutClosing.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gerar fechamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sellersWithoutClosing.map((s) => (
                <Button
                  key={s.seller_profile_id}
                  size="sm"
                  variant="outline"
                  onClick={() => generateMutation.mutate(s)}
                  disabled={generateMutation.isPending}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {s.seller_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando...</CardContent></Card>
      ) : closings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum fechamento gerado para o período.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {closings.map((c) => {
                const badge = statusBadge[c.status] || statusBadge.apurada;
                return (
                  <div key={c.id} className="p-4 rounded-xl border border-border/50 bg-secondary/10">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{c.seller_name}</p>
                        <p className="text-xs text-muted-foreground">{c.company_name}</p>
                      </div>
                      <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-muted-foreground">Receita</span>
                        <p className="font-semibold">{fmtCurrency(c.total_revenue)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Comissão est.</span>
                        <p className="font-semibold">{fmtCurrency(c.estimated_commission)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Comissão real.</span>
                        <p className="font-semibold">{fmtCurrency(c.realized_commission)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vendas</span>
                        <p className="font-semibold">{c.orders_count} ped. + {c.files_count} arq.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {c.status === "apurada" && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: c.id, status: "aprovada" })}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                        </Button>
                      )}
                      {c.status === "aprovada" && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: c.id, status: "paga" })}>
                          <Banknote className="h-3 w-3 mr-1" /> Marcar Paga
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamView({
  data,
  isLoading,
  isMaster,
}: {
  data: SellerRankingRow[];
  isLoading: boolean;
  isMaster: boolean;
}) {
  const summaries = useMemo(() => buildTeamSummaries(data), [data]);

  const modeLabels: Record<string, string> = { ecu: "ECU", parts: "Peças", both: "Misto" };

  if (isLoading) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando...</CardContent></Card>;
  }

  if (!summaries.length) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Sem dados de equipe no período.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        Performance por Equipe
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {summaries.map((team) => (
          <Card key={team.companyId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{team.companyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-xs text-muted-foreground">Vendedores</span>
                  <p className="font-bold">{team.sellersCount}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Faturamento</span>
                  <p className="font-bold">{fmtCurrency(team.totalRevenue)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Média/vendedor</span>
                  <p className="font-bold">{fmtCurrency(team.avgRevenue)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Concentração</span>
                  <p className={cn("font-bold", team.concentrationPct > 60 ? "text-amber-500" : "text-foreground")}>
                    {team.concentrationPct.toFixed(0)}%
                  </p>
                </div>
              </div>

              {team.topPerformer && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <Crown className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="font-medium">{team.topPerformer.name}</span>
                  <span className="text-muted-foreground">{fmtCurrency(team.topPerformer.revenue)}</span>
                </div>
              )}

              {team.atRiskCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-destructive mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {team.atRiskCount} vendedor(es) em risco
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {Object.entries(team.byMode).map(([mode, { count, revenue }]) => (
                  <Badge key={mode} variant="outline" className="text-[10px]">
                    {modeLabels[mode] || mode}: {count} • {fmtCurrency(revenue)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}