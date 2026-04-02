import type { LucideIcon } from "lucide-react";

interface ExecutivePageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function ExecutivePageHeader({ icon: Icon, title, subtitle }: ExecutivePageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Icon className="h-6 w-6 text-emerald-400" />
        {title}
      </h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}
