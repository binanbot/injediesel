import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Users, DollarSign, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  fetchSellerProfitability, calcDepartmentProfitability, fetchCompanyProfitability,
  generateSellerAlerts, generateCompanyAlerts,
  type SellerProfitability, type CompanyProfitability, type ProfitabilityAlert,
} from "@/services/profitabilityService";
import { useCompany } from "@/hooks/useCompany";
import { useMemo, useState } from "react";
import { WalletProfitabilityPanel } from "@/components/admin/WalletProfitabilityPanel";
import { OperationalAlertsPanel } from "@/components/admin/OperationalAlertsPanel";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AlertCard({ alerts }: { alerts: ProfitabilityAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <Badge variant={a.type === "danger" ? "destructive" : a.type === "warning" ? "warning" : "info"} className="text-xs mt-0.5 shrink-0">
              {a.type === "danger" ? "Crítico" : a.type === "warning" ? "Atenção" : "Info"}
            </Badge>
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-muted-foreground text-xs">{a.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MasterRentabilidade() {
  const { company } = useCompany();
  const [tab, setTab] = useState("geral");

  const { data: sellers = [], isLoading: loadingSellers } = useQuery({
    queryKey: ["profitability-sellers", company?.id],
    queryFn: () => fetchSellerProfitability(company!.id),
    enabled: !!company?.id,
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["profitability-companies"],
    queryFn: fetchCompanyProfitability,
  });

  const departments = useMemo(() => calcDepartmentProfitability(sellers), [sellers]);
  const sellerAlerts = useMemo(() => generateSellerAlerts(sellers), [sellers]);
  const companyAlerts = useMemo(() => generateCompanyAlerts(companies), [companies]);
  const allAlerts = [...sellerAlerts, ...companyAlerts];

  const totalRevenue = sellers.reduce((s, x) => s + x.revenue_total, 0);
  const totalCost = sellers.reduce((s, x) => s + x.cost_total, 0);
  const totalMargin = totalRevenue - totalCost;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rentabilidade Operacional</h1>
        <p className="text-muted-foreground">Visão consolidada: colaboradores, equipes e empresas</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="geral"><TrendingUp className="h-4 w-4 mr-1" /> Geral</TabsTrigger>
          <TabsTrigger value="carteira"><Users className="h-4 w-4 mr-1" /> Carteira</TabsTrigger>
          <TabsTrigger value="alertas"><AlertTriangle className="h-4 w-4 mr-1" /> Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" /> Faturamento Comercial
            </div>
            <p className="text-xl font-bold">{fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" /> Custo Total
            </div>
            <p className="text-xl font-bold">{fmt(totalCost)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" /> Margem
            </div>
            <p className={`text-xl font-bold ${totalMargin < 0 ? "text-destructive" : "text-success"}`}>{fmt(totalMargin)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" /> Vendedores
            </div>
            <p className="text-xl font-bold">{sellers.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <AlertCard alerts={allAlerts} />

      {/* Company comparison */}
      {companies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Comparativo por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Eficiência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.company_id}>
                    <TableCell className="font-medium">{c.company_name}</TableCell>
                    <TableCell className="text-right">{fmt(c.revenue_total)}</TableCell>
                    <TableCell className="text-right">{fmt(c.cost_total)}</TableCell>
                    <TableCell className={`text-right font-medium ${c.margin < 0 ? "text-destructive" : "text-success"}`}>
                      {fmt(c.margin)}
                    </TableCell>
                    <TableCell className="text-right">{c.margin_pct.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{c.efficiency.toFixed(2)}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Department ranking */}
      {departments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Rentabilidade por Equipe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Colaboradores</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.department_name}>
                    <TableCell className="font-medium">{d.department_name}</TableCell>
                    <TableCell className="text-right">{d.employee_count}</TableCell>
                    <TableCell className="text-right">{fmt(d.revenue_total)}</TableCell>
                    <TableCell className="text-right">{fmt(d.cost_total)}</TableCell>
                    <TableCell className={`text-right font-medium ${d.margin < 0 ? "text-destructive" : "text-success"}`}>
                      {fmt(d.margin)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Seller ranking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Ranking de Rentabilidade por Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {loadingSellers ? "Carregando..." : "Nenhum vendedor encontrado"}
                  </TableCell>
                </TableRow>
              ) : (
                sellers.map((s, i) => (
                  <TableRow key={s.seller_profile_id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell className="font-medium">{s.display_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.department_name || "—"}</TableCell>
                    <TableCell className="text-right">{fmt(s.revenue_total)}</TableCell>
                    <TableCell className="text-right">{fmt(s.cost_total)}</TableCell>
                    <TableCell className={`text-right font-medium ${s.margin < 0 ? "text-destructive" : "text-success"}`}>
                      {fmt(s.margin)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={s.roi >= 200 ? "success" : s.roi >= 100 ? "warning" : "destructive"} className="text-xs">
                        {s.roi.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="carteira" className="space-y-6">
          {company?.id && <WalletProfitabilityPanel companyId={company.id} />}
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6">
          {company?.id && <OperationalAlertsPanel companyId={company.id} maxAlerts={20} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
