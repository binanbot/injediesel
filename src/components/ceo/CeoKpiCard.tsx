import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function VariationBadge({
  value,
  invertColor = false,
}: {
  value: number;
  invertColor?: boolean;
}) {
  const isPositive = value >= 0;
  const color = invertColor
    ? isPositive
      ? "text-rose-400"
      : "text-emerald-400"
    : isPositive
    ? "text-emerald-400"
    : "text-rose-400";
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

interface CeoKpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  variation?: number | null;
  invertColor?: boolean;
  subtitle?: string;
}

export function CeoKpiCard({
  title,
  value,
  icon: Icon,
  accent,
  variation,
  invertColor = false,
  subtitle,
}: CeoKpiCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${accent}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {variation !== undefined && variation !== null && (
            <VariationBadge value={variation} invertColor={invertColor} />
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {variation !== undefined && variation !== null && (
            <span className="text-xs text-muted-foreground">vs anterior</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
