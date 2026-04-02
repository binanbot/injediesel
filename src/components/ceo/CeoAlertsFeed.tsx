import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { ExecutiveAlert } from "@/services/ceoDashboardService";

interface CeoAlertsFeedProps {
  alerts: ExecutiveAlert[];
}

export function CeoAlertsFeed({ alerts }: CeoAlertsFeedProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {alerts.map((alert, i) => (
        <Card
          key={i}
          className={`border-l-4 ${
            alert.type === "danger"
              ? "border-l-destructive"
              : alert.type === "warning"
              ? "border-l-amber-500"
              : "border-l-emerald-500"
          }`}
        >
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            {alert.type === "danger" ? (
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            ) : alert.type === "warning" ? (
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {alert.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {alert.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
