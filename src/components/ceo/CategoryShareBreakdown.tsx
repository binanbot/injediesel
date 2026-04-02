import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { CategoryShare } from "@/services/ceoMarketShareService";

const COLORS = [
  "hsl(160,84%,39%)", "hsl(217,91%,60%)", "hsl(45,93%,47%)",
  "hsl(339,90%,51%)", "hsl(262,83%,58%)", "hsl(30,90%,50%)",
];
const tooltipStyle = { backgroundColor: "hsl(230,15%,8%)", border: "1px solid hsl(230,15%,18%)", borderRadius: "8px" };

interface Props {
  data: CategoryShare[];
  isLoading?: boolean;
}

export function CategoryShareBreakdown({ data, isLoading }: Props) {
  const chartData = data.slice(0, 8).map((d) => ({
    name: d.name.length > 15 ? d.name.slice(0, 15) + "…" : d.name,
    fullName: d.name,
    share: Number(d.share_percent.toFixed(1)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-400" />
          Participação por Categoria (ECU)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[350px] w-full" /> : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Sem dados de categorias no período</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11, fill: "hsl(230,10%,55%)" }} unit="%" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "hsl(230,10%,55%)" }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`${v}%`, "Participação"]}
                    labelFormatter={(l) => chartData.find((d) => d.name === l)?.fullName || l}
                  />
                  <Bar dataKey="share" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.map((item, i) => {
                const isPos = item.share_delta >= 0;
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-emerald-400">{item.share_percent.toFixed(1)}%</span>
                      <span className={`text-xs font-medium inline-flex items-center gap-0.5 ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {isPos ? "+" : ""}{item.share_delta.toFixed(1)}pp
                      </span>
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
