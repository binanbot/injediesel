import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2, MapPin, Users, Car, FileDown, Wrench,
  ShoppingBag, Headphones, AlertTriangle, CheckCircle2,
  Info, CalendarIcon, Filter, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getMasterKPIs,
  getCompanySummaries,
  deriveAlerts,
  type MasterKPIs,
  type CompanySummary,
  type OperationalAlert,
} from "@/services/masterDashboardService";

// ─── KPI Card ────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, accent = "amber", loading }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: "amber" | "emerald" | "sky" | "rose" | "violet";
  loading?: boolean;
}) {
  const accentMap = {
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    sky: "text-sky-400",
    rose: "text-rose-400",
    violet: "text-violet-400",
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card hover:border-amber-400/20 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={cn("h-4 w-4", accentMap[accent])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

// ─── Alert Item ──────────────────────────────────────────
function AlertItem({ alert }: { alert: OperationalAlert }) {
  const config = {
    danger: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-400/10 border-rose-400/20" },
    warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
    info: { icon: Info, color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20" },
  }[alert.type];

  const Icon = alert.type === "info" && alert.title === "Tudo em ordem" ? CheckCircle2 : config.icon;

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg border", config.bg)}>
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{alert.title}</span>
          {alert.count && (
            <Badge variant="outline" className="text-xs">{alert.count}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
      </div>
    </div>
  );
}

// ─── Company Row ─────────────────────────────────────────
function CompanyRow({ company }: { company: CompanySummary }) {
  const health = company.files_pending > 5 || company.open_tickets > 3
    ? "warning"
    : "healthy";

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl glass-card hover:border-amber-400/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-foreground truncate">{company.brand_name || company.name}</span>
          <Badge variant={health === "healthy" ? "outline" : "destructive"} className="text-xs shrink-0">
            {health === "healthy" ? "Saudável" : "Atenção"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{company.slug}</p>
      </div>

      <div className="hidden md:grid grid-cols-6 gap-4 text-center">
        <Metric icon={MapPin} value={company.units_count} label="Unidades" />
        <Metric icon={Users} value={company.customers_count} label="Clientes" />
        <Metric icon={FileDown} value={company.files_count} label="Arquivos" />
        <Metric icon={Wrench} value={company.services_count} label="Serviços" />
        <Metric icon={ShoppingBag} value={company.orders_count} label="Pedidos" />
        <Metric icon={Headphones} value={company.open_tickets} label="Tickets" accent={company.open_tickets > 0 ? "rose" : undefined} />
      </div>

      {/* Mobile: compact stats */}
      <div className="md:hidden flex items-center gap-3 text-xs text-muted-foreground">
        <span>{company.units_count} un.</span>
        <span>{company.customers_count} cli.</span>
        <span>{company.files_count} arq.</span>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, value, label, accent }: {
  icon: React.ElementType;
  value: number;
  label: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className={cn("h-3.5 w-3.5", accent || "text-muted-foreground")} />
      <span className={cn("text-sm font-semibold", accent || "text-foreground")}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────
export default function MasterDashboard() {
  const defaultStart = startOfMonth(subMonths(new Date(), 2));
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const filters = {
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
  };

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["master-kpis", filters],
    queryFn: () => getMasterKPIs(filters),
  });

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["master-companies", filters],
    queryFn: () => getCompanySummaries(filters),
  });

  const alerts = companies ? deriveAlerts(companies) : [];

  const clearFilters = () => {
    setStartDate(defaultStart);
    setEndDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-amber-400" />
            Painel Master
          </h1>
          <p className="text-muted-foreground text-sm">Visão consolidada do ecossistema</p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <CalendarIcon className="h-3.5 w-3.5" />
                {startDate ? format(startDate, "dd/MM/yy") : "Início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground text-xs">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <CalendarIcon className="h-3.5 w-3.5" />
                {endDate ? format(endDate, "dd/MM/yy") : "Fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
            <Filter className="h-3.5 w-3.5" />
            Limpar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Building2} label="Empresas Ativas" value={kpis?.companies_active ?? 0} accent="amber" loading={kpisLoading} />
        <KPICard icon={MapPin} label="Unidades" value={kpis?.total_units ?? 0} accent="sky" loading={kpisLoading} />
        <KPICard icon={Users} label="Clientes" value={kpis?.total_customers ?? 0} accent="emerald" loading={kpisLoading} />
        <KPICard icon={Car} label="Veículos" value={kpis?.total_vehicles ?? 0} accent="violet" loading={kpisLoading} />
        <KPICard icon={FileDown} label="Arquivos ECU" value={kpis?.total_files ?? 0} accent="sky" loading={kpisLoading} />
        <KPICard icon={Wrench} label="Serviços" value={kpis?.total_services ?? 0} accent="emerald" loading={kpisLoading} />
        <KPICard icon={ShoppingBag} label="Pedidos Loja" value={kpis?.total_orders ?? 0} accent="amber" loading={kpisLoading} />
        <KPICard icon={Headphones} label="Tickets Abertos" value={kpis?.total_open_tickets ?? 0} accent="rose" loading={kpisLoading} />
      </div>

      {/* Two-column: Alerts + Company List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Alertas Operacionais
          </h2>
          {companiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <AlertItem key={i} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* Company List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-400" />
            Empresas do Grupo
          </h2>
          {companiesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : companies && companies.length > 0 ? (
            <div className="space-y-3">
              {companies.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
