import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalProgress } from "@/services/ceoGoalsService";
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

interface Props {
  goals: GoalProgress[];
  isLoading?: boolean;
}

export function CriticalGoalsPanel({ goals, isLoading }: Props) {
  const critical = goals.filter((g) => g.status === "crítica" || g.status === "em risco")
    .sort((a, b) => a.progress_percent - b.progress_percent);

  if (isLoading) {
    return <Card><CardContent className="pt-6"><div className="animate-pulse h-[150px] bg-muted rounded" /></CardContent></Card>;
  }

  if (critical.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-emerald-400" />
            Metas Críticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">Nenhuma meta em situação crítica — tudo saudável! 🎯</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          Metas Críticas ({critical.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {critical.map((g) => (
          <div key={g.id} className="p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {getMetricLabel(g.metric_key)}
                {g.company_name && <span className="text-muted-foreground ml-1">— {g.company_name}</span>}
              </span>
              <Badge variant="outline" className={cn("text-xs", statusColors[g.status])}>
                {g.status}
              </Badge>
            </div>
            <Progress value={Math.min(g.progress_percent, 100)} className={cn("h-2 mb-1", progressColors[g.status])} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{g.objective_label}</span>
              <span className="text-xs font-mono text-muted-foreground">{g.progress_percent.toFixed(0)}% do alvo</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
