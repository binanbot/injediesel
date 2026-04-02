import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { RankedItem } from "@/services/ceoRankingService";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const COLORS = [
  "hsl(160,84%,39%)", "hsl(217,91%,60%)", "hsl(45,93%,47%)",
  "hsl(339,90%,51%)", "hsl(262,83%,58%)", "hsl(30,90%,50%)",
  "hsl(180,70%,45%)", "hsl(0,70%,55%)",
];
const tooltipStyle = { backgroundColor: "hsl(230,15%,8%)", border: "1px solid hsl(230,15%,18%)", borderRadius: "8px" };

interface Props { data: RankedItem[]; isLoading?: boolean; title?: string; }

export function CeoCategoryBreakdown({ data, isLoading, title = "Faturamento por Categoria (ECU)" }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[300px] w-full" /> : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Sem dados de categorias no período</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    strokeWidth={2}
                    stroke="hsl(230,15%,8%)"
                  >
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [fmt(v), "Faturamento"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.map((item, i) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-emerald-400">{fmt(item.value)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
