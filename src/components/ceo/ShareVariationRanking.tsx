import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import type { ShareItem } from "@/services/ceoMarketShareService";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  data: ShareItem[];
  isLoading?: boolean;
  title?: string;
  type?: "company" | "unit";
}

export function ShareVariationRanking({ data, isLoading, title = "Variação de Participação", type = "company" }: Props) {
  const sorted = [...data].sort((a, b) => b.share_delta - a.share_delta);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[300px] w-full" /> : sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Sem dados no período</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((item, i) => {
              const isPositive = item.share_delta >= 0;
              return (
                <div key={item.id || i} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.prev_share_percent.toFixed(1)}% → {item.share_percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-muted-foreground">{fmt(item.revenue)}</span>
                    <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {isPositive ? "+" : ""}{item.share_delta.toFixed(1)}pp
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
