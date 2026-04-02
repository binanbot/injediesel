import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ExecutiveEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
}

export function ExecutiveEmptyState({
  icon: Icon = Inbox,
  title = "Sem dados no período",
  description = "Ajuste os filtros ou aguarde novos registros.",
}: ExecutiveEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
