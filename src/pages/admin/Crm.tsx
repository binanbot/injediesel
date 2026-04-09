import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Activity, Target, Plus, Search,
  Clock, CheckCircle, AlertTriangle, XCircle,
  Shield, TrendingUp, CalendarDays, RefreshCw,
  ListChecks, Phone, MessageSquare, ThumbsDown,
  Filter, Lightbulb, UserX, Zap, Settings2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  fetchActivities, createActivity, updateActivity,
  fetchOpportunities, createOpportunity, updateOpportunity,
  fetchCustomersWithoutSeller,
  fetchOverdueActivities, fetchWalletHealth, calcFunnelSummary,
  fetchSellerAgenda, fetchReactivationCandidates, registerReactivationAttempt,
  fetchSellerProductivity,
  ACTIVITY_TYPES, ACTIVITY_STATUSES, ACTIVITY_PRIORITIES,
  OPPORTUNITY_STAGES, CHANNELS, WALLET_STATUSES,
  getPriorityColor, getWalletStatusLabel, getWalletStatusColor,
  type CrmActivity, type CrmOpportunity, type WalletCustomer,
  type ReactivationCandidate,
} from "@/services/crmService";
import { fetchActiveSellers } from "@/services/employeeService";
import {
  generateTaskSuggestions, getCrmConfig,
  SUGGESTION_TYPE_LABELS,
  type TaskSuggestion, type CrmConfig,
} from "@/services/crmAutomationService";
import { calcCommercialSla, type CommercialSla } from "@/services/crmSlaService";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { OperationalAlertsPanel } from "@/components/admin/OperationalAlertsPanel";
import { WalletProfitabilityPanel } from "@/components/admin/WalletProfitabilityPanel";

// ─── Activity Dialog ─────────────────────────────────────────

