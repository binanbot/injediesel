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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getCompanyExecutiveDetail } from "@/services/ceoDashboardService";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
};

const tooltipStyle = {
  backgroundColor: "hsl(230, 15%, 8%)",
  border: "1px solid hsl(230, 15%, 18%)",
  borderRadius: "8px",
};

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

  const { data, isLoading } = useQuery({
    queryKey: ["ceo-company-detail", companyId, filters],
    queryFn: () => getCompanyExecutiveDetail(companyId!, filters),
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

  const kpiCards = [
    { title: "Faturamento", value: fmt(data.revenue), icon: DollarSign, accent: "text-emerald-400" },
    { title: "Custo", value: fmt(data.cost), icon: TrendingDown, accent: "text-rose-400" },
    { title: "Margem", value: fmt(data.margin), icon: TrendingUp, accent: "text-emerald-400" },
    { title: "Margem %", value: `${data.margin_percent.toFixed(1)}%`, icon: Percent, accent: data.margin_percent >= 30 ? "text-emerald-400" : "text-amber-400" },
    { title: "Unidades", value: String(data.units_count), icon: Building2, accent: "text-emerald-400" },
    { title: "Clientes", value: String(data.customers_count), icon: Users, accent: "text-emerald-400" },
    { title: "Pedidos", value: String(data.orders), icon: ShoppingCart, accent: "text-primary" },
    { title: "Arquivos ECU", value: String(data.files), icon: FileText, accent: "text-primary" },
  ];

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
            <h1 className="text-2xl font-bold text-foreground">{data.company.name}</h1>
            {data.company.brand_name && (
              <p className="text-muted-foreground">{data.company.brand_name}</p>
            )}
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-fit">
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.from, "dd/MM/yy")} — {format(dateRange.to, "dd/MM/yy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to });
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.accent}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Evolução Mensal — {data.company.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthly.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Sem dados no período
            </p>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                  <XAxis dataKey="label" stroke="hsl(230,10%,55%)" fontSize={12} />
                  <YAxis
                    stroke="hsl(230,10%,55%)"
                    fontSize={12}
                    tickFormatter={(v) => fmtShort(v)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, name: string) => [
                      fmt(v),
                      name === "revenue" ? "Faturamento" : "Margem",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(160,84%,39%)"
                    fill="hsl(160,84%,39%)"
                    fillOpacity={0.15}
                    name="revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="margin"
                    stroke="hsl(217,91%,60%)"
                    fill="hsl(217,91%,60%)"
                    fillOpacity={0.1}
                    name="margin"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
