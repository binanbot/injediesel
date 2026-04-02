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
  BarChart3,
  Crown,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
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

const COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(217, 91%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(339, 90%, 51%)",
  "hsl(262, 83%, 58%)",
  "hsl(30, 90%, 50%)",
  "hsl(180, 70%, 45%)",
];

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
          <Button variant="outline" className="mt-4">
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Faturamento",
      value: fmt(data.revenue),
      icon: DollarSign,
      accent: "text-emerald-400",
    },
    {
      title: "Custo",
      value: fmt(data.cost),
      icon: TrendingDown,
      accent: "text-rose-400",
    },
    {
      title: "Margem",
      value: fmt(data.margin),
      icon: TrendingUp,
      accent: "text-emerald-400",
    },
    {
      title: "Margem %",
      value: `${data.margin_percent.toFixed(1)}%`,
      icon: Percent,
      accent: data.margin_percent >= 30 ? "text-emerald-400" : "text-amber-400",
    },
    {
      title: "Ativação",
      value: `${data.activation_rate.toFixed(0)}%`,
      icon: Activity,
      accent:
        data.activation_rate >= 70
          ? "text-emerald-400"
          : data.activation_rate >= 40
          ? "text-amber-400"
          : "text-destructive",
    },
    {
      title: "Unidades",
      value: String(data.units_count),
      icon: Building2,
      accent: "text-emerald-400",
    },
    {
      title: "Clientes",
      value: String(data.customers_count),
      icon: Users,
      accent: "text-emerald-400",
    },
    {
      title: "Pedidos",
      value: String(data.orders),
      icon: ShoppingCart,
      accent: "text-primary",
    },
    {
      title: "Arquivos ECU",
      value: String(data.files),
      icon: FileText,
      accent: "text-primary",
    },
    {
      title: "Ticket Médio",
      value: data.orders > 0 ? fmt(data.revenue / data.orders) : "—",
      icon: DollarSign,
      accent: "text-primary",
    },
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
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.accent}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {kpi.value}
              </div>
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(230,15%,18%)"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(230,10%,55%)"
                    fontSize={12}
                  />
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

      {/* Tabbed sections */}
      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">Ranking de Unidades</TabsTrigger>
          <TabsTrigger value="clients">Top Clientes</TabsTrigger>
          <TabsTrigger value="products">Top Produtos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* ── Unit Rankings ──────────────────────────────── */}
        <TabsContent value="units">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  Faturamento por Unidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.unit_rankings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Sem dados
                  </p>
                ) : (
                  <div
                    className="h-[300px]"
                    style={{
                      minHeight: Math.max(
                        200,
                        data.unit_rankings.length * 40
                      ),
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.unit_rankings.slice(0, 10)}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(230,15%,18%)"
                        />
                        <XAxis
                          type="number"
                          stroke="hsl(230,10%,55%)"
                          fontSize={12}
                          tickFormatter={(v) => fmtShort(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="hsl(230,10%,55%)"
                          fontSize={11}
                          width={130}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v: number) => [fmt(v), "Faturamento"]}
                        />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                          {data.unit_rankings.slice(0, 10).map((_, i) => (
                            <Cell
                              key={i}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                  Detalhamento por Unidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2 font-medium">#</th>
                        <th className="text-left py-2 px-2 font-medium">
                          Unidade
                        </th>
                        <th className="text-right py-2 px-2 font-medium">
                          Faturamento
                        </th>
                        <th className="text-right py-2 px-2 font-medium">
                          Ped.
                        </th>
                        <th className="text-right py-2 px-2 font-medium">
                          Arq.
                        </th>
                        <th className="text-right py-2 px-2 font-medium">
                          Clientes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.unit_rankings.map((u, i) => (
                        <tr
                          key={u.id}
                          className="border-b border-border/50 hover:bg-secondary/30"
                        >
                          <td className="py-2 px-2 text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="py-2 px-2">
                            <p className="font-medium text-foreground">
                              {u.name}
                            </p>
                            {u.city && (
                              <p className="text-xs text-muted-foreground">
                                {u.city}/{u.state}
                              </p>
                            )}
                          </td>
                          <td className="text-right py-2 px-2 font-medium text-emerald-400">
                            {fmt(u.revenue)}
                          </td>
                          <td className="text-right py-2 px-2 text-muted-foreground">
                            {u.orders}
                          </td>
                          <td className="text-right py-2 px-2 text-muted-foreground">
                            {u.files}
                          </td>
                          <td className="text-right py-2 px-2 text-muted-foreground">
                            {u.customers}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Top Clients ────────────────────────────────── */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-emerald-400" />
                Top 10 Clientes por Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.top_clients.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Sem dados de clientes no período
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.top_clients}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(230,15%,18%)"
                        />
                        <XAxis
                          type="number"
                          stroke="hsl(230,10%,55%)"
                          fontSize={12}
                          tickFormatter={(v) => fmtShort(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="hsl(230,10%,55%)"
                          fontSize={11}
                          width={140}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v: number) => [fmt(v), "Faturamento"]}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {data.top_clients.map((_, i) => (
                            <Cell
                              key={i}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-2 font-medium">
                            #
                          </th>
                          <th className="text-left py-2 px-2 font-medium">
                            Cliente
                          </th>
                          <th className="text-right py-2 px-2 font-medium">
                            Faturamento
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.top_clients.map((c, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50"
                          >
                            <td className="py-2 px-2 text-muted-foreground">
                              {i + 1}
                            </td>
                            <td className="py-2 px-2 font-medium text-foreground">
                              {c.name}
                            </td>
                            <td className="text-right py-2 px-2 text-emerald-400 font-medium">
                              {fmt(c.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Top Products ───────────────────────────────── */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-400" />
                Top 10 Produtos por Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.top_products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Sem dados de produtos no período
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.top_products}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(230,15%,18%)"
                        />
                        <XAxis
                          type="number"
                          stroke="hsl(230,10%,55%)"
                          fontSize={12}
                          tickFormatter={(v) => fmtShort(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="hsl(230,10%,55%)"
                          fontSize={11}
                          width={140}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v: number) => [fmt(v), "Receita"]}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {data.top_products.map((_, i) => (
                            <Cell
                              key={i}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-2 font-medium">
                            #
                          </th>
                          <th className="text-left py-2 px-2 font-medium">
                            Produto
                          </th>
                          <th className="text-right py-2 px-2 font-medium">
                            Qtd
                          </th>
                          <th className="text-right py-2 px-2 font-medium">
                            Receita
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.top_products.map((p, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50"
                          >
                            <td className="py-2 px-2 text-muted-foreground">
                              {i + 1}
                            </td>
                            <td className="py-2 px-2 font-medium text-foreground">
                              {p.name}
                            </td>
                            <td className="text-right py-2 px-2 text-muted-foreground">
                              {p.count || "—"}
                            </td>
                            <td className="text-right py-2 px-2 text-emerald-400 font-medium">
                              {fmt(p.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Categories ─────────────────────────────────── */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-400" />
                Faturamento por Categoria de Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.category_breakdown.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Sem dados de categorias no período
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.category_breakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          innerRadius={60}
                          paddingAngle={2}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                          fontSize={11}
                        >
                          {data.category_breakdown.map((_, i) => (
                            <Cell
                              key={i}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v: number) => [fmt(v), "Faturamento"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-2 font-medium">
                            Categoria
                          </th>
                          <th className="text-right py-2 px-2 font-medium">
                            Qtd
                          </th>
                          <th className="text-right py-2 px-2 font-medium">
                            Faturamento
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.category_breakdown.map((cat, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50"
                          >
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      COLORS[i % COLORS.length],
                                  }}
                                />
                                <span className="font-medium text-foreground">
                                  {cat.name}
                                </span>
                              </div>
                            </td>
                            <td className="text-right py-2 px-2 text-muted-foreground">
                              {cat.count || "—"}
                            </td>
                            <td className="text-right py-2 px-2 text-emerald-400 font-medium">
                              {fmt(cat.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
