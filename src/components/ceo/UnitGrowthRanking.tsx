import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnitGrowthItem } from "@/services/ceoGrowthService";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
};

interface Props {
  data: UnitGrowthItem[];
  isLoading?: boolean;
  title?: string;
  /** How many to show, defaults to 15 */
  limit?: number;
}

export function UnitGrowthRanking({ data, isLoading, title = "Ranking de Unidades", limit = 15 }: Props) {
  const display = data.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : display.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-muted-foreground">Sem dados de unidades no período</p>
            <p className="text-xs text-muted-foreground/60">O ranking será preenchido conforme houver atividade nas unidades.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-2 text-xs text-muted-foreground font-medium pb-2 border-b border-border/50">
              <span>#</span>
              <span>Unidade</span>
              <span className="text-right w-20">Receita</span>
              <span className="text-right w-20">Anterior</span>
              <span className="text-right w-16">Cresc.</span>
            </div>
            {display.map((u, i) => (
              <div key={u.id} className="grid grid-cols-[2rem_1fr_auto_auto_auto] gap-2 items-center py-2 border-b border-border/30 text-sm">
                <span className="text-xs text-muted-foreground">{i + 1}.</span>
                <div className="min-w-0">
                  <span className="font-medium truncate block">{u.name}</span>
                  {(u.city || u.state) && (
                    <span className="text-xs text-muted-foreground">{[u.city, u.state].filter(Boolean).join(", ")}</span>
                  )}
                </div>
                <span className="text-right w-20 font-medium text-emerald-400">{fmtShort(u.revenue)}</span>
                <span className="text-right w-20 text-muted-foreground">{fmtShort(u.prev_revenue)}</span>
                <span className={cn(
                  "text-right w-16 font-medium flex items-center justify-end gap-0.5",
                  u.growth_percent >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {u.growth_percent >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(u.growth_percent).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
