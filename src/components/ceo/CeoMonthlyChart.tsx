import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthlyEvolution } from "@/services/ceoDashboardService";

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

const LABEL_MAP: Record<string, string> = {
  revenue: "Faturamento",
  cost: "Custo",
  margin: "Margem",
};

interface CeoMonthlyChartProps {
  data: MonthlyEvolution[];
  isLoading?: boolean;
  title?: string;
  showCost?: boolean;
}

export function CeoMonthlyChart({
  data,
  isLoading,
  title = "Evolução Mensal",
  showCost = true,
}: CeoMonthlyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Sem dados no período
          </p>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
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
                  tickFormatter={fmtShort}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [
                    fmt(v),
                    LABEL_MAP[name] || name,
                  ]}
                />
                <Legend
                  formatter={(value: string) => LABEL_MAP[value] || value}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(160,84%,39%)"
                  fill="hsl(160,84%,39%)"
                  fillOpacity={0.15}
                  name="revenue"
                />
                {showCost && (
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="hsl(339,90%,51%)"
                    fill="hsl(339,90%,51%)"
                    fillOpacity={0.1}
                    name="cost"
                  />
                )}
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
  );
}
