import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import type { CompanyGrowthItem } from "@/services/ceoGrowthService";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
};

interface Props {
  data: CompanyGrowthItem[];
  isLoading?: boolean;
}

export function CompanyGrowthRanking({ data, isLoading }: Props) {
  const chartData = data.map((c) => ({
    name: c.name,
    growth: Number(c.growth_percent.toFixed(1)),
    revenue: c.revenue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          Crescimento por Empresa
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Sem dados de empresas no período</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div style={{ height: Math.max(250, data.length * 50) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                  <XAxis type="number" stroke="hsl(230,10%,55%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(230,10%,55%)" fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(230,15%,8%)",
                      border: "1px solid hsl(230,15%,18%)",
                      borderRadius: "8px",
                    }}
                    formatter={(v: number) => [`${v}%`, "Crescimento"]}
                  />
                  <ReferenceLine x={0} stroke="hsl(230,10%,30%)" />
                  <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.growth >= 0 ? "hsl(160,84%,39%)" : "hsl(0,84%,60%)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{fmtShort(item.revenue)}</span>
                    <span className={cn(
                      "text-sm font-medium flex items-center gap-0.5",
                      item.growth_percent >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {item.growth_percent >= 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {Math.abs(item.growth_percent).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
