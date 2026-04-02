import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OkrObjective } from "@/services/ceoGoalsService";
import { getMetricLabel } from "@/services/ceoGoalsService";

const statusColors: Record<string, string> = {
  atingida: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30",
  saudável: "bg-blue-400/20 text-blue-400 border-blue-400/30",
  "em risco": "bg-amber-400/20 text-amber-400 border-amber-400/30",
  crítica: "bg-rose-400/20 text-rose-400 border-rose-400/30",
};

const progressColors: Record<string, string> = {
  atingida: "[&>div]:bg-emerald-400",
  saudável: "[&>div]:bg-blue-400",
  "em risco": "[&>div]:bg-amber-400",
  crítica: "[&>div]:bg-rose-400",
};

const fmt = (v: number, key: string) => {
  if (key === "revenue" || key === "cost") return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (key.includes("percent") || key.includes("rate")) return `${v.toFixed(1)}%`;
  return v.toLocaleString("pt-BR");
};

interface Props {
  objectives: OkrObjective[];
  isLoading?: boolean;
}

export function OkrProgressGrid({ objectives, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><div className="animate-pulse h-[200px] bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (objectives.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum objetivo com metas ativas no período</p>
          <p className="text-xs text-muted-foreground mt-1">Cadastre metas executivas para acompanhar OKRs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {objectives.map((obj) => (
        <Card key={obj.label}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                {obj.label}
              </CardTitle>
              <Badge variant="outline" className={cn("text-xs", statusColors[obj.status])}>
                {obj.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={Math.min(obj.avg_progress, 100)} className={cn("h-2 flex-1", progressColors[obj.status])} />
              <span className="text-xs font-mono text-muted-foreground w-12 text-right">{obj.avg_progress.toFixed(0)}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {obj.results.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">
                      {getMetricLabel(r.metric_key)}
                      {r.company_name && <span className="text-muted-foreground ml-1">({r.company_name})</span>}
                    </span>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusColors[r.status])}>
                      {r.status}
                    </Badge>
                  </div>
                  <Progress value={Math.min(r.progress_percent, 100)} className={cn("h-1.5", progressColors[r.status])} />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {fmt(r.actual_value, r.metric_key)} / {fmt(r.target_value, r.metric_key)}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{r.progress_percent.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
