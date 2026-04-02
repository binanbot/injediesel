import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Award,
  ThumbsDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  getGoalsWithProgress,
  buildOkrObjectives,
  deriveGoalsSummary,
  deriveGoalInsights,
} from "@/services/ceoGoalsService";
import { CeoKpiCard } from "@/components/ceo/CeoKpiCard";
import { OkrProgressGrid } from "@/components/ceo/OkrProgressGrid";
import { CriticalGoalsPanel } from "@/components/ceo/CriticalGoalsPanel";
import { GoalInsightsPanel } from "@/components/ceo/GoalInsightsPanel";
import { useCeoFilters } from "@/contexts/CeoFiltersContext";

export default function MetasOkrs() {
  const { filters } = useCeoFilters();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["ceo-goals-progress", filters],
    queryFn: () => getGoalsWithProgress(filters),
  });

  const objectives = useMemo(() => buildOkrObjectives(goals), [goals]);
  const summary = useMemo(() => deriveGoalsSummary(goals), [goals]);
  const insights = useMemo(() => deriveGoalInsights(goals), [goals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-emerald-400" />
          Metas & OKRs
        </h1>
        <p className="text-muted-foreground">
          Acompanhamento de metas executivas e resultados-chave do grupo
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-7 w-32" /></CardContent></Card>
          ))
        ) : (
          <>
            <CeoKpiCard title="Metas Atingidas" value={`${summary.achieved}/${summary.total}`} icon={CheckCircle2} accent="text-emerald-400" subtitle={summary.total > 0 ? `${((summary.achieved / summary.total) * 100).toFixed(0)}%` : "—"} />
            <CeoKpiCard title="Em Risco" value={String(summary.at_risk)} icon={AlertTriangle} accent={summary.at_risk > 0 ? "text-amber-400" : "text-emerald-400"} subtitle="metas monitoradas" />
            <CeoKpiCard title="Críticas" value={String(summary.critical)} icon={XCircle} accent={summary.critical > 0 ? "text-rose-400" : "text-emerald-400"} subtitle="requerem atenção" />
            <CeoKpiCard title="Progresso Médio" value={`${summary.avg_progress.toFixed(0)}%`} icon={TrendingUp} accent={summary.avg_progress >= 80 ? "text-emerald-400" : summary.avg_progress >= 50 ? "text-amber-400" : "text-rose-400"} subtitle="do grupo" />
            {summary.best_company && (
              <CeoKpiCard title="Melhor Aderência" value={summary.best_company} icon={Award} accent="text-emerald-400" subtitle="empresa destaque" />
            )}
            {summary.worst_company && summary.worst_company !== summary.best_company && (
              <CeoKpiCard title="Menor Aderência" value={summary.worst_company} icon={ThumbsDown} accent="text-rose-400" subtitle="precisa de atenção" />
            )}
          </>
        )}
      </div>

      <GoalInsightsPanel insights={insights} />
      <OkrProgressGrid objectives={objectives} isLoading={isLoading} />
      <CriticalGoalsPanel goals={goals} isLoading={isLoading} />
    </div>
  );
}
