import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  TrendingUp, Building2, Target, XCircle, RefreshCw,
  ArrowRight, Users, Filter, Thermometer, AlertTriangle,
  Clock, CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  calcPlaybookAnalytics,
  calcCrossCompanyPlaybook,
  type PlaybookAnalytics,
  type CompanyPlaybookSummary,
} from "@/services/crmPlaybookAnalyticsService";
import {
  getTemperatureColor,
} from "@/services/crmPlaybookService";

// ─── Formatters ──────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

function cycleDays(hours: number | null): string {
  if (hours === null) return "—";
  return `${Math.round(hours / 24)}d`;
}

// ─── Page ────────────────────────────────────────────────────

export default function CrmIntelligence() {
  const [tab, setTab] = useState("comparativo");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");

  // Load companies
  const { data: companies = [] } = useQuery({
    queryKey: ["master-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  // Cross-company summary
  const { data: crossCompany, isLoading: loadingCross } = useQuery({
    queryKey: ["master-crm-cross-company"],
    queryFn: calcCrossCompanyPlaybook,
    staleTime: 120_000,
  });

  // Per-company detail
  const { data: companyDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["master-crm-detail", selectedCompanyId],
    queryFn: () => calcPlaybookAnalytics(selectedCompanyId),
    enabled: selectedCompanyId !== "all",
    staleTime: 120_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inteligência Comercial</h1>
          <p className="text-muted-foreground">Playbook cross-company: conversão, pipeline e gargalos</p>
        </div>
        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas empresas</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="comparativo"><Building2 className="h-4 w-4 mr-1" /> Comparativo</TabsTrigger>
          <TabsTrigger value="conversao"><TrendingUp className="h-4 w-4 mr-1" /> Conversão</TabsTrigger>
          <TabsTrigger value="pipeline"><Target className="h-4 w-4 mr-1" /> Pipeline</TabsTrigger>
          <TabsTrigger value="perdas"><XCircle className="h-4 w-4 mr-1" /> Perdas</TabsTrigger>
        </TabsList>

        {/* ─── Comparativo Tab ─────────────────────────── */}
        <TabsContent value="comparativo" className="space-y-6">
          <CrossCompanySection data={crossCompany} loading={loadingCross} />
        </TabsContent>

        {/* ─── Conversão Tab ───────────────────────────── */}
        <TabsContent value="conversao" className="space-y-6">
          {selectedCompanyId === "all" ? (
            <Card className="glass-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2" />
                <p>Selecione uma empresa no filtro acima para ver detalhes de conversão.</p>
              </CardContent>
            </Card>
          ) : loadingDetail ? (
            <LoadingSkeleton />
          ) : companyDetail ? (
            <ConversionDetail data={companyDetail} />
          ) : null}
        </TabsContent>

        {/* ─── Pipeline Tab ────────────────────────────── */}
        <TabsContent value="pipeline" className="space-y-6">
          {selectedCompanyId === "all" ? (
            <Card className="glass-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2" />
                <p>Selecione uma empresa para analisar o pipeline.</p>
              </CardContent>
            </Card>
          ) : loadingDetail ? (
            <LoadingSkeleton />
          ) : companyDetail ? (
            <PipelineDetail data={companyDetail} />
          ) : null}
        </TabsContent>

        {/* ─── Perdas Tab ──────────────────────────────── */}
        <TabsContent value="perdas" className="space-y-6">
          {selectedCompanyId === "all" ? (
            <Card className="glass-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2" />
                <p>Selecione uma empresa para ver motivos de perda e reativação.</p>
              </CardContent>
            </Card>
          ) : loadingDetail ? (
            <LoadingSkeleton />
          ) : companyDetail ? (
            <LossDetail data={companyDetail} />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Cross-Company Comparison ────────────────────────────────

function CrossCompanySection({ data, loading }: { data?: CompanyPlaybookSummary[]; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;
  if (!data || data.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhum dado de playbook encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const best = data.reduce((a, b) => (a.conversion_rate > b.conversion_rate ? a : b));
  const worst = data.reduce((a, b) => (a.conversion_rate < b.conversion_rate ? a : b));

  return (
    <>
      {/* Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Melhor conversão</p>
            <p className="text-lg font-bold text-primary">{best.company_name}</p>
            <p className="text-2xl font-bold">{Math.round(best.conversion_rate)}%</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-destructive/20">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Menor conversão</p>
            <p className="text-lg font-bold text-destructive">{worst.company_name}</p>
            <p className="text-2xl font-bold">{Math.round(worst.conversion_rate)}%</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Total oportunidades</p>
            <p className="text-2xl font-bold">{data.reduce((s, d) => s + d.total_opportunities, 0)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Total perdidas</p>
            <p className="text-2xl font-bold text-destructive">{data.reduce((s, d) => s + d.total_lost, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Side by side table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Comparativo entre Empresas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Oportunidades</TableHead>
                <TableHead>Conversão</TableHead>
                <TableHead>Ciclo médio</TableHead>
                <TableHead>Perdidas</TableHead>
                <TableHead>Top motivo perda</TableHead>
                <TableHead>Top origem</TableHead>
                <TableHead>Gargalo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.company_id}>
                  <TableCell className="font-medium">{d.company_name}</TableCell>
                  <TableCell>{d.total_opportunities}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={d.conversion_rate} className="h-2 w-16" />
                      <span className="text-xs font-medium">{Math.round(d.conversion_rate)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{cycleDays(d.avg_cycle_hours)}</TableCell>
                  <TableCell className="text-destructive">{d.total_lost}</TableCell>
                  <TableCell className="text-sm">{d.top_loss_reason || "—"}</TableCell>
                  <TableCell className="text-sm">{d.top_origin || "—"}</TableCell>
                  <TableCell>
                    {d.pipeline_bottleneck ? (
                      <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                        {d.pipeline_bottleneck}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Conversion Detail ───────────────────────────────────────

function ConversionDetail({ data }: { data: PlaybookAnalytics }) {
  return (
    <>
      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Conversão global</p>
            <p className="text-2xl font-bold text-primary">{Math.round(data.global_conversion_rate)}%</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Ciclo médio</p>
            <p className="text-2xl font-bold">{cycleDays(data.avg_cycle_hours)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{data.total_opportunities}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Ganhas</p>
            <p className="text-2xl font-bold text-primary">{data.total_won}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-xs text-muted-foreground">Perdidas</p>
            <p className="text-2xl font-bold text-destructive">{data.total_lost}</p>
          </CardContent>
        </Card>
      </div>

      {/* By Origin */}
      {data.by_origin.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> Conversão por Origem
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ganhas</TableHead>
                  <TableHead>Perdidas</TableHead>
                  <TableHead>Conversão</TableHead>
                  <TableHead>Ciclo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_origin.map((o) => (
                  <TableRow key={o.dimension}>
                    <TableCell className="font-medium">{o.label}</TableCell>
                    <TableCell>{o.total}</TableCell>
                    <TableCell className="text-primary">{o.won}</TableCell>
                    <TableCell className="text-destructive">{o.lost}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={o.conversion_rate} className="h-2 w-16" />
                        <span className="text-xs font-medium">{Math.round(o.conversion_rate)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cycleDays(o.avg_cycle_hours)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* By Temperature */}
      {data.by_temperature.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Thermometer className="h-4 w-4" /> Conversão por Temperatura
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.by_temperature.map((t) => (
              <Card key={t.dimension} className="glass-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={`text-xs ${getTemperatureColor(t.dimension)}`}>
                      {t.label}
                    </Badge>
                    <span className="text-sm font-medium">{t.total} opp</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={t.conversion_rate} className="h-2 flex-1" />
                    <span className="text-sm font-bold">{Math.round(t.conversion_rate)}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                    <div>G: <span className="text-primary font-medium">{t.won}</span></div>
                    <div>P: <span className="text-destructive font-medium">{t.lost}</span></div>
                    <div>A: <span className="font-medium">{t.open}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* By Seller */}
      {data.by_seller.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Ranking de Conversão por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ganhas</TableHead>
                  <TableHead>Conversão</TableHead>
                  <TableHead>Paradas</TableHead>
                  <TableHead>Ciclo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_seller.slice(0, 15).map((s, i) => (
                  <TableRow key={s.seller_profile_id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{s.seller_profile_id.slice(0, 8)}</TableCell>
                    <TableCell>{s.total}</TableCell>
                    <TableCell className="text-primary">{s.won}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.conversion_rate} className="h-2 w-16" />
                        <span className="text-xs font-medium">{Math.round(s.conversion_rate)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.stale_count > 0 ? (
                        <Badge variant="destructive" className="text-xs">{s.stale_count}</Badge>
                      ) : <CheckCircle className="h-4 w-4 text-primary" />}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cycleDays(s.avg_cycle_hours)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ─── Pipeline Detail ─────────────────────────────────────────

function PipelineDetail({ data }: { data: PlaybookAnalytics }) {
  const activeStages = data.pipeline_quality.filter((p) => p.count > 0);

  return (
    <>
      {/* Pipeline visual */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {data.pipeline_quality.map((p, i) => (
          <div key={p.stage} className="flex items-center gap-2 shrink-0">
            <Card className={`glass-card min-w-[140px] ${p.stale_count > 0 ? "border-destructive/30" : ""}`}>
              <CardContent className="pt-3 pb-2 text-center">
                <p className="text-xs text-muted-foreground font-medium">{p.label}</p>
                <p className="text-xl font-bold">{p.count}</p>
                <p className="text-xs text-muted-foreground">{fmt(p.total_value)}</p>
                {p.avg_hours !== null && (
                  <p className="text-xs mt-1">
                    <span className="text-muted-foreground">Média: </span>
                    <span className={p.avg_hours > 96 ? "text-destructive" : "text-primary"}>
                      {Math.round(p.avg_hours)}h
                    </span>
                  </p>
                )}
                {p.stale_count > 0 && (
                  <Badge variant="destructive" className="text-xs mt-1">{p.stale_count} paradas</Badge>
                )}
              </CardContent>
            </Card>
            {i < data.pipeline_quality.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Quality table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Qualidade do Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead>Qtde</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tempo médio</TableHead>
                <TableHead>Paradas (SLA)</TableHead>
                <TableHead>Sem follow-up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pipeline_quality.map((p) => (
                <TableRow key={p.stage} className={p.stale_count > 0 ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{p.label}</TableCell>
                  <TableCell>{p.count}</TableCell>
                  <TableCell className="text-sm">{fmt(p.total_value)}</TableCell>
                  <TableCell>
                    {p.avg_hours !== null ? (
                      <span className={p.avg_hours > 96 ? "text-destructive font-medium" : ""}>
                        {Math.round(p.avg_hours)}h
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {p.stale_count > 0 ? (
                      <Badge variant="destructive" className="text-xs">{p.stale_count}</Badge>
                    ) : <span className="text-primary">✓</span>}
                  </TableCell>
                  <TableCell>
                    {p.no_followup_count > 0 ? (
                      <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                        {p.no_followup_count}
                      </Badge>
                    ) : <span className="text-primary">✓</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottleneck alerts */}
      {activeStages.filter((s) => s.stale_count > 0 || s.no_followup_count > 0).length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Gargalos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeStages
              .filter((s) => s.stale_count > 0 || s.no_followup_count > 0)
              .map((s) => (
                <div key={s.stage} className="flex items-start gap-2 text-sm">
                  <Badge variant="destructive" className="text-xs mt-0.5 shrink-0">{s.label}</Badge>
                  <div className="text-muted-foreground">
                    {s.stale_count > 0 && <span>{s.stale_count} oportunidades paradas (excederam SLA). </span>}
                    {s.no_followup_count > 0 && <span>{s.no_followup_count} sem follow-up registrado. </span>}
                    {s.avg_hours !== null && s.avg_hours > 96 && (
                      <span>Tempo médio alto: {Math.round(s.avg_hours)}h.</span>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ─── Loss Detail ─────────────────────────────────────────────

function LossDetail({ data }: { data: PlaybookAnalytics }) {
  return (
    <>
      {/* Loss Reasons */}
      {data.loss_reasons.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" /> Motivos de Perda ({data.total_lost} perdidas)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.loss_reasons.map((r) => (
              <Card key={r.reason} className="glass-card">
                <CardContent className="pt-3 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {r.count}x ({Math.round(r.percentage)}%)
                    </Badge>
                  </div>
                  <Progress value={r.percentage} className="h-1.5 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    Valor perdido: {fmt(r.total_value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reactivation Reasons */}
      {data.reactivation_reasons.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" /> Motivos de Reativação
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.reactivation_reasons.map((r) => (
              <Card key={r.reason} className="glass-card">
                <CardContent className="pt-3 pb-2 text-center">
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xl font-bold">{r.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.loss_reasons.length === 0 && data.reactivation_reasons.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p>Nenhum dado de perda ou reativação registrado.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="glass-card">
          <CardContent className="pt-3 pb-2 space-y-2">
            <Skeleton className="h-3 w-20 mx-auto" />
            <Skeleton className="h-6 w-12 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
