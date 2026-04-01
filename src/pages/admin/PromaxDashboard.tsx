import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Package,
  CalendarIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import ProductRanking from "@/components/admin/ProductRanking";
import TopBuyingUnitsCard from "@/components/admin/TopBuyingUnitsCard";
import MonthlySalesChart from "@/components/admin/MonthlySalesChart";
import CategoryRankingCard from "@/components/admin/CategoryRankingCard";
import { getStoreSummary } from "@/services/storeSummaryService";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const kpiCards = [
  { key: "totalRevenue", label: "Faturamento Total", icon: DollarSign, format: fmt, color: "text-success" },
  { key: "totalOrders", label: "Pedidos Totais", icon: ShoppingCart, format: (v: number) => String(v), color: "text-primary" },
  { key: "averageTicket", label: "Ticket Médio", icon: Receipt, format: fmt, color: "text-amber-400" },
  { key: "totalItems", label: "Itens Vendidos", icon: Package, format: (v: number) => String(v), color: "text-cyan-400" },
] as const;

export default function PromaxDashboard() {
  const [dataInicio, setDataInicio] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState<Date | undefined>(endOfMonth(new Date()));

  const effectiveRange = useMemo(
    () => ({
      from: dataInicio || startOfMonth(new Date()),
      to: dataFim || endOfMonth(new Date()),
    }),
    [dataInicio, dataFim]
  );

  const { data: summary } = useQuery({
    queryKey: ["store-summary", effectiveRange.from.toISOString(), effectiveRange.to.toISOString()],
    queryFn: () =>
      getStoreSummary({
        startDate: format(effectiveRange.from, "yyyy-MM-dd"),
        endDate: format(effectiveRange.to, "yyyy-MM-dd"),
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Loja Promax</h1>
        <p className="text-muted-foreground">
          Inteligência comercial, vendas e comportamento de compra das unidades.
        </p>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 sm:max-w-[200px]">
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Data Início
              </label>
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
                    {dataInicio
                      ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar"}
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
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Data Fim
              </label>
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
                    {dataFim
                      ? format(dataFim, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar"}
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
                  setDataInicio(startOfMonth(new Date()));
                  setDataFim(endOfMonth(new Date()));
                }}
              >
                Resetar período
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const value = summary ? (summary as any)[kpi.key] : 0;
          return (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className={cn("text-2xl font-bold mt-1", kpi.color)}>
                        {kpi.format(value)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <kpi.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Monthly Chart */}
      <MonthlySalesChart dateRange={effectiveRange} />

      {/* Rankings Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ProductRanking dateRange={effectiveRange} />
        <CategoryRankingCard dateRange={effectiveRange} />
      </div>

      {/* Top Buying Units */}
      <TopBuyingUnitsCard dateRange={effectiveRange} />
    </div>
  );
}
