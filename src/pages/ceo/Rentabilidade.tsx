import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AlertTriangle, TrendingUp, DollarSign, Building2, Percent, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  fetchCompanyProfitability, generateCompanyAlerts,
  type CompanyProfitability, type ProfitabilityAlert,
} from "@/services/profitabilityService";
import { ExecutivePageHeader } from "@/components/ceo/ExecutivePageHeader";
import { CeoKpiCard } from "@/components/ceo/CeoKpiCard";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CeoRentabilidade() {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["ceo-profitability-companies"],
    queryFn: fetchCompanyProfitability,
  });

  const alerts = useMemo(() => generateCompanyAlerts(companies), [companies]);

  const totals = useMemo(() => {
    const revTotal = companies.reduce((s, c) => s + c.revenue_total, 0);
    const costPersonnel = companies.reduce((s, c) => s + c.cost_personnel, 0);
    const costOp = companies.reduce((s, c) => s + c.cost_operational, 0);
    const costTotal = companies.reduce((s, c) => s + c.cost_total, 0);
    const margin = revTotal - costTotal;
    const marginPct = revTotal > 0 ? (margin / revTotal) * 100 : 0;
    const efficiency = costTotal > 0 ? revTotal / costTotal : 0;
    return { revTotal, costPersonnel, costOp, costTotal, margin, marginPct, efficiency };
  }, [companies]);

  return (
    <div className="space-y-6">
      <ExecutivePageHeader
        title="Rentabilidade"
        subtitle="Visão executiva de custos e resultado operacional"
      />

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CeoKpiCard
          title="Faturamento Total"
          value={fmt(totals.revTotal)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <CeoKpiCard
          title="Custo de Pessoal"
          value={fmt(totals.costPersonnel)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <CeoKpiCard
          title="Margem Operacional"
          value={fmt(totals.margin)}
          icon={<Percent className="h-5 w-5" />}
          subtitle={`${totals.marginPct.toFixed(1)}%`}
          trend={totals.margin >= 0 ? "up" : "down"}
        />
        <CeoKpiCard
          title="Eficiência"
          value={`${totals.efficiency.toFixed(2)}x`}
          icon={<Zap className="h-5 w-5" />}
          subtitle="Receita por R$ de custo"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas Executivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge variant={a.type === "danger" ? "destructive" : "warning"} className="text-xs mt-0.5 shrink-0">
                  {a.type === "danger" ? "Crítico" : "Atenção"}
                </Badge>
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-muted-foreground text-xs">{a.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Company comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Comparativo entre Empresas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Pessoal</TableHead>
                <TableHead className="text-right">Operacional</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Eficiência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Sem dados</TableCell>
                </TableRow>
              ) : (
                companies.map((c) => (
                  <TableRow key={c.company_id}>
                    <TableCell className="font-medium">{c.company_name}</TableCell>
                    <TableCell className="text-right">{fmt(c.revenue_total)}</TableCell>
                    <TableCell className="text-right">{fmt(c.cost_personnel)}</TableCell>
                    <TableCell className="text-right">{fmt(c.cost_operational)}</TableCell>
                    <TableCell className="text-right">{fmt(c.cost_total)}</TableCell>
                    <TableCell className={`text-right font-semibold ${c.margin < 0 ? "text-destructive" : "text-success"}`}>
                      {fmt(c.margin)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.margin_pct >= 30 ? "success" : c.margin_pct >= 15 ? "warning" : "destructive"} className="text-xs">
                        {c.margin_pct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.efficiency.toFixed(2)}x</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost breakdown cards per company */}
      {companies.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {companies.map((c) => (
            <Card key={c.company_id} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{c.company_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedidos</span>
                  <span className="font-medium">{fmt(c.revenue_orders)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arquivos ECU</span>
                  <span className="font-medium">{fmt(c.revenue_files)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receitas extras</span>
                  <span className="font-medium">{fmt(c.revenue_extra)}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pessoal</span>
                  <span className="font-medium text-destructive">-{fmt(c.cost_personnel)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operacional</span>
                  <span className="font-medium text-destructive">-{fmt(c.cost_operational)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Despesas financeiras</span>
                  <span className="font-medium text-destructive">-{fmt(c.cost_financial)}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-semibold">
                  <span>Resultado</span>
                  <span className={c.margin < 0 ? "text-destructive" : "text-success"}>{fmt(c.margin)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
