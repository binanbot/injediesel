import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Target,
  CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Award,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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

export default function MetasOkrs() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const filters = useMemo(
    () => ({
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
    }),
    [dateRange]
  );

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["ceo-goals-progress", filters],
    queryFn: () => getGoalsWithProgress(filters),
  });

  const objectives = useMemo(() => buildOkrObjectives(goals), [goals]);
  const summary = useMemo(() => deriveGoalsSummary(goals), [goals]);
  const insights = useMemo(() => deriveGoalInsights(goals), [goals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-emerald-400" />
            Metas & OKRs
          </h1>
          <p className="text-muted-foreground">
            Acompanhamento de metas executivas e resultados-chave do grupo
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-fit">
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.from, "dd/MM/yy")} — {format(dateRange.to, "dd/MM/yy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to)
                  setDateRange({ from: range.from, to: range.to });
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <CeoKpiCard
              title="Metas Atingidas"
              value={`${summary.achieved}/${summary.total}`}
              icon={CheckCircle2}
              accent="text-emerald-400"
              subtitle={summary.total > 0 ? `${((summary.achieved / summary.total) * 100).toFixed(0)}%` : "—"}
            />
            <CeoKpiCard
              title="Em Risco"
              value={String(summary.at_risk)}
              icon={AlertTriangle}
              accent={summary.at_risk > 0 ? "text-amber-400" : "text-emerald-400"}
              subtitle="metas monitoradas"
            />
            <CeoKpiCard
              title="Críticas"
              value={String(summary.critical)}
              icon={XCircle}
              accent={summary.critical > 0 ? "text-rose-400" : "text-emerald-400"}
              subtitle="requerem atenção"
            />
            <CeoKpiCard
              title="Progresso Médio"
              value={`${summary.avg_progress.toFixed(0)}%`}
              icon={TrendingUp}
              accent={summary.avg_progress >= 80 ? "text-emerald-400" : summary.avg_progress >= 50 ? "text-amber-400" : "text-rose-400"}
              subtitle="do grupo"
            />
            {summary.best_company && (
              <CeoKpiCard
                title="Melhor Aderência"
                value={summary.best_company}
                icon={Award}
                accent="text-emerald-400"
                subtitle="empresa destaque"
              />
            )}
            {summary.worst_company && summary.worst_company !== summary.best_company && (
              <CeoKpiCard
                title="Menor Aderência"
                value={summary.worst_company}
                icon={ThumbsDown}
                accent="text-rose-400"
                subtitle="precisa de atenção"
              />
            )}
          </>
        )}
      </div>

      {/* Insights */}
      <GoalInsightsPanel insights={insights} />

      {/* OKR Grid */}
      <OkrProgressGrid objectives={objectives} isLoading={isLoading} />

      {/* Critical Goals */}
      <CriticalGoalsPanel goals={goals} isLoading={isLoading} />
    </div>
  );
}
