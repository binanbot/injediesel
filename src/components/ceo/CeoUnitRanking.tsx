import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Building2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { RankedUnit } from "@/services/ceoRankingService";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
};
const tooltipStyle = { backgroundColor: "hsl(230,15%,8%)", border: "1px solid hsl(230,15%,18%)", borderRadius: "8px" };
const COLORS = ["hsl(160,84%,39%)", "hsl(217,91%,60%)", "hsl(45,93%,47%)", "hsl(339,90%,51%)", "hsl(262,83%,58%)"];

interface Props { data: RankedUnit[]; isLoading?: boolean; }

export function CeoUnitRanking({ data, isLoading }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Top 10 Unidades por Faturamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[300px] w-full" /> : data.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sem dados</p>
          ) : (
            <div style={{ height: Math.max(250, data.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,15%,18%)" />
                  <XAxis type="number" stroke="hsl(230,10%,55%)" fontSize={12} tickFormatter={fmtShort} />
                  <YAxis type="category" dataKey="name" stroke="hsl(230,10%,55%)" fontSize={11} width={130} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), "Faturamento"]} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            Detalhamento por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[300px] w-full" /> : data.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sem dados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-2 font-medium">#</th>
                    <th className="text-left py-2 px-2 font-medium">Unidade</th>
                    <th className="text-right py-2 px-2 font-medium">Faturamento</th>
                    <th className="text-right py-2 px-2 font-medium">Ped.</th>
                    <th className="text-right py-2 px-2 font-medium">Arq.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((u, i) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-2">
                        <p className="font-medium text-foreground">{u.name}</p>
                        {u.city && <p className="text-xs text-muted-foreground">{u.city}/{u.state}</p>}
                      </td>
                      <td className="text-right py-2 px-2 font-medium text-emerald-400">{fmt(u.revenue)}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{u.orders}</td>
                      <td className="text-right py-2 px-2 text-muted-foreground">{u.files}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
