import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { MarketShareKPIs } from "@/services/ceoMarketShareService";

const levelColors: Record<string, string> = {
  baixa: "text-emerald-400",
  moderada: "text-amber-400",
  alta: "text-orange-400",
  "muito alta": "text-rose-400",
};

const levelLabels: Record<string, string> = {
  baixa: "Baixa",
  moderada: "Moderada",
  alta: "Alta",
  "muito alta": "Muito Alta",
};

interface Props {
  kpis: MarketShareKPIs | null;
  isLoading?: boolean;
}

export function ConcentrationCard({ kpis, isLoading }: Props) {
  if (isLoading || !kpis) {
    return (
      <Card>
        <CardContent className="pt-6"><Skeleton className="h-[200px] w-full" /></CardContent>
      </Card>
    );
  }

  const metrics = [
    { label: "Líder do grupo", value: `${kpis.leader_name} (${kpis.leader_share.toFixed(1)}%)`, progress: kpis.leader_share },
    { label: "Top 3 empresas", value: `${kpis.top3_share.toFixed(1)}%`, progress: kpis.top3_share },
    { label: "Top 10 unidades", value: `${kpis.top10_units_share.toFixed(1)}%`, progress: kpis.top10_units_share },
    { label: "Diversificação", value: `${kpis.diversification_percent.toFixed(1)}%`, progress: kpis.diversification_percent },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-400" />
          Índice de Concentração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Índice HHI</p>
            <p className="text-2xl font-bold text-foreground">{kpis.hhi.toLocaleString("pt-BR")}</p>
          </div>
          <div className={`text-right ${levelColors[kpis.concentration_level]}`}>
            <p className="text-sm font-medium">Concentração</p>
            <p className="text-lg font-bold">{levelLabels[kpis.concentration_level]}</p>
          </div>
        </div>

        <div className="space-y-4">
          {metrics.map((m, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className="text-xs font-medium text-foreground">{m.value}</span>
              </div>
              <Progress value={m.progress} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
