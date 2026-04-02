import { subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";

export type PeriodPreset = "mes" | "trimestre" | "semestre" | "ano" | "personalizado";

export interface DateRange {
  from: Date;
  to: Date;
}

export function getPresetRange(preset: PeriodPreset): DateRange {
  const now = new Date();
  switch (preset) {
    case "mes":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "trimestre":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "semestre":
      return { from: subMonths(now, 6), to: now };
    case "ano":
      return { from: startOfYear(now), to: endOfYear(now) };
    default:
      return { from: subMonths(now, 6), to: now };
  }
}

export function getPreviousPeriod(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);
  return {
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  };
}

export function calcVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
