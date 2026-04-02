import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrowthInsight } from "@/services/ceoGrowthService";

const iconMap: Record<GrowthInsight["type"], LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: TrendingDown,
};

const colorMap: Record<GrowthInsight["type"], string> = {
  success: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  warning: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  danger: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

interface Props {
  insights: GrowthInsight[];
}

export function GrowthInsightsPanel({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          Insights de Crescimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.type];
          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                colorMap[insight.type]
              )}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{insight.title}</p>
                  {insight.metric && (
                    <span className="text-xs font-mono shrink-0">{insight.metric}</span>
                  )}
                </div>
                <p className="text-xs opacity-80 mt-0.5">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
