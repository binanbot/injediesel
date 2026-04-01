import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Car,
  Truck,
  Bus,
  Bike,
  Tractor,
  Ship,
  HardHat,
  MoreHorizontal,
  CalendarIcon,
  ShoppingBag,
  Package,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { MetricTooltip, metricDefinitions } from "@/components/MetricTooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getOrderStatus } from "@/utils/orderStatus";

// Dados mockados de faturamento por categoria de veículo
const faturamentoMock = [
  { categoria: "Truck", valor: 45800, quantidade: 28, icon: Truck },
  { categoria: "Veículo de Passeio", valor: 32500, quantidade: 45, icon: Car },
  { categoria: "Pick-up", valor: 18900, quantidade: 22, icon: Truck },
  { categoria: "Ônibus", valor: 12500, quantidade: 8, icon: Bus },
  { categoria: "Máquina Agrícola", valor: 28700, quantidade: 15, icon: Tractor },
  { categoria: "Máquinas Pesadas", valor: 22300, quantidade: 12, icon: HardHat },
  { categoria: "Moto", valor: 8200, quantidade: 18, icon: Bike },
  { categoria: "Moto Aquática", valor: 3500, quantidade: 5, icon: Ship },
  { categoria: "Outro", valor: 2100, quantidade: 4, icon: MoreHorizontal },
];

// Cores para o gráfico de pizza
const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(45, 93%, 47%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
  "hsl(199, 89%, 48%)",
  "hsl(25, 95%, 53%)",
  "hsl(330, 81%, 60%)",
  "hsl(210, 14%, 53%)",
];

type Periodo = "dia" | "semana" | "mes" | "semestre" | "ano";

const periodoLabels: Record<Periodo, string> = {
  dia: "Hoje",
  semana: "Esta Semana",
  mes: "Este Mês",
  semestre: "Este Semestre",
  ano: "Este Ano",
};

// Multiplicadores simulados para cada período
const multiplicadores: Record<Periodo, number> = {
  dia: 0.05,
  semana: 0.2,
  mes: 1,
  semestre: 5.5,
  ano: 12,
};

