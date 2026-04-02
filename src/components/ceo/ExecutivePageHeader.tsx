import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ExecutivePageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function ExecutivePageHeader({ icon: Icon, title, subtitle, actions }: ExecutivePageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Icon className="h-6 w-6 text-emerald-400" />
          {title}
        </h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
