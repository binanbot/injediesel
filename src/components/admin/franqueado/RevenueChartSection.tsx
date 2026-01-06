import { useState, useEffect } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, DollarSign, PieChart as PieChartIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface RevenueData {
  month: string;
  revenue: number;
  services: number;
}

interface ServiceTypeData {
  name: string;
  value: number;
  color: string;
}

interface RevenueChartSectionProps {
  unitId: string | null;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function RevenueChartSection({ unitId }: RevenueChartSectionProps) {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<ServiceTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalRevenue: 0,
    totalServices: 0,
    averageTicket: 0,
  });

  useEffect(() => {
    loadData();
  }, [unitId]);

  const loadData = async () => {
    if (!unitId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Load services from last 6 months
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      
      const { data: services, error } = await supabase
        .from("services")
        .select("*")
        .eq("unit_id", unitId)
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Process monthly revenue
      const monthlyMap = new Map<string, { revenue: number; services: number }>();
      const serviceTypes = new Map<string, number>();

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const key = format(date, "MMM/yy", { locale: ptBR });
        monthlyMap.set(key, { revenue: 0, services: 0 });
      }

      (services || []).forEach((service) => {
        const date = new Date(service.created_at);
        const monthKey = format(date, "MMM/yy", { locale: ptBR });
        
        const current = monthlyMap.get(monthKey) || { revenue: 0, services: 0 };
        monthlyMap.set(monthKey, {
          revenue: current.revenue + (service.amount_brl || 0),
          services: current.services + 1,
        });

        // Count service types
        const type = service.service_type || "Outros";
        serviceTypes.set(type, (serviceTypes.get(type) || 0) + 1);
      });

      const revenueArray: RevenueData[] = [];
      monthlyMap.forEach((value, key) => {
        revenueArray.push({
          month: key,
          revenue: value.revenue,
          services: value.services,
        });
      });

      const serviceTypeArray: ServiceTypeData[] = [];
      let colorIndex = 0;
      serviceTypes.forEach((value, key) => {
        serviceTypeArray.push({
          name: key,
          value,
          color: COLORS[colorIndex % COLORS.length],
        });
        colorIndex++;
      });

      // Sort by value descending
      serviceTypeArray.sort((a, b) => b.value - a.value);

      // Calculate totals
      const totalRevenue = revenueArray.reduce((acc, r) => acc + r.revenue, 0);
      const totalServices = revenueArray.reduce((acc, r) => acc + r.services, 0);

      setRevenueData(revenueArray);
      setServiceTypeData(serviceTypeArray);
      setTotals({
        totalRevenue,
        totalServices,
        averageTicket: totalServices > 0 ? totalRevenue / totalServices : 0,
      });
    } catch (error) {
      console.error("Erro ao carregar dados de faturamento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total (6 meses)</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Serviços</p>
                <p className="text-2xl font-bold">{totals.totalServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <PieChartIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.averageTicket)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Faturamento Mensal</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 || totals.totalRevenue === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Sem dados de faturamento
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Service Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Serviços</CardTitle>
            <CardDescription>Distribuição por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceTypeData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Sem dados de serviços
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} serviços`, ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
