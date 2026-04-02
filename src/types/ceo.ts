import type { LucideIcon } from "lucide-react";

/** Shared filter shape used across all CEO services */
export interface CeoDateFilters {
  startDate: string;
  endDate: string;
  companyId?: string;
}

/** Generic KPI card props */
export interface CeoKPICardData {
  title: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  variation?: number;
  subtitle?: string;
  invertColor?: boolean;
}

/** Executive alert used across dashboards and reports */
export interface ExecutiveAlertData {
  type: "danger" | "warning" | "info";
  title: string;
  description: string;
  company?: string;
}

/** Generic ranked item for rankings */
export interface RankedItemData {
  name: string;
  value: number;
  count?: number;
  percent?: number;
  delta?: number;
}
