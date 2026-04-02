import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, Building2, MapPin, Users, Car, FileDown, Wrench,
  ShoppingBag, Headphones, AlertTriangle, CheckCircle2,
  Clock, Eye, Globe, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getCompanyDetail,
  getCompanyUnits,
  getCompanyKPIs,
  getRecentFiles,
  getRecentOrders,
  getRecentTickets,
} from "@/services/companyDetailService";

// ─── Status Helpers ──────────────────────────────────────
const fileStatusLabel: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluído",
  rejected: "Rejeitado",
};

const orderStatusLabel: Record<string, string> = {
  pedido_realizado: "Realizado",
  confirmado: "Confirmado",
  em_producao: "Em Produção",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  const variant = status === "pending" || status === "pedido_realizado" ? "pending"
    : status === "processing" || status === "confirmado" || status === "em_producao" ? "processing"
    : status === "completed" || status === "entregue" ? "completed"
    : status === "cancelado" || status === "rejected" ? "cancelled"
    : "outline";
  return <Badge variant={variant} className="text-xs">{map[status] || status}</Badge>;
}

// ─── KPI Mini Card ───────────────────────────────────────
function KPICard({ icon: Icon, label, value, accent = "amber", loading }: {
  icon: React.ElementType; label: string; value: number | string;
  accent?: "amber" | "emerald" | "sky" | "rose" | "violet"; loading?: boolean;
}) {
  const accentMap = { amber: "text-amber-400", emerald: "text-emerald-400", sky: "text-sky-400", rose: "text-rose-400", violet: "text-violet-400" };

  if (loading) return <Card className="glass-card"><CardContent className="pt-4"><Skeleton className="h-8 w-16" /></CardContent></Card>;

  return (
    <Card className="glass-card hover:border-amber-400/20 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={cn("h-4 w-4", accentMap[accent])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company-detail", companyId],
    queryFn: () => getCompanyDetail(companyId!),
    enabled: !!companyId,
  });

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["company-kpis", companyId],
    queryFn: () => getCompanyKPIs(companyId!),
    enabled: !!companyId,
  });

  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["company-units", companyId],
    queryFn: () => getCompanyUnits(companyId!),
    enabled: !!companyId,
  });

  const { data: recentFiles } = useQuery({
    queryKey: ["company-recent-files", companyId],
    queryFn: () => getRecentFiles(companyId!),
    enabled: !!companyId,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["company-recent-orders", companyId],
    queryFn: () => getRecentOrders(companyId!),
    enabled: !!companyId,
  });

  const { data: recentTickets } = useQuery({
    queryKey: ["company-recent-tickets", companyId],
    queryFn: () => getRecentTickets(),
    enabled: !!companyId,
  });

  if (companyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Empresa não encontrada</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/master">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/master"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {company.brand_name || company.name}
            </h1>
            <Badge variant={company.is_active ? "completed" : "cancelled"} className="shrink-0">
              {company.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{company.slug}</span>
            {company.cnpj && <span>CNPJ: {company.cnpj}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Desde {format(new Date(company.created_at), "MMM yyyy", { locale: ptBR })}</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard icon={MapPin} label="Unidades" value={kpis?.units ?? 0} accent="sky" loading={kpisLoading} />
        <KPICard icon={Users} label="Clientes" value={kpis?.customers ?? 0} accent="emerald" loading={kpisLoading} />
        <KPICard icon={Car} label="Veículos" value={kpis?.vehicles ?? 0} accent="violet" loading={kpisLoading} />
        <KPICard icon={FileDown} label="Arquivos ECU" value={kpis?.files ?? 0} accent="sky" loading={kpisLoading} />
        <KPICard icon={Wrench} label="Serviços" value={kpis?.services ?? 0} accent="emerald" loading={kpisLoading} />
        <KPICard icon={ShoppingBag} label="Pedidos" value={kpis?.orders ?? 0} accent="amber" loading={kpisLoading} />
        <KPICard icon={Headphones} label="Tickets Abertos" value={kpis?.open_tickets ?? 0} accent="rose" loading={kpisLoading} />
        <KPICard icon={AlertTriangle} label="Arquivos Pendentes" value={kpis?.files_pending ?? 0} accent="amber" loading={kpisLoading} />
        <KPICard icon={ShoppingBag} label="Pedidos Pendentes" value={kpis?.orders_pending ?? 0} accent="rose" loading={kpisLoading} />
        <KPICard icon={Shield} label="Módulos" value={company.enabled_modules.length} accent="violet" loading={false} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="units" className="space-y-4">
        <TabsList className="bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="units" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />Unidades</TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5"><FileDown className="h-3.5 w-3.5" />Arquivos</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5"><ShoppingBag className="h-3.5 w-3.5" />Pedidos</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5"><Headphones className="h-3.5 w-3.5" />Suporte</TabsTrigger>
        </TabsList>

        {/* Units Tab */}
        <TabsContent value="units">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-400" />
                Unidades ({units?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : units && units.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Franqueado</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead className="text-center">Clientes</TableHead>
                      <TableHead className="text-center">Veículos</TableHead>
                      <TableHead className="text-center">Arquivos</TableHead>
                      <TableHead className="text-center">Serviços</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{unit.franchisee_name || "—"}</TableCell>
                        <TableCell className="text-sm">{[unit.city, unit.state].filter(Boolean).join("/") || "—"}</TableCell>
                        <TableCell className="text-center">{unit.customers_count}</TableCell>
                        <TableCell className="text-center">{unit.vehicles_count}</TableCell>
                        <TableCell className="text-center">{unit.files_count}</TableCell>
                        <TableCell className="text-center">{unit.services_count}</TableCell>
                        <TableCell>
                          <Badge variant={unit.is_active ? "completed" : "cancelled"} className="text-xs">
                            {unit.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhuma unidade cadastrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileDown className="h-5 w-5 text-amber-400" />
                Arquivos ECU Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentFiles && recentFiles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFiles.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono font-medium">{f.placa}</TableCell>
                        <TableCell className="text-sm">{f.servico}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.unit_name}</TableCell>
                        <TableCell><StatusBadge status={f.status} map={fileStatusLabel} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(f.created_at), "dd/MM/yy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhum arquivo recente</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-400" />
                Pedidos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders && recentOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono font-medium">#{o.order_number}</TableCell>
                        <TableCell>R$ {Number(o.total_amount).toFixed(2)}</TableCell>
                        <TableCell><StatusBadge status={o.status} map={orderStatusLabel} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(o.created_at), "dd/MM/yy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhum pedido recente</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Headphones className="h-5 w-5 text-amber-400" />
                Tickets de Suporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTickets && recentTickets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.subject}</TableCell>
                        <TableCell>
                          <Badge variant={t.status === "open" ? "pending" : "completed"} className="text-xs">
                            {t.status === "open" ? "Aberto" : "Resolvido"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhum ticket recente</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modules Info */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            Módulos Habilitados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {company.enabled_modules.map((mod) => (
              <Badge key={mod} variant="outline" className="text-xs capitalize">
                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />
                {mod}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
