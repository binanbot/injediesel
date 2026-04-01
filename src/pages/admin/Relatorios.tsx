import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { getOrderStatus } from "@/utils/orderStatus";
import ProductRanking from "@/components/admin/ProductRanking";
import TopBuyingUnitsCard from "@/components/admin/TopBuyingUnitsCard";
import MonthlySalesChart from "@/components/admin/MonthlySalesChart";
import CategoryRankingCard from "@/components/admin/CategoryRankingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { 
  CalendarIcon, 
  Trophy, 
  TrendingUp, 
  Truck, 
  Car, 
  Bike, 
  Tractor,
  HardHat,
  Ship,
  Zap,
  Medal,
  Crown,
  Award,
  ShoppingCart,
} from "lucide-react";
import { motion } from "framer-motion";
import { MetricTooltip, metricDefinitions } from "@/components/MetricTooltip";

const arquivosPorUnidade = [
  { nome: "São Paulo - Centro", arquivos: 45 },
  { nome: "Rio de Janeiro", arquivos: 38 },
  { nome: "Belo Horizonte", arquivos: 32 },
  { nome: "Curitiba", arquivos: 28 },
  { nome: "Porto Alegre", arquivos: 24 },
  { nome: "Campinas", arquivos: 20 },
  { nome: "Santos", arquivos: 18 },
  { nome: "Florianópolis", arquivos: 15 },
];

const statusPedidos = [
  { name: "Concluído", value: 280, color: "hsl(142, 76%, 36%)" },
  { name: "Processando", value: 25, color: "hsl(38, 92%, 50%)" },
  { name: "Cancelado", value: 15, color: "hsl(0, 72%, 51%)" },
  { name: "Pendente", value: 4, color: "hsl(199, 89%, 48%)" },
];

const atuacaoPorArea = [
  { area: "Sul", cidades: 37 },
  { area: "Sudeste", cidades: 85 },
  { area: "Centro-Oeste", cidades: 12 },
  { area: "Nordeste", cidades: 15 },
  { area: "Norte", cidades: 7 },
];

const evolucaoMensal = [
  { mes: "Jan", arquivos: 120, receita: 45000 },
  { mes: "Fev", arquivos: 145, receita: 52000 },
  { mes: "Mar", arquivos: 160, receita: 58000 },
  { mes: "Abr", arquivos: 180, receita: 65000 },
  { mes: "Mai", arquivos: 210, receita: 72000 },
  { mes: "Jun", arquivos: 230, receita: 78000 },
  { mes: "Jul", arquivos: 250, receita: 85000 },
  { mes: "Ago", arquivos: 280, receita: 92000 },
  { mes: "Set", arquivos: 295, receita: 98000 },
  { mes: "Out", arquivos: 310, receita: 105000 },
  { mes: "Nov", arquivos: 318, receita: 110000 },
  { mes: "Dez", arquivos: 324, receita: 115000 },
];

// Dados de desempenho por categoria/nicho
const desempenhoPorCategoria = [
  { categoria: "Truck", icon: Truck, arquivos: 892, receita: 445000, crescimento: 15.2, cor: "hsl(217, 91%, 60%)" },
  { categoria: "Agrícola", icon: Tractor, arquivos: 654, receita: 392000, crescimento: 22.8, cor: "hsl(142, 76%, 36%)" },
  { categoria: "Pick-up", icon: Car, arquivos: 523, receita: 261500, crescimento: 8.5, cor: "hsl(45, 93%, 47%)" },
  { categoria: "Pesados", icon: HardHat, arquivos: 412, receita: 329600, crescimento: 18.3, cor: "hsl(262, 83%, 58%)" },
  { categoria: "Veículo de Passeio", icon: Car, arquivos: 387, receita: 154800, crescimento: 5.2, cor: "hsl(199, 89%, 48%)" },
  { categoria: "Ônibus", icon: Truck, arquivos: 234, receita: 187200, crescimento: 12.1, cor: "hsl(25, 95%, 53%)" },
  { categoria: "Motos", icon: Bike, arquivos: 198, receita: 59400, crescimento: -2.3, cor: "hsl(330, 81%, 60%)" },
  { categoria: "Moto Aquática", icon: Ship, arquivos: 87, receita: 43500, crescimento: 35.7, cor: "hsl(180, 70%, 45%)" },
  { categoria: "Geradores", icon: Zap, arquivos: 56, receita: 33600, crescimento: 28.4, cor: "hsl(48, 96%, 53%)" },
];

