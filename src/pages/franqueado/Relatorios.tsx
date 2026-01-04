import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
// Dados mockados de faturamento por categoria de veículo
const faturamentoMock = [
  { categoria: "Caminhão", valor: 45800, quantidade: 28, icon: Truck },
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
  "hsl(217, 91%, 60%)",   // Azul
  "hsl(142, 76%, 36%)",   // Verde
  "hsl(45, 93%, 47%)",    // Amarelo
  "hsl(262, 83%, 58%)",   // Roxo
  "hsl(0, 84%, 60%)",     // Vermelho
  "hsl(199, 89%, 48%)",   // Ciano
  "hsl(25, 95%, 53%)",    // Laranja
  "hsl(330, 81%, 60%)",   // Rosa
  "hsl(210, 14%, 53%)",   // Cinza
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

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

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
    </div>
  );
}
