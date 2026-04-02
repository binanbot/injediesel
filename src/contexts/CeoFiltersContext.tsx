import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { getPresetRange, type PeriodPreset } from "@/utils/periodUtils";

export type { PeriodPreset } from "@/utils/periodUtils";

export interface CeoFilters {
  startDate: string;
  endDate: string;
  companyId: string | null;
  preset: PeriodPreset;
}

export interface CeoDateRange {
  from: Date;
  to: Date;
}

interface CeoFiltersContextValue {
  dateRange: CeoDateRange;
  setDateRange: (range: CeoDateRange) => void;
  companyId: string | null;
  setCompanyId: (id: string | null) => void;
  preset: PeriodPreset;
  setPreset: (p: PeriodPreset) => void;
  filters: { startDate: string; endDate: string; companyId?: string };
}

// ── Helpers ────────────────────────────────────────────────

export function getPresetRange(preset: PeriodPreset): CeoDateRange {
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

// ── Context ────────────────────────────────────────────────

const CeoFiltersContext = createContext<CeoFiltersContextValue | null>(null);

export function CeoFiltersProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL or defaults
  const initialPreset = (searchParams.get("preset") as PeriodPreset) || "semestre";
  const initialRange = (() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      return { from: new Date(from), to: new Date(to) };
    }
    return getPresetRange(initialPreset);
  })();
  const initialCompany = searchParams.get("empresa") || null;

  const [dateRange, setDateRangeState] = useState<CeoDateRange>(initialRange);
  const [companyId, setCompanyIdState] = useState<string | null>(initialCompany);
  const [preset, setPresetState] = useState<PeriodPreset>(initialPreset);

  const syncParams = useCallback(
    (range: CeoDateRange, company: string | null, p: PeriodPreset) => {
      const params = new URLSearchParams();
      params.set("from", format(range.from, "yyyy-MM-dd"));
      params.set("to", format(range.to, "yyyy-MM-dd"));
      params.set("preset", p);
      if (company) params.set("empresa", company);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const setDateRange = useCallback(
    (range: CeoDateRange) => {
      setDateRangeState(range);
      syncParams(range, companyId, "personalizado");
      setPresetState("personalizado");
    },
    [companyId, syncParams]
  );

  const setCompanyId = useCallback(
    (id: string | null) => {
      setCompanyIdState(id);
      syncParams(dateRange, id, preset);
    },
    [dateRange, preset, syncParams]
  );

  const setPreset = useCallback(
    (p: PeriodPreset) => {
      setPresetState(p);
      const range = getPresetRange(p);
      setDateRangeState(range);
      syncParams(range, companyId, p);
    },
    [companyId, syncParams]
  );

  const filters = useMemo(
    () => ({
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
      ...(companyId ? { companyId } : {}),
    }),
    [dateRange, companyId]
  );

  return (
    <CeoFiltersContext.Provider
      value={{ dateRange, setDateRange, companyId, setCompanyId, preset, setPreset, filters }}
    >
      {children}
    </CeoFiltersContext.Provider>
  );
}

export function useCeoFilters() {
  const ctx = useContext(CeoFiltersContext);
  if (!ctx) throw new Error("useCeoFilters must be used within CeoFiltersProvider");
  return ctx;
}
