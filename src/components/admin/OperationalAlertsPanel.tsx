/**
 * OperationalAlertsPanel — Displays consolidated operational alerts
 * Used in /admin dashboards, CRM, and financial pages
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllOperationalAlerts,
  calcAlertSummary,
  type OperationalAlert,
} from "@/services/operationalAlertsService";

interface OperationalAlertsPanelProps {
  companyId: string;
  maxAlerts?: number;
  showSummary?: boolean;
  filterCategory?: string;
}

const severityConfig = {
  danger: { icon: AlertTriangle, color: "text-destructive", border: "border-l-destructive", badge: "destructive" as const },
  warning: { icon: AlertTriangle, color: "text-amber-500", border: "border-l-amber-500", badge: "warning" as const },
  info: { icon: Info, color: "text-blue-400", border: "border-l-blue-400", badge: "secondary" as const },
};

const categoryLabels: Record<string, string> = {
  crm: "CRM",
  financeiro: "Financeiro",
  comercial: "Comercial",
  operacional: "Operacional",
};

export function OperationalAlertsPanel({
  companyId,
  maxAlerts = 10,
  showSummary = true,
  filterCategory,
}: OperationalAlertsPanelProps) {
  const navigate = useNavigate();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["operational-alerts", companyId],
    queryFn: () => fetchAllOperationalAlerts(companyId),
    enabled: !!companyId,
    staleTime: 60_000, // 1 min cache
  });

  const filtered = filterCategory
    ? alerts.filter((a) => a.category === filterCategory)
    : alerts;

  const displayed = filtered.slice(0, maxAlerts);
  const summary = calcAlertSummary(alerts);

  if (isLoading) return null;
  if (alerts.length === 0) {
    return (
      <Card className="border-emerald-500/30">
        <CardContent className="pt-4 pb-3 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <p className="text-sm text-muted-foreground">
            Nenhum alerta operacional no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {showSummary && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Bell className="h-4 w-4" />
            <span>{summary.total} alerta(s)</span>
          </div>
          {summary.danger > 0 && (
            <Badge variant="destructive" className="text-xs">
              {summary.danger} crítico(s)
            </Badge>
          )}
          {summary.warning > 0 && (
            <Badge variant="warning" className="text-xs">
              {summary.warning} atenção
            </Badge>
          )}
          {summary.info > 0 && (
            <Badge variant="secondary" className="text-xs">
              {summary.info} informativo(s)
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayed.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <Card
              key={alert.id}
              className={`border-l-4 ${config.border}`}
            >
              <CardContent className="pt-4 pb-3 flex items-start gap-3">
                <Icon className={`h-5 w-5 ${config.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {categoryLabels[alert.category] || alert.category}
                    </Badge>
                    {alert.count && (
                      <span className="text-xs text-muted-foreground">
                        ({alert.count})
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                  {alert.actionRoute && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-1 text-xs"
                      onClick={() => navigate(alert.actionRoute!)}
                    >
                      {alert.actionLabel || "Ver detalhes"} →
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length > maxAlerts && (
        <p className="text-xs text-muted-foreground text-center">
          + {filtered.length - maxAlerts} alerta(s) adicionais
        </p>
      )}
    </div>
  );
}
