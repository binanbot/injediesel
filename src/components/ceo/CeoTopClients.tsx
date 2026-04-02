import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { RankedItem } from "@/services/ceoRankingService";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
};
const tooltipStyle = { backgroundColor: "hsl(230,15%,8%)", border: "1px solid hsl(230,15%,18%)", borderRadius: "8px" };
const COLORS = ["hsl(160,84%,39%)", "hsl(217,91%,60%)", "hsl(45,93%,47%)", "hsl(339,90%,51%)", "hsl(262,83%,58%)"];

interface Props { data: RankedItem[]; isLoading?: boolean; title?: string; }

export function CeoTopClients({ data, isLoading, title = "Top 10 Clientes por Faturamento" }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="h-5 w-5 text-emerald-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[300px] w-full" /> : data.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-muted-foreground">Sem dados de clientes no período</p>
            <p className="text-xs text-muted-foreground/60">O ranking será preenchido conforme os arquivos forem vinculados a clientes cadastrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div style={{ height: Math.max(250, data.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                  <XAxis type="number" stroke="hsl(230,10%,55%)" fontSize={12} tickFormatter={fmtShort} />
                  <YAxis type="category" dataKey="name" stroke="hsl(230,10%,55%)" fontSize={11} width={140} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), "Faturamento"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-emerald-400">{fmt(item.value)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({item.count} arq.)</span>
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