function ActivityDialog({
  open, onOpenChange, companyId, sellers, existing, defaultCustomerId, defaultSellerId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  sellers: any[];
  existing?: CrmActivity | null;
  defaultCustomerId?: string;
  defaultSellerId?: string;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({
    activity_type: existing?.activity_type || "contato",
    channel: existing?.channel || "",
    summary: existing?.summary || "",
    seller_profile_id: existing?.seller_profile_id || defaultSellerId || "",
    customer_id: existing?.customer_id || defaultCustomerId || "",
    scheduled_at: existing?.scheduled_at ? existing.scheduled_at.slice(0, 16) : "",
    due_date: existing?.due_date ? existing.due_date.slice(0, 16) : "",
    priority: existing?.priority || "media",
    status: existing?.status || "pendente",
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customers = [] } = useQuery({
    queryKey: ["crm-customers-search", companyId, customerSearch],
    queryFn: async () => {
      if (!customerSearch || customerSearch.length < 2) return [];
      const { data: units } = await supabase.from("units").select("id").eq("company_id", companyId);
      const unitIds = (units || []).map((u) => u.id);
      if (unitIds.length === 0) return [];
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, phone")
        .in("unit_id", unitIds)
        .ilike("full_name", `%${customerSearch}%`)
        .eq("is_active", true)
        .limit(10);
      return data || [];
    },
    enabled: customerSearch.length >= 2,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: companyId,
        customer_id: form.customer_id,
        seller_profile_id: form.seller_profile_id || null,
        activity_type: form.activity_type,
        channel: form.channel || null,
        summary: form.summary || null,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        priority: form.priority,
        status: form.status,
        created_by: user?.id || null,
      };
      if (existing) {
        await updateActivity(existing.id, payload as any);
      } else {
        await createActivity(payload as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
      qc.invalidateQueries({ queryKey: ["crm-overdue"] });
      qc.invalidateQueries({ queryKey: ["crm-agenda"] });
      toast.success(existing ? "Atividade atualizada" : "Atividade registrada");
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao salvar atividade"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {form.customer_id ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{customers.find(c => c.id === form.customer_id)?.full_name || existing?.customer?.full_name || "Selecionado"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, customer_id: "" }))}>Trocar</Button>
              </div>
            ) : (
              <>
                <Input placeholder="Buscar cliente por nome..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                {customers.length > 0 && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {customers.map((c) => (
                      <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-muted text-sm" onClick={() => { setForm(f => ({ ...f, customer_id: c.id })); setCustomerSearch(""); }}>
                        {c.full_name} {c.phone && <span className="text-muted-foreground ml-2">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.activity_type} onValueChange={(v) => setForm(f => ({ ...f, activity_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_PRIORITIES.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={form.channel} onValueChange={(v) => setForm(f => ({ ...f, channel: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vendedor</Label>
            <Select value={form.seller_profile_id} onValueChange={(v) => setForm(f => ({ ...f, seller_profile_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {sellers.map((s) => (<SelectItem key={s.seller_profile.id} value={s.seller_profile.id}>{s.display_name || "Sem nome"}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agendamento</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input type="datetime-local" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Resumo</Label>
            <Textarea value={form.summary} onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Detalhes da atividade..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.customer_id || mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Opportunity Dialog ──────────────────────────────────────

function OpportunityDialog({
  open, onOpenChange, companyId, sellers, existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  sellers: any[];
  existing?: CrmOpportunity | null;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: existing?.title || "",
    stage: existing?.stage || "lead",
    estimated_value: existing?.estimated_value?.toString() || "0",
    sale_channel: existing?.sale_channel || "",
    seller_profile_id: existing?.seller_profile_id || "",
    customer_id: existing?.customer_id || "",
    notes: existing?.notes || "",
    lost_reason: existing?.lost_reason || "",
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customers = [] } = useQuery({
    queryKey: ["crm-opp-customers-search", companyId, customerSearch],
    queryFn: async () => {
      if (!customerSearch || customerSearch.length < 2) return [];
      const { data: units } = await supabase.from("units").select("id").eq("company_id", companyId);
      const unitIds = (units || []).map((u) => u.id);
      if (unitIds.length === 0) return [];
      const { data } = await supabase.from("customers").select("id, full_name").in("unit_id", unitIds).ilike("full_name", `%${customerSearch}%`).eq("is_active", true).limit(10);
      return data || [];
    },
    enabled: customerSearch.length >= 2,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const isClosed = form.stage === "fechado_ganho" || form.stage === "fechado_perdido";
      const payload = {
        company_id: companyId,
        customer_id: form.customer_id,
        seller_profile_id: form.seller_profile_id || null,
        title: form.title,
        stage: form.stage,
        estimated_value: Number(form.estimated_value) || 0,
        sale_channel: form.sale_channel || null,
        notes: form.notes || null,
        lost_reason: form.stage === "fechado_perdido" ? form.lost_reason || null : null,
        closed_at: isClosed ? new Date().toISOString() : null,
        created_by: user?.id || null,
      };
      if (existing) await updateOpportunity(existing.id, payload as any);
      else await createOpportunity(payload as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-opportunities"] });
      toast.success(existing ? "Oportunidade atualizada" : "Oportunidade criada");
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao salvar oportunidade"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar Oportunidade" : "Nova Oportunidade"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {form.customer_id ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{customers.find(c => c.id === form.customer_id)?.full_name || existing?.customer?.full_name || "Selecionado"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, customer_id: "" }))}>Trocar</Button>
              </div>
            ) : (
              <>
                <Input placeholder="Buscar cliente..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                {customers.length > 0 && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {customers.map((c) => (
                      <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-muted text-sm" onClick={() => { setForm(f => ({ ...f, customer_id: c.id })); setCustomerSearch(""); }}>{c.full_name}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Proposta de chiptuning" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estágio</Label>
              <Select value={form.stage} onValueChange={(v) => setForm(f => ({ ...f, stage: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OPPORTUNITY_STAGES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor estimado (R$)</Label>
              <Input type="number" value={form.estimated_value} onChange={(e) => setForm(f => ({ ...f, estimated_value: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={form.sale_channel} onValueChange={(v) => setForm(f => ({ ...f, sale_channel: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{CHANNELS.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={form.seller_profile_id} onValueChange={(v) => setForm(f => ({ ...f, seller_profile_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>{sellers.map((s) => (<SelectItem key={s.seller_profile.id} value={s.seller_profile.id}>{s.display_name || "Sem nome"}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          {form.stage === "fechado_perdido" && (
            <div className="space-y-2">
              <Label>Motivo da perda</Label>
              <Input value={form.lost_reason} onChange={(e) => setForm(f => ({ ...f, lost_reason: e.target.value }))} placeholder="Ex: Preço, concorrência..." />
            </div>
          )}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.customer_id || !form.title || mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pendente": return <Clock className="h-4 w-4 text-warning" />;
    case "realizada": return <CheckCircle className="h-4 w-4 text-success" />;
    case "atrasada": return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "cancelada": return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default: return null;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = ACTIVITY_PRIORITIES.find((x) => x.value === priority);
  return (
    <Badge variant="outline" className={`text-xs ${getPriorityColor(priority)}`}>
      {p?.label || priority}
    </Badge>
  );
}

function WalletStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs ${getWalletStatusColor(status)}`}>
      {getWalletStatusLabel(status)}
    </Badge>
  );
}

const stageBadgeMap: Record<string, string> = {
  lead: "info",
  em_contato: "warning",
  proposta: "default",
  negociacao: "warning",
  fechado_ganho: "success",
  fechado_perdido: "destructive",
};

// ─── Main CRM Page ──────────────────────────────────────────

export default function CrmPage() {
  const { company } = useCompany();
  const companyId = company?.id;
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("carteira");
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityDialogDefaults, setActivityDialogDefaults] = useState<{ customerId?: string; sellerId?: string }>({});
  const [oppDialogOpen, setOppDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [walletFilter, setWalletFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [agendaSellerFilter, setAgendaSellerFilter] = useState("all");

  const { data: sellers = [] } = useQuery({
    queryKey: ["crm-sellers", companyId],
    queryFn: () => fetchActiveSellers(companyId!),
    enabled: !!companyId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["crm-activities", companyId],
    queryFn: () => fetchActivities(companyId!),
    enabled: !!companyId,
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["crm-opportunities", companyId],
    queryFn: () => fetchOpportunities(companyId!),
    enabled: !!companyId,
  });

  const { data: walletCustomers = [] } = useQuery({
    queryKey: ["crm-wallet-health", companyId],
    queryFn: () => fetchWalletHealth(companyId!),
    enabled: !!companyId,
  });

  const { data: noSeller = [] } = useQuery({
    queryKey: ["crm-no-seller", companyId],
    queryFn: () => fetchCustomersWithoutSeller(companyId!),
    enabled: !!companyId,
  });

  const { data: overdueActivities = [] } = useQuery({
    queryKey: ["crm-overdue", companyId],
    queryFn: () => fetchOverdueActivities(companyId!),
    enabled: !!companyId,
  });

  const { data: agendaItems = [] } = useQuery({
    queryKey: ["crm-agenda", companyId, agendaSellerFilter],
    queryFn: () => fetchSellerAgenda(companyId!, agendaSellerFilter === "all" ? null : agendaSellerFilter),
    enabled: !!companyId,
  });

  const { data: reactivationCandidates = [] } = useQuery({
    queryKey: ["crm-reactivation", companyId, sellerFilter],
    queryFn: () => fetchReactivationCandidates(companyId!, sellerFilter === "all" ? null : sellerFilter),
    enabled: !!companyId,
  });

  const { data: sellerProductivity = [] } = useQuery({
    queryKey: ["crm-seller-productivity", companyId],
    queryFn: () => fetchSellerProductivity(companyId!),
    enabled: !!companyId,
  });

  const reactivationMutation = useMutation({
    mutationFn: async (params: { customerId: string; sellerId: string | null; type: "reativacao" | "retorno" | "perda"; summary: string }) => {
      return registerReactivationAttempt(companyId!, params.customerId, params.sellerId, params.type, params.summary, user?.id || null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-reactivation"] });
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
      toast.success("Tentativa de contato registrada");
    },
    onError: () => toast.error("Erro ao registrar tentativa"),
  });

  const funnel = useMemo(() => calcFunnelSummary(opportunities), [opportunities]);
  const activeOpps = opportunities.filter(o => o.stage !== "fechado_ganho" && o.stage !== "fechado_perdido");
  const pipelineValue = activeOpps.reduce((s, o) => s + Number(o.estimated_value), 0);

  const walletStats = useMemo(() => {
    const ativa = walletCustomers.filter(c => c.wallet_status === "ativa").length;
    const em_risco = walletCustomers.filter(c => c.wallet_status === "em_risco").length;
    const inativa = walletCustomers.filter(c => c.wallet_status === "inativa").length;
    return { ativa, em_risco, inativa, total: walletCustomers.length };
  }, [walletCustomers]);

  const filteredWallet = useMemo(() => {
    let list = walletCustomers;
    if (walletFilter !== "all") list = list.filter(c => c.wallet_status === walletFilter);
    if (sellerFilter !== "all" && tab === "carteira") {
      list = list.filter(c => c.primary_seller_id === sellerFilter);
    }
    if (search && tab === "carteira") {
      const q = search.toLowerCase();
      list = list.filter(c => c.full_name.toLowerCase().includes(q));
    }
    return list;
  }, [walletCustomers, walletFilter, sellerFilter, search, tab]);

  // Tasks: activities that are task-like (pendente/atrasada with due_date or scheduled_at)
  const taskActivities = useMemo(() => {
    let list = activities.filter(a => a.status === "pendente" || a.status === "atrasada");
    if (sellerFilter !== "all" && tab === "tarefas") {
      list = list.filter(a => a.seller_profile_id === sellerFilter);
    }
    if (search && tab === "tarefas") {
      const q = search.toLowerCase();
      list = list.filter(a => a.customer?.full_name?.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q));
    }
    const now = new Date().toISOString();
    return list.sort((a, b) => {
      const aDate = a.due_date || a.scheduled_at || a.created_at;
      const bDate = b.due_date || b.scheduled_at || b.created_at;
      return aDate.localeCompare(bDate);
    }).map(a => ({
      ...a,
      is_overdue: (a.due_date && a.due_date < now) || (a.scheduled_at && a.scheduled_at < now),
    }));
  }, [activities, sellerFilter, search, tab]);

  const filteredActivities = useMemo(() => {
    if (!search || tab !== "atividades") return activities;
    const q = search.toLowerCase();
    return activities.filter(
      (a) =>
        a.customer?.full_name?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.activity_type?.toLowerCase().includes(q)
    );
  }, [activities, search, tab]);

  const agendaOverdue = useMemo(() => agendaItems.filter(a => a.is_overdue), [agendaItems]);
  const agendaUpcoming = useMemo(() => agendaItems.filter(a => !a.is_overdue), [agendaItems]);

  const openNewActivityFor = (customerId: string, sellerId?: string | null) => {
    setActivityDialogDefaults({ customerId, sellerId: sellerId || undefined });
    setActivityDialogOpen(true);
  };

  const getSellerName = (sellerId: string | null) => {
    if (!sellerId) return null;
    const s = sellers.find((s: any) => s.seller_profile?.id === sellerId);
    return s?.display_name || null;
  };

  if (!companyId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM Comercial</h1>
          <p className="text-muted-foreground">Carteira, tarefas, agenda e funil de oportunidades</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="glass-card cursor-pointer" onClick={() => setTab("carteira")}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Ativas
            </div>
            <p className="text-2xl font-bold text-emerald-400">{walletStats.ativa}</p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer" onClick={() => { setTab("carteira"); setWalletFilter("em_risco"); }}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Em risco
            </div>
            <p className="text-2xl font-bold text-amber-400">{walletStats.em_risco}</p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer" onClick={() => setTab("reativacao")}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <RefreshCw className="h-4 w-4 text-muted-foreground" /> Inativas
            </div>
            <p className="text-2xl font-bold">{walletStats.inativa}</p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer" onClick={() => setTab("tarefas")}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ListChecks className="h-4 w-4 text-primary" /> Tarefas
            </div>
            <p className="text-2xl font-bold">{taskActivities.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer" onClick={() => setTab("agenda")}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4 text-destructive" /> Atrasados
            </div>
            <p className="text-2xl font-bold text-destructive">{overdueActivities.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card cursor-pointer" onClick={() => setTab("funil")}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" /> Pipeline
            </div>
            <p className="text-lg font-bold">
              {pipelineValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="carteira"><Users className="h-4 w-4 mr-1" /> Carteira</TabsTrigger>
          <TabsTrigger value="tarefas"><ListChecks className="h-4 w-4 mr-1" /> Tarefas</TabsTrigger>
          <TabsTrigger value="agenda"><CalendarDays className="h-4 w-4 mr-1" /> Agenda</TabsTrigger>
          <TabsTrigger value="reativacao"><RefreshCw className="h-4 w-4 mr-1" /> Reativação</TabsTrigger>
          <TabsTrigger value="atividades"><Activity className="h-4 w-4 mr-1" /> Atividades</TabsTrigger>
          <TabsTrigger value="funil"><Target className="h-4 w-4 mr-1" /> Funil</TabsTrigger>
          <TabsTrigger value="rentabilidade"><TrendingUp className="h-4 w-4 mr-1" /> Rentabilidade</TabsTrigger>
          <TabsTrigger value="alertas"><Shield className="h-4 w-4 mr-1" /> Alertas</TabsTrigger>
        </TabsList>

        {/* ─── Carteira Tab ───────────────────────────── */}
        <TabsContent value="carteira" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={walletFilter} onValueChange={setWalletFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas ({walletStats.total})</SelectItem>
                {WALLET_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sellerFilter} onValueChange={setSellerFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos vendedores</SelectItem>
                <SelectItem value="__none__">Sem vendedor</SelectItem>
                {sellers.map((s: any) => (
                  <SelectItem key={s.seller_profile.id} value={s.seller_profile.id}>{s.display_name || "Sem nome"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última compra</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWallet.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell>
                    </TableRow>
                  ) : (
                    filteredWallet.slice(0, 100).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.full_name}</TableCell>
                        <TableCell><WalletStatusBadge status={c.wallet_status} /></TableCell>
                        <TableCell className="text-sm">
                          {c.last_order_at ? format(new Date(c.last_order_at), "dd/MM/yyyy") : "Nunca"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.days_since_purchase !== null ? `${c.days_since_purchase}d` : "—"}
                        </TableCell>
                        <TableCell>
                          {c.primary_seller_id ? (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />{getSellerName(c.primary_seller_id) || "Atribuído"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Sem vendedor</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openNewActivityFor(c.id, c.primary_seller_id)}>
                            <Phone className="h-3 w-3 mr-1" /> Contato
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {noSeller.length > 0 && (
            <Card className="border-warning/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" /> {noSeller.length} clientes sem vendedor atribuído
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {noSeller.slice(0, 10).map((c) => (
                    <p key={c.id} className="text-sm">{c.full_name}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tarefas Tab ────────────────────────────── */}
        <TabsContent value="tarefas" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tarefa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={sellerFilter} onValueChange={setSellerFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos vendedores</SelectItem>
                {sellers.map((s: any) => (
                  <SelectItem key={s.seller_profile.id} value={s.seller_profile.id}>{s.display_name || "Sem nome"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { setActivityDialogDefaults({}); setActivityDialogOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
            </Button>
          </div>

          {/* Summary counters */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-card">
              <CardContent className="pt-3 pb-2 text-center">
                <p className="text-xs text-muted-foreground">Total pendentes</p>
                <p className="text-xl font-bold">{taskActivities.length}</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-destructive/30">
              <CardContent className="pt-3 pb-2 text-center">
                <p className="text-xs text-destructive">Atrasadas</p>
                <p className="text-xl font-bold text-destructive">{taskActivities.filter(t => t.is_overdue).length}</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-3 pb-2 text-center">
                <p className="text-xs text-muted-foreground">Próximas 7 dias</p>
                <p className="text-xl font-bold">
                  {taskActivities.filter(t => {
                    const d = t.due_date || t.scheduled_at;
                    if (!d || t.is_overdue) return false;
                    const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                    return diff <= 7;
                  }).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead className="w-[80px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma tarefa pendente</TableCell>
                    </TableRow>
                  ) : (
                    taskActivities.slice(0, 50).map((a) => (
                      <TableRow key={a.id} className={a.is_overdue ? "bg-destructive/5" : ""}>
                        <TableCell>{a.is_overdue ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-warning" />}</TableCell>
                        <TableCell><PriorityBadge priority={a.priority} /></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ACTIVITY_TYPES.find(t => t.value === a.activity_type)?.label || a.activity_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{a.customer?.full_name || "—"}</TableCell>
                        <TableCell className="text-sm">{getSellerName(a.seller_profile_id) || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {a.due_date ? format(new Date(a.due_date), "dd/MM HH:mm") : a.scheduled_at ? format(new Date(a.scheduled_at), "dd/MM HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{a.summary || "—"}</TableCell>
                        <TableCell>
                          <MarkDoneButton activityId={a.id} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Agenda Tab ─────────────────────────────── */}
        <TabsContent value="agenda" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={agendaSellerFilter} onValueChange={setAgendaSellerFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos vendedores</SelectItem>
                {sellers.map((s: any) => (
                  <SelectItem key={s.seller_profile.id} value={s.seller_profile.id}>{s.display_name || "Sem nome"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { setActivityDialogDefaults({}); setActivityDialogOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Agendar
            </Button>
          </div>

          {/* Seller productivity cards */}
          {sellerProductivity.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sellerProductivity.slice(0, 4).map((sp) => (
                <Card key={sp.seller_profile_id} className="glass-card">
                  <CardContent className="pt-3 pb-2">
                    <p className="text-xs text-muted-foreground truncate">{getSellerName(sp.seller_profile_id) || "Vendedor"}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm">{sp.completed}/{sp.total}</span>
                      <Badge variant={sp.overdue > 0 ? "destructive" : "outline"} className="text-xs">
                        {sp.overdue > 0 ? `${sp.overdue} atrasadas` : `${Math.round(sp.completion_rate)}%`}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Overdue section */}
          {agendaOverdue.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> {agendaOverdue.length} follow-ups atrasados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {agendaOverdue.slice(0, 10).map((a) => (
                      <TableRow key={a.id} className="bg-destructive/5">
                        <TableCell className="font-medium">{a.customer?.full_name || "—"}</TableCell>
                        <TableCell><PriorityBadge priority={a.priority} /></TableCell>
                        <TableCell className="text-sm text-destructive">
                          {a.scheduled_at && format(new Date(a.scheduled_at), "dd/MM HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">{getSellerName(a.seller_profile_id) || "—"}</TableCell>
                        <TableCell><MarkDoneButton activityId={a.id} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Upcoming */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Próximos 14 dias ({agendaUpcoming.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Agendado</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead className="w-[80px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendaUpcoming.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum agendamento próximo</TableCell>
                    </TableRow>
                  ) : (
                    agendaUpcoming.slice(0, 30).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.customer?.full_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ACTIVITY_TYPES.find(t => t.value === a.activity_type)?.label || a.activity_type}
                          </Badge>
                        </TableCell>
                        <TableCell><PriorityBadge priority={a.priority} /></TableCell>
                        <TableCell className="text-sm">{a.scheduled_at && format(new Date(a.scheduled_at), "dd/MM HH:mm")}</TableCell>
                        <TableCell className="text-sm">{getSellerName(a.seller_profile_id) || "—"}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{a.summary || "—"}</TableCell>
                        <TableCell><MarkDoneButton activityId={a.id} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Reativação Tab ─────────────────────────── */}
        <TabsContent value="reativacao" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={sellerFilter} onValueChange={setSellerFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos vendedores</SelectItem>
                {sellers.map((s: any) => (
                  <SelectItem key={s.seller_profile.id} value={s.seller_profile.id}>{s.display_name || "Sem nome"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">{reactivationCandidates.length} candidatos</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="glass-card border-amber-500/20">
              <CardContent className="pt-3 pb-2 text-center">
                <p className="text-xs text-amber-400">Em Risco</p>
                <p className="text-xl font-bold text-amber-400">{reactivationCandidates.filter(c => c.wallet_status === "em_risco").length}</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-3 pb-2 text-center">
                <p className="text-xs text-muted-foreground">Inativas</p>
                <p className="text-xl font-bold">{reactivationCandidates.filter(c => c.wallet_status === "inativa").length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última compra</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Último contato</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reactivationCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum candidato a reativação</TableCell>
                    </TableRow>
                  ) : (
                    reactivationCandidates.slice(0, 50).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.full_name}</TableCell>
                        <TableCell><WalletStatusBadge status={c.wallet_status} /></TableCell>
                        <TableCell className="text-sm">
                          {c.last_order_at ? format(new Date(c.last_order_at), "dd/MM/yyyy") : "Nunca"}
                        </TableCell>
                        <TableCell className="text-sm">{c.days_since_purchase !== null ? `${c.days_since_purchase}d` : "—"}</TableCell>
                        <TableCell className="text-sm">
                          {c.last_activity_at ? (
                            <span>{format(new Date(c.last_activity_at), "dd/MM")} <Badge variant="outline" className="text-xs ml-1">{ACTIVITY_TYPES.find(t => t.value === c.last_activity_type)?.label || c.last_activity_type}</Badge></span>
                          ) : "Nenhum"}
                        </TableCell>
                        <TableCell className="text-sm">{getSellerName(c.primary_seller_id) || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              disabled={reactivationMutation.isPending}
                              onClick={() => reactivationMutation.mutate({
                                customerId: c.id, sellerId: c.primary_seller_id,
                                type: "reativacao", summary: "Tentativa de reativação"
                              })}
                            >
                              <Phone className="h-3 w-3 mr-1" /> Contato
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              disabled={reactivationMutation.isPending}
                              onClick={() => reactivationMutation.mutate({
                                customerId: c.id, sellerId: c.primary_seller_id,
                                type: "retorno", summary: "Retorno agendado pelo CRM"
                              })}
                            >
                              <CalendarDays className="h-3 w-3 mr-1" /> Retorno
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground"
                              disabled={reactivationMutation.isPending}
                              onClick={() => reactivationMutation.mutate({
                                customerId: c.id, sellerId: c.primary_seller_id,
                                type: "perda", summary: "Sem interesse / Perda"
                              })}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" /> Sem interesse
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Atividades Tab ─────────────────────────── */}
        <TabsContent value="atividades" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar atividade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => { setActivityDialogDefaults({}); setActivityDialogOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova Atividade
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Resumo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma atividade registrada</TableCell>
                    </TableRow>
                  ) : (
                    filteredActivities.slice(0, 50).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell><StatusIcon status={a.status} /></TableCell>
                        <TableCell><PriorityBadge priority={a.priority} /></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ACTIVITY_TYPES.find(t => t.value === a.activity_type)?.label || a.activity_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{a.customer?.full_name || "—"}</TableCell>
                        <TableCell>{CHANNELS.find(c => c.value === a.channel)?.label || a.channel || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {a.due_date ? format(new Date(a.due_date), "dd/MM/yyyy HH:mm") : a.scheduled_at ? format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{a.summary || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Funil Tab ──────────────────────────────── */}
        <TabsContent value="funil" className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => setOppDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova Oportunidade
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {funnel.map((s) => (
              <Card key={s.stage} className="glass-card">
                <CardContent className="pt-3 pb-2 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estágio</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma oportunidade registrada</TableCell>
                    </TableRow>
                  ) : (
                    opportunities.slice(0, 50).map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Badge variant={(stageBadgeMap[o.stage] as any) || "outline"} className="text-xs">
                            {OPPORTUNITY_STAGES.find(s => s.value === o.stage)?.label || o.stage}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{o.title}</TableCell>
                        <TableCell>{o.customer?.full_name || "—"}</TableCell>
                        <TableCell>{Number(o.estimated_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                        <TableCell>{CHANNELS.find(c => c.value === o.sale_channel)?.label || o.sale_channel || "—"}</TableCell>
                        <TableCell className="text-sm">{format(new Date(o.created_at), "dd/MM/yyyy")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Rentabilidade Tab ─────────────────────── */}
        <TabsContent value="rentabilidade" className="space-y-4">
          <WalletProfitabilityPanel companyId={companyId} />
        </TabsContent>

        {/* ─── Alertas Tab ────────────────────────────── */}
        <TabsContent value="alertas" className="space-y-4">
          <OperationalAlertsPanel companyId={companyId} filterCategory="crm" showSummary={true} maxAlerts={20} />
          <OperationalAlertsPanel companyId={companyId} filterCategory="comercial" showSummary={false} maxAlerts={10} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {activityDialogOpen && (
        <ActivityDialog
          open={activityDialogOpen}
          onOpenChange={setActivityDialogOpen}
          companyId={companyId}
          sellers={sellers}
          defaultCustomerId={activityDialogDefaults.customerId}
          defaultSellerId={activityDialogDefaults.sellerId}
        />
      )}
      {oppDialogOpen && (
        <OpportunityDialog open={oppDialogOpen} onOpenChange={setOppDialogOpen} companyId={companyId} sellers={sellers} />
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function MarkDoneButton({ activityId }: { activityId: string }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await updateActivity(activityId, {
        status: "realizada",
        completed_at: new Date().toISOString(),
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
      qc.invalidateQueries({ queryKey: ["crm-overdue"] });
      qc.invalidateQueries({ queryKey: ["crm-agenda"] });
      toast.success("Atividade concluída");
    },
    onError: () => toast.error("Erro ao concluir"),
  });
  return (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      <CheckCircle className="h-3 w-3 mr-1" /> Concluir
    </Button>
  );
}
