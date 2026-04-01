import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
} from "recharts";
import { getMonthlyStoreSales } from "@/services/monthlySalesService";

type Props = {
  dateRange: { from: Date; to: Date };
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const tooltipStyle = {
  backgroundColor: "hsl(230, 15%, 8%)",
  border: "1px solid hsl(230, 15%, 18%)",
  borderRadius: "8px",
};

export default function MonthlySalesChart({ dateRange }: Props) {
  const { data: monthly = [], isLoading } = useQuery({
    queryKey: ["monthly-sales", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () =>
      getMonthlyStoreSales({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5 animate-pulse" />
            <span>Carregando gráfico de vendas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Vendas Mensais — Loja Promax
        </CardTitle>
      </CardHeader>
      <CardContent>
        {monthly.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado encontrado no período selecionado.
          </p>
        ) : (
          <>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                  <XAxis dataKey="label" stroke="hsl(230, 10%, 55%)" fontSize={12} />
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(230, 10%, 55%)"
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    fontSize={12}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(230, 10%, 55%)"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => {
                      if (name === "revenue") return [fmt(value), "Faturamento"];
                      return [value, "Pedidos"];
                    }}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill="hsl(217, 91%, 60%)"
                    radius={[4, 4, 0, 0]}
                    name="revenue"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="orders"
                    fill="hsl(142, 76%, 36%)"
                    radius={[4, 4, 0, 0]}
                    name="orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Faturamento (R$)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">Pedidos</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
