import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CompanyComparison } from "@/services/ceoDashboardService";

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
];

interface Props {
  comparisons: CompanyComparison[];
  isLoading?: boolean;
}

export function CeoRevenueByCompanyChart({ comparisons, isLoading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          Faturamento por Empresa
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : comparisons.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Sem dados no período
          </p>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisons} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(230,15%,18%)"
                />
                <XAxis
                  type="number"
                  stroke="hsl(230,10%,55%)"
                  fontSize={12}
                  tickFormatter={fmtShort}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(230,10%,55%)"
                  fontSize={12}
                  width={120}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [fmt(v), "Faturamento"]}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {comparisons.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