// Top 10 revendas por categoria
const revendasPorCategoria: Record<string, Array<{ nome: string; arquivos: number; receita: number; cidade: string }>> = {
  all: [
    { nome: "Auto Remap SP", arquivos: 156, receita: 234000, cidade: "São Paulo" },
    { nome: "Diesel Power RJ", arquivos: 142, receita: 213000, cidade: "Rio de Janeiro" },
    { nome: "TurboTech BH", arquivos: 128, receita: 192000, cidade: "Belo Horizonte" },
    { nome: "Remap Sul", arquivos: 115, receita: 172500, cidade: "Porto Alegre" },
    { nome: "Performance Curitiba", arquivos: 108, receita: 162000, cidade: "Curitiba" },
    { nome: "ECU Masters", arquivos: 98, receita: 147000, cidade: "Campinas" },
    { nome: "Chip Tuning Santos", arquivos: 92, receita: 138000, cidade: "Santos" },
    { nome: "Power Stage Floripa", arquivos: 87, receita: 130500, cidade: "Florianópolis" },
    { nome: "Remap Center", arquivos: 82, receita: 123000, cidade: "Goiânia" },
    { nome: "Diesel Evolution", arquivos: 78, receita: 117000, cidade: "Brasília" },
  ],
  caminhao: [
    { nome: "Diesel Power RJ", arquivos: 89, receita: 178000, cidade: "Rio de Janeiro" },
    { nome: "Auto Remap SP", arquivos: 76, receita: 152000, cidade: "São Paulo" },
    { nome: "TurboTech BH", arquivos: 68, receita: 136000, cidade: "Belo Horizonte" },
    { nome: "Remap Sul", arquivos: 62, receita: 124000, cidade: "Porto Alegre" },
    { nome: "Performance Curitiba", arquivos: 55, receita: 110000, cidade: "Curitiba" },
    { nome: "Truck Power", arquivos: 48, receita: 96000, cidade: "Ribeirão Preto" },
    { nome: "ECU Masters", arquivos: 42, receita: 84000, cidade: "Campinas" },
    { nome: "Diesel Evolution", arquivos: 38, receita: 76000, cidade: "Brasília" },
    { nome: "Heavy Remap", arquivos: 35, receita: 70000, cidade: "Uberlândia" },
    { nome: "Remap Center", arquivos: 32, receita: 64000, cidade: "Goiânia" },
  ],
  agricola: [
    { nome: "Agro Remap MT", arquivos: 124, receita: 186000, cidade: "Cuiabá" },
    { nome: "Campo Power", arquivos: 98, receita: 147000, cidade: "Rondonópolis" },
    { nome: "Rural Tech", arquivos: 87, receita: 130500, cidade: "Sorriso" },
    { nome: "Agro Performance", arquivos: 76, receita: 114000, cidade: "Lucas do Rio Verde" },
    { nome: "TurboTech BH", arquivos: 65, receita: 97500, cidade: "Belo Horizonte" },
    { nome: "Farm Chip", arquivos: 54, receita: 81000, cidade: "Rio Verde" },
    { nome: "Agro ECU", arquivos: 48, receita: 72000, cidade: "Dourados" },
    { nome: "Colheita Power", arquivos: 42, receita: 63000, cidade: "Primavera do Leste" },
    { nome: "Remap Rural", arquivos: 38, receita: 57000, cidade: "Sinop" },
    { nome: "AgroMax Chip", arquivos: 34, receita: 51000, cidade: "Cascavel" },
  ],
  pickup: [
    { nome: "Auto Remap SP", arquivos: 67, receita: 100500, cidade: "São Paulo" },
    { nome: "Pick Power", arquivos: 58, receita: 87000, cidade: "Goiânia" },
    { nome: "4x4 Remap", arquivos: 52, receita: 78000, cidade: "Campo Grande" },
    { nome: "Performance Curitiba", arquivos: 48, receita: 72000, cidade: "Curitiba" },
    { nome: "Remap Sul", arquivos: 44, receita: 66000, cidade: "Porto Alegre" },
    { nome: "Diesel Power RJ", arquivos: 41, receita: 61500, cidade: "Rio de Janeiro" },
    { nome: "Off Road Chip", arquivos: 38, receita: 57000, cidade: "Londrina" },
    { nome: "ECU Masters", arquivos: 35, receita: 52500, cidade: "Campinas" },
    { nome: "Truck Light", arquivos: 32, receita: 48000, cidade: "Maringá" },
    { nome: "TurboTech BH", arquivos: 29, receita: 43500, cidade: "Belo Horizonte" },
  ],
  pesados: [
    { nome: "Heavy Duty SP", arquivos: 78, receita: 156000, cidade: "São Paulo" },
    { nome: "Construção Power", arquivos: 65, receita: 130000, cidade: "Rio de Janeiro" },
    { nome: "Máquinas Remap", arquivos: 54, receita: 108000, cidade: "Belo Horizonte" },
    { nome: "Industrial Chip", arquivos: 48, receita: 96000, cidade: "Curitiba" },
    { nome: "Mining Power", arquivos: 42, receita: 84000, cidade: "Carajás" },
    { nome: "Construction ECU", arquivos: 38, receita: 76000, cidade: "Vitória" },
    { nome: "Heavy Remap", arquivos: 34, receita: 68000, cidade: "Salvador" },
    { nome: "Power Caterpillar", arquivos: 30, receita: 60000, cidade: "Manaus" },
    { nome: "Equipment Chip", arquivos: 26, receita: 52000, cidade: "Recife" },
    { nome: "Industrial Tech", arquivos: 22, receita: 44000, cidade: "Fortaleza" },
  ],
  motos: [
    { nome: "Moto Power SP", arquivos: 45, receita: 22500, cidade: "São Paulo" },
    { nome: "2 Rodas Chip", arquivos: 38, receita: 19000, cidade: "Rio de Janeiro" },
    { nome: "Bike Remap", arquivos: 32, receita: 16000, cidade: "Curitiba" },
    { nome: "Moto Tech", arquivos: 28, receita: 14000, cidade: "Belo Horizonte" },
    { nome: "Speed Chip", arquivos: 24, receita: 12000, cidade: "Porto Alegre" },
    { nome: "Racing ECU", arquivos: 21, receita: 10500, cidade: "Florianópolis" },
    { nome: "Moto Evolution", arquivos: 18, receita: 9000, cidade: "Brasília" },
    { nome: "Bike Power", arquivos: 15, receita: 7500, cidade: "Salvador" },
    { nome: "Two Wheels", arquivos: 12, receita: 6000, cidade: "Recife" },
    { nome: "Moto Performance", arquivos: 10, receita: 5000, cidade: "Goiânia" },
  ],
  aquatica: [
    { nome: "Náutica Power", arquivos: 24, receita: 36000, cidade: "Angra dos Reis" },
    { nome: "Marine Chip", arquivos: 18, receita: 27000, cidade: "Florianópolis" },
    { nome: "Jet Remap", arquivos: 14, receita: 21000, cidade: "Guarujá" },
    { nome: "Sea Power", arquivos: 11, receita: 16500, cidade: "Búzios" },
    { nome: "Wave ECU", arquivos: 9, receita: 13500, cidade: "Cabo Frio" },
    { nome: "Ocean Tech", arquivos: 7, receita: 10500, cidade: "Ilhabela" },
    { nome: "Aqua Remap", arquivos: 5, receita: 7500, cidade: "Paraty" },
    { nome: "Marina Chip", arquivos: 4, receita: 6000, cidade: "Santos" },
    { nome: "Boat Power", arquivos: 3, receita: 4500, cidade: "Itajaí" },
    { nome: "Sail ECU", arquivos: 2, receita: 3000, cidade: "Balneário Camboriú" },
  ],
  geradores: [
    { nome: "Industrial Power", arquivos: 18, receita: 27000, cidade: "São Paulo" },
    { nome: "Generator Chip", arquivos: 12, receita: 18000, cidade: "Rio de Janeiro" },
    { nome: "Energy Remap", arquivos: 9, receita: 13500, cidade: "Belo Horizonte" },
    { nome: "Power Gen", arquivos: 7, receita: 10500, cidade: "Curitiba" },
    { nome: "Electric ECU", arquivos: 5, receita: 7500, cidade: "Porto Alegre" },
    { nome: "Gen Tech", arquivos: 4, receita: 6000, cidade: "Brasília" },
    { nome: "Energy Solutions", arquivos: 3, receita: 4500, cidade: "Salvador" },
    { nome: "Power Solutions", arquivos: 2, receita: 3000, cidade: "Recife" },
    { nome: "Gen Power", arquivos: 1, receita: 1500, cidade: "Manaus" },
    { nome: "Electric Power", arquivos: 1, receita: 1500, cidade: "Fortaleza" },
  ],
};