function getDateRangeForPeriodo(periodo: Periodo): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  switch (periodo) {
    case "dia":
      break;
    case "semana":
      from.setDate(from.getDate() - from.getDay());
      break;
    case "mes":
      from.setDate(1);
      break;
    case "semestre":
      from.setMonth(from.getMonth() - 5, 1);
      break;
    case "ano":
      from.setMonth(0, 1);
      break;
  }
  return { from, to };
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Profile ID ── */
  const { data: profileId } = useQuery({
    queryKey: ["my-profile-id-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_franchisees")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data.id;
    },
    enabled: !!user?.id,
  });

  /* ── Financial entries (custos peças) ── */
  const effectiveRange = useMemo(() => {
    if (dataInicio || dataFim) {
      return {
        from: dataInicio || new Date("2020-01-01"),
        to: dataFim || new Date(),
      };
    }
    return getDateRangeForPeriodo(periodo);
  }, [periodo, dataInicio, dataFim]);

  const { data: financialData, isLoading: loadingFinancial } = useQuery({
    queryKey: ["financial-costs", profileId, effectiveRange.from.toISOString(), effectiveRange.to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_entries")
        .select(`
          *,
          orders (
            id,
            order_number,
            status,
            total_amount,
            items_count,
            created_at
          )
        `)
        .eq("franchise_profile_id", profileId!)
        .eq("scope", "franqueado")
        .eq("entry_type", "custo")
        .eq("category", "pecas_acessorios")
        .gte("competency_date", format(effectiveRange.from, "yyyy-MM-dd"))
        .lte("competency_date", format(effectiveRange.to, "yyyy-MM-dd"))
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });

  const costStats = useMemo(() => {
    if (!financialData) return { total: 0, count: 0, avgTicket: 0 };
    const total = financialData.reduce((sum, e) => sum + Number(e.amount), 0);
    const count = financialData.length;
    return { total, count, avgTicket: count > 0 ? total / count : 0 };
  }, [financialData]);

  // Calcular dados com base no período selecionado
  const dadosFaturamento = useMemo(() => {
    const mult = multiplicadores[periodo];
    return faturamentoMock.map((item) => ({
      ...item,
      valor: Math.round(item.valor * mult),
      quantidade: Math.round(item.quantidade * mult) || 1,
    }));
  }, [periodo]);

  const totalFaturamento = useMemo(() => {
    return dadosFaturamento.reduce((acc, item) => acc + item.valor, 0);
  }, [dadosFaturamento]);

  const totalServicos = useMemo(() => {
    return dadosFaturamento.reduce((acc, item) => acc + item.quantidade, 0);
  }, [dadosFaturamento]);

  const ticketMedio = useMemo(() => {
    return totalServicos > 0 ? totalFaturamento / totalServicos : 0;
  }, [totalFaturamento, totalServicos]);

  // Dados para o gráfico de pizza
  const pieData = useMemo(() => {
    return dadosFaturamento
      .filter((item) => item.valor > 0)
      .map((item) => ({
        name: item.categoria,
        value: item.valor,
      }));
  }, [dadosFaturamento]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatPercent = (value: number) => {
    const percent = totalFaturamento > 0 ? (value / totalFaturamento) * 100 : 0;
    return `${percent.toFixed(1)}%`;
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios de Faturamento</h1>
          <p className="text-muted-foreground">
            Acompanhe o faturamento por categoria de veículo
          </p>
        </div>
        
        {/* Filtros */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
                  <SelectTrigger className="glass-input">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    <SelectItem value="dia">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="semestre">Este Semestre</SelectItem>
                    <SelectItem value="ano">Este Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal glass-input",
                        !dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal glass-input",
                        !dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dataFim}
                      onSelect={setDataFim}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {(dataInicio || dataFim) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setDataInicio(undefined);
                    setDataFim(undefined);
                  }}
                >
                  Limpar datas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/20">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-muted-foreground">Faturamento Total</p>
                    <MetricTooltip explanation={metricDefinitions.faturamentoTotal} />
                  </div>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(totalFaturamento)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {periodoLabels[periodo]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-muted-foreground">Total de Serviços</p>
                    <MetricTooltip explanation={metricDefinitions.totalServicos} />
                  </div>
                  <p className="text-2xl font-bold">{totalServicos}</p>
                  <p className="text-xs text-muted-foreground">
                    {periodoLabels[periodo]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/20">
                  <DollarSign className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <MetricTooltip explanation={metricDefinitions.ticketMedio} />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(ticketMedio)}</p>
                  <p className="text-xs text-muted-foreground">Por serviço</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════
          Custos com Peças e Acessórios (Loja)
         ═══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5" />
                Custos com Peças e Acessórios
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/franqueado/loja/pedidos")}
              >
                Ver pedidos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(costStats.total)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-xl font-bold">{costStats.count}</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <MetricTooltip explanation="Valor médio por pedido de peças e acessórios no período selecionado." />
                </div>
                <p className="text-xl font-bold">{formatCurrency(costStats.avgTicket)}</p>
              </div>
            </div>

            {/* Order list */}
            {loadingFinancial ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Carregando...
              </div>
            ) : !financialData || financialData.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum pedido de peças no período
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {financialData.slice(0, 10).map((entry) => {
                  const order = entry.orders as any;
                  if (!order) return null;
                  const status = getOrderStatus(order.status);
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30 cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => navigate(`/franqueado/loja/pedidos`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center">
                          <StatusIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">#{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(order.created_at)} • {order.items_count}{" "}
                            {order.items_count === 1 ? "item" : "itens"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={cn("gap-1 border text-xs", status.badgeClass)}>
                          {status.label}
                        </Badge>
                        <span className="font-semibold text-sm text-destructive">
                          -{formatCurrency(Number(entry.amount))}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {financialData.length > 10 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate("/franqueado/loja/pedidos")}
                  >
                    Ver todos os {financialData.length} pedidos
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Gráfico de Pizza */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                Faturamento por Categoria de Veículo
              </CardTitle>
              <MetricTooltip explanation={metricDefinitions.distribuicaoCategoria} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detalhamento por categoria */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Detalhamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dadosFaturamento
                .filter((item) => item.valor > 0)
                .sort((a, b) => b.valor - a.valor)
                .map((item, index) => {
                  const Icon = item.icon;
                  const percentWidth =
                    totalFaturamento > 0
                      ? (item.valor / totalFaturamento) * 100
                      : 0;

                  return (
                    <div
                      key={item.categoria}
                      className="p-4 rounded-xl bg-secondary/30 border border-border/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: `${COLORS[index % COLORS.length]}20`,
                            }}
                          >
                            <Icon
                              className="h-5 w-5"
                              style={{ color: COLORS[index % COLORS.length] }}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{item.categoria}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantidade} serviço
                              {item.quantidade !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-success">
                            {formatCurrency(item.valor)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercent(item.valor)} do total
                          </p>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentWidth}%` }}
                          transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Resumo final */}
            <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Geral - {periodoLabels[periodo]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dadosFaturamento.filter((i) => i.valor > 0).length} categorias •{" "}
                    {totalServicos} serviços
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(totalFaturamento)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ranking de Produtos — Inteligência Comercial */}
      {profileId && <ProductRanking dateRange={effectiveRange} franchiseProfileId={profileId} />}
    </div>
  );
}
