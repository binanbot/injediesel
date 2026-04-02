import { format } from "date-fns";
import { CalendarIcon, Building2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCeoFilters, type PeriodPreset } from "@/contexts/CeoFiltersContext";

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "mes", label: "Mês atual" },
  { value: "trimestre", label: "Trimestre" },
  { value: "semestre", label: "Semestre" },
  { value: "ano", label: "Ano" },
  { value: "personalizado", label: "Personalizado" },
];

export function CeoGlobalFilterBar() {
  const { dateRange, setDateRange, companyId, setCompanyId, preset, setPreset } = useCeoFilters();

  const { data: companies = [] } = useQuery({
    queryKey: ["ceo-companies-filter"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 lg:px-6 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm">
      {/* Period presets */}
      <div className="flex items-center gap-1">
        {PRESETS.filter(p => p.value !== "personalizado").map((p) => (
          <Button
            key={p.value}
            variant="ghost"
            size="sm"
            onClick={() => setPreset(p.value)}
            className={cn(
              "h-7 px-2.5 text-xs rounded-lg transition-all",
              preset === p.value
                ? "bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Date range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 gap-1.5 text-xs",
              preset === "personalizado" && "border-emerald-400/30 text-emerald-400"
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {format(dateRange.from, "dd/MM/yy")} — {format(dateRange.to, "dd/MM/yy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to });
            }}
            numberOfMonths={2}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Company filter */}
      {companies.length > 1 && (
        <div className="flex items-center gap-1">
          <Select
            value={companyId || "__all__"}
            onValueChange={(v) => setCompanyId(v === "__all__" ? null : v)}
          >
            <SelectTrigger className="h-7 w-[180px] text-xs">
              <Building2 className="h-3 w-3 mr-1 shrink-0" />
              <SelectValue placeholder="Todas as empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as empresas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {companyId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setCompanyId(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