const categoriaOptions = [
  { value: "all", label: "Todas as Categorias" },
  { value: "caminhao", label: "Truck" },
  { value: "agricola", label: "Agrícola" },
  { value: "pickup", label: "Pick-up" },
  { value: "pesados", label: "Pesados" },
  { value: "motos", label: "Motos" },
  { value: "aquatica", label: "Moto Aquática" },
  { value: "geradores", label: "Geradores" },
];

const getMedalIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 1:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 2:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
  }
};

export default function AdminRelatorios() {
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [categoriaFiltro, setCategoriaFiltro] = useState("all");

  const effectiveRange = useMemo(() => ({
    from: dataInicio || startOfMonth(new Date()),
    to: dataFim || endOfMonth(new Date()),
  }), [dataInicio, dataFim]);

  // Fetch financial entries for matriz revenue (peças e acessórios)
  const { data: matrizFinancial } = useQuery({
    queryKey: ["matriz-revenue", effectiveRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_entries")
        .select(`
          *,
          orders (
            id, order_number, status, total_amount, items_count, created_at,
            franchise_profile_id,
            unit_id
          )
        `)
        .eq("scope", "matriz")
        .eq("entry_type", "receita")
        .eq("category", "pecas_acessorios")
        .gte("competency_date", format(effectiveRange.from, "yyyy-MM-dd"))
        .lte("competency_date", format(effectiveRange.to, "yyyy-MM-dd"))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch units for ranking
  const { data: allUnits } = useQuery({
    queryKey: ["units-list"],
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, name, city, state");
      return data || [];
    },
  });

  const matrizStats = useMemo(() => {
    if (!matrizFinancial) return { total: 0, count: 0, avg: 0, byUnit: [] as { name: string; total: number; count: number }[] };
    const total = matrizFinancial.reduce((s, e) => s + Number(e.amount), 0);
    const count = matrizFinancial.length;
    const avg = count > 0 ? total / count : 0;

    // Group by unit
    const unitMap = new Map<string, { total: number; count: number }>();
    matrizFinancial.forEach((entry) => {
      const unitId = (entry.orders as any)?.unit_id;
      if (!unitId) return;
      const existing = unitMap.get(unitId) || { total: 0, count: 0 };
      existing.total += Number(entry.amount);
      existing.count += 1;
      unitMap.set(unitId, existing);
    });

    const byUnit = Array.from(unitMap.entries())
      .map(([id, val]) => {
        const unit = allUnits?.find((u) => u.id === id);
        return { name: unit ? `${unit.name}${unit.city ? ` - ${unit.city}` : ""}` : id, ...val };
      })
      .sort((a, b) => b.total - a.total);

    return { total, count, avg, byUnit };
  }, [matrizFinancial, allUnits]);

  const revendasFiltradas = useMemo(() => {
    return revendasPorCategoria[categoriaFiltro] || revendasPorCategoria.all;
  }, [categoriaFiltro]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">Análise detalhada do desempenho do sistema.</p>
          </div>
          <div className="flex gap-2">
            <Select defaultValue="2024">
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros de data */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 sm:max-w-[200px]">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex-1 sm:max-w-[200px]">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
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

      {/* Faturamento Loja Promax */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Faturamento Loja Promax — Peças e Acessórios
              </CardTitle>
              <Link to="/admin/compras">
                <Button variant="outline" size="sm">Ver todos os pedidos →</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/50 bg-secondary/20">
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold text-success mt-1">{formatCurrency(matrizStats.total)}</p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-secondary/20">
                <p className="text-sm text-muted-foreground">Pedidos no Período</p>
                <p className="text-2xl font-bold mt-1">{matrizStats.count}</p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-secondary/20">
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(matrizStats.avg)}</p>
              </div>
            </div>

            {/* Ranking por Unidade */}
            {matrizStats.byUnit.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Ranking de Unidades — Compras</h3>
                <div className="space-y-2">
                  {matrizStats.byUnit.slice(0, 10).map((unit, index) => (
                    <motion.div
                      key={unit.name}
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
                        <p className="font-medium truncate">{unit.name}</p>
                        <p className="text-xs text-muted-foreground">{unit.count} pedido{unit.count !== 1 ? "s" : ""}</p>
                      </div>
                      <p className="font-bold text-success">{formatCurrency(unit.total)}</p>
                      <div className="hidden sm:block flex-shrink-0 w-24">
                        <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${matrizStats.byUnit[0]?.total ? (unit.total / matrizStats.byUnit[0].total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent orders list */}
            {matrizFinancial && matrizFinancial.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Pedidos Recentes</h3>
                <div className="space-y-2">
                  {matrizFinancial.slice(0, 8).map((entry) => {
                    const order = entry.orders as any;
                    if (!order) return null;
                    const status = getOrderStatus(order.status);
                    return (
                      <Link key={entry.id} to={`/admin/compras/${order.id}`} className="block">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge className={cn(status.color, "text-white text-xs")}>{status.label}</Badge>
                            <span className="font-mono text-sm">{order.order_number}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">{order.items_count} ite{order.items_count !== 1 ? "ns" : "m"}</span>
                            <span className="font-bold text-success">{formatCurrency(Number(order.total_amount))}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {matrizFinancial && matrizFinancial.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado no período selecionado.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Ranking de Produtos — Inteligência Comercial */}
      <ProductRanking dateRange={effectiveRange} />

      {/* Ranking de Unidades — Compras */}
      <TopBuyingUnitsCard dateRange={effectiveRange} />

      {/* Gráfico Mensal de Vendas */}
      <MonthlySalesChart dateRange={effectiveRange} />

      {/* Desempenho por Categoria/Nicho */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Desempenho por Categoria de Veículo
              </CardTitle>
              <MetricTooltip explanation={metricDefinitions.desempenhoCategoria} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {desempenhoPorCategoria.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.categoria}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${item.cor}20` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: item.cor }} />
                        </div>
                        <span className="font-medium">{item.categoria}</span>
                      </div>
                      <Badge 
                        variant={item.crescimento >= 0 ? "default" : "destructive"}
                        className={item.crescimento >= 0 ? "bg-success/20 text-success" : ""}
                      >
                        {item.crescimento >= 0 ? "+" : ""}{item.crescimento}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Arquivos</p>
                        <p className="font-bold text-lg">{item.arquivos.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Receita</p>
                        <p className="font-bold text-lg text-success">{formatCurrency(item.receita)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top 10 Revendas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top 10 Melhores Revendas
                </CardTitle>
                <MetricTooltip explanation={metricDefinitions.rankingRevendas} />
              </div>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revendasFiltradas.map((revenda, index) => (
                <motion.div
                  key={revenda.nome}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                    index === 0 
                      ? "border-yellow-500/50 bg-yellow-500/10" 
                      : index === 1 
                      ? "border-gray-400/50 bg-gray-400/10"
                      : index === 2
                      ? "border-amber-600/50 bg-amber-600/10"
                      : "border-border/50 bg-secondary/20"
                  )}
                >
                  <div className="flex-shrink-0">
                    {getMedalIcon(index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{revenda.nome}</p>
                      <Badge variant="outline" className="text-xs">
                        {revenda.cidade}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{revenda.arquivos} arquivos</span>
                      <span className="text-success font-medium">{formatCurrency(revenda.receita)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div 
                      className="h-2 rounded-full bg-secondary/50 w-24 overflow-hidden"
                    >
                      <div 
                        className="h-full rounded-full bg-primary"
                        style={{ 
                          width: `${(revenda.arquivos / revendasFiltradas[0].arquivos) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Evolution Chart */}
      <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Evolução Anual</CardTitle>
              <MetricTooltip explanation={metricDefinitions.evolucaoMensal} />
            </div>
          </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                <XAxis dataKey="mes" stroke="hsl(230, 10%, 55%)" />
                <YAxis yAxisId="left" stroke="hsl(230, 10%, 55%)" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(230, 10%, 55%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(230, 15%, 8%)",
                    border: "1px solid hsl(230, 15%, 18%)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="arquivos"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(217, 91%, 60%)" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="receita"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 76%, 36%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Arquivos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Receita (R$)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Files by Unit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Arquivos por Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arquivosPorUnidade} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                  <XAxis type="number" stroke="hsl(230, 10%, 55%)" />
                  <YAxis dataKey="nome" type="category" stroke="hsl(230, 10%, 55%)" width={120} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(230, 15%, 8%)",
                      border: "1px solid hsl(230, 15%, 18%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="arquivos" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPedidos}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPedidos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(230, 15%, 8%)",
                      border: "1px solid hsl(230, 15%, 18%)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {statusPedidos.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground flex-1">{item.name}</span>
                    <span className="font-medium">{item.value}</span>
                    <span className="text-sm text-muted-foreground">
                      ({Math.round((item.value / 324) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage by Region */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atuação por Região</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atuacaoPorArea}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                <XAxis dataKey="area" stroke="hsl(230, 10%, 55%)" />
                <YAxis stroke="hsl(230, 10%, 55%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(230, 15%, 8%)",
                    border: "1px solid hsl(230, 15%, 18%)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="cidades" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]}>
                  {atuacaoPorArea.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(217, 91%, ${60 - index * 8}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
