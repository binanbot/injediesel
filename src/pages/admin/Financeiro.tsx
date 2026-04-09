import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import {
  fetchFinancialEntries,
  createFinancialEntry,
  updateFinancialEntry,
  deleteFinancialEntry,
  approveFinancialEntry,
  markEntryAsPaid,
  cancelFinancialEntry,
  calcFinancialSummary,
  fetchClosingPeriods,
  closeMonth,
  reopenMonth,
  ENTRY_TYPES,
  ENTRY_STATUSES,
  FINANCIAL_CATEGORIES,
  SUBCATEGORY_SUGGESTIONS,
  getCategoryLabel,
  getEntryTypeLabel,
  getStatusLabel,
  getStatusColor,
  getCategoriesForType,
  type FinancialEntryRow,
} from "@/services/financialService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import {
  Plus, Search, DollarSign, TrendingUp, TrendingDown, Activity,
  Pencil, Trash2, Filter, Lock, Unlock, CheckCircle, XCircle, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { logAuditEvent } from "@/services/auditService";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Closing Panel ───────────────────────────────────────────

function ClosingPanel({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const currentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data: periods = [] } = useQuery({
    queryKey: ["financial-closing", companyId],
    queryFn: () => fetchClosingPeriods(companyId),
    enabled: !!companyId,
  });

  const currentPeriod = periods.find(p => p.reference_month === currentMonth);
  const isClosed = currentPeriod?.status === "fechado";

  const closeMut = useMutation({
    mutationFn: () => closeMonth(companyId, currentMonth, user?.id || ""),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial-closing"] });
      logAuditEvent({
        action: "financial.month_closed" as any,
        module: "financeiro" as any,
        target_type: "financial_closing_periods",
        target_id: currentMonth,
        company_id: companyId,
        details: { reference_month: currentMonth },
      });
      toast.success("Mês fechado com sucesso");
    },
  });

  const reopenMut = useMutation({
    mutationFn: () => reopenMonth(companyId, currentMonth),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial-closing"] });
      logAuditEvent({
        action: "financial.month_reopened" as any,
        module: "financeiro" as any,
        target_type: "financial_closing_periods",
        target_id: currentMonth,
        company_id: companyId,
        details: { reference_month: currentMonth },
      });
      toast.success("Mês reaberto");
    },
  });

  return (
    <div className="flex items-center gap-3">
      <Badge variant={isClosed ? "destructive" : "success"} className="gap-1">
        {isClosed ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        {format(new Date(currentMonth), "MMM yyyy")}: {isClosed ? "Fechado" : "Aberto"}
      </Badge>
      <PermissionGuard module="financeiro" action="approve">
        {isClosed ? (
          <Button variant="outline" size="sm" onClick={() => reopenMut.mutate()} disabled={reopenMut.isPending}>
            <Unlock className="h-3 w-3 mr-1" /> Reabrir
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>
            <Lock className="h-3 w-3 mr-1" /> Fechar Mês
          </Button>
        )}
      </PermissionGuard>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────

export default function Financeiro() {
  const { user } = useAuth();
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const companyId = company?.id || "";

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const now = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"));

  // Form
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialEntryRow | null>(null);
  const [fEntryType, setFEntryType] = useState("despesa");
  const [fCategory, setFCategory] = useState("administrativo");
  const [fSubcategory, setFSubcategory] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fDate, setFDate] = useState(format(now, "yyyy-MM-dd"));
  const [fCostCenter, setFCostCenter] = useState("");
  const [fIsRecurring, setFIsRecurring] = useState(false);
  const [fStatus, setFStatus] = useState("lancado");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["financial-entries", companyId, filterType, filterCategory, filterStatus, startDate, endDate],
    queryFn: () =>
      fetchFinancialEntries({
        companyId,
        entryType: filterType !== "all" ? filterType : undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        startDate,
        endDate,
      }),
    enabled: !!companyId,
  });

  const filtered = useMemo(() => {
    if (!search) return entries;
    const s = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.description?.toLowerCase().includes(s) ||
        e.category?.toLowerCase().includes(s) ||
        e.subcategory?.toLowerCase().includes(s)
    );
  }, [entries, search]);

  const summary = useMemo(() => calcFinancialSummary(filtered), [filtered]);

  const resetForm = () => {
    setEditing(null);
    setFEntryType("despesa");
    setFCategory("administrativo");
    setFSubcategory("");
    setFDescription("");
    setFAmount("");
    setFDate(format(now, "yyyy-MM-dd"));
    setFCostCenter("");
    setFIsRecurring(false);
    setFStatus("lancado");
  };

  const openNew = () => { resetForm(); setFormOpen(true); };

  const openEdit = (e: FinancialEntryRow) => {
    setEditing(e);
    setFEntryType(e.entry_type);
    setFCategory(e.category);
    setFSubcategory(e.subcategory || "");
    setFDescription(e.description || "");
    setFAmount(String(e.amount));
    setFDate(e.competency_date);
    setFCostCenter(e.cost_center || "");
    setFIsRecurring(e.is_recurring);
    setFStatus(e.status || "lancado");
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(fAmount) || 0;
      if (amount <= 0) throw new Error("Valor deve ser maior que zero");

      if (editing) {
        await updateFinancialEntry(editing.id, {
          entry_type: fEntryType,
          category: fCategory,
          subcategory: fSubcategory || null,
          description: fDescription || null,
          amount,
          competency_date: fDate,
          cost_center: fCostCenter || null,
          is_recurring: fIsRecurring,
          status: fStatus,
        });
      } else {
        await createFinancialEntry({
          company_id: companyId,
          entry_type: fEntryType,
          category: fCategory,
          subcategory: fSubcategory || null,
          description: fDescription || null,
          amount,
          competency_date: fDate,
          cost_center: fCostCenter || null,
          is_recurring: fIsRecurring,
          created_by: user?.id || null,
          scope: "empresa",
          status: fStatus,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success(editing ? "Lançamento atualizado" : "Lançamento criado");
      setFormOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFinancialEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Lançamento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveFinancialEntry(id, user?.id || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Lançamento aprovado");
    },
  });

  const paidMut = useMutation({
    mutationFn: markEntryAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Marcado como pago");
    },
  });

  const cancelMut = useMutation({
    mutationFn: cancelFinancialEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Lançamento cancelado");
    },
  });

  const entryTypeColor = (type: string) => {
    if (type === "receita") return "text-emerald-400";
    if (type === "despesa") return "text-rose-400";
    return "text-amber-400";
  };

  const availableCategories = fEntryType ? getCategoriesForType(fEntryType) : FINANCIAL_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Lançamentos de entradas e despesas</p>
        </div>
        <div className="flex items-center gap-3">
          <ClosingPanel companyId={companyId} />
          <PermissionGuard module="financeiro" action="create">
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Novo Lançamento
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Receitas</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">{fmtBRL(summary.total_receitas)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              <span className="text-xs text-muted-foreground">Despesas</span>
            </div>
            <p className="text-lg font-bold text-rose-400">{fmtBRL(summary.total_despesas)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Ajustes</span>
            </div>
            <p className="text-lg font-bold text-amber-400">{fmtBRL(summary.total_ajustes)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`h-4 w-4 ${summary.saldo >= 0 ? "text-emerald-400" : "text-rose-400"}`} />
              <span className="text-xs text-muted-foreground">Saldo</span>
            </div>
            <p className={`text-lg font-bold ${summary.saldo >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {fmtBRL(summary.saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Descrição, categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-[130px]">
              <Label className="text-xs">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ENTRY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Label className="text-xs">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {FINANCIAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[130px]">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ENTRY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[130px]">
              <Label className="text-xs">De</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="w-[130px]">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Lançamentos ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum lançamento encontrado</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id} className={e.status === "cancelado" ? "opacity-50" : ""}>
                      <TableCell className="text-xs whitespace-nowrap">{e.competency_date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${entryTypeColor(e.entry_type)}`}>
                          {getEntryTypeLabel(e.entry_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{getCategoryLabel(e.category)}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {e.description || e.subcategory || "—"}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${entryTypeColor(e.entry_type)}`}>
                        {fmtBRL(e.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(e.status)}`}>
                          {getStatusLabel(e.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {e.status === "lancado" && (
                            <PermissionGuard module="financeiro" action="approve">
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Aprovar" onClick={() => approveMut.mutate(e.id)}>
                                <CheckCircle className="h-3 w-3 text-emerald-400" />
                              </Button>
                            </PermissionGuard>
                          )}
                          {e.status === "aprovado" && (
                            <PermissionGuard module="financeiro" action="approve">
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Marcar pago" onClick={() => paidMut.mutate(e.id)}>
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              </Button>
                            </PermissionGuard>
                          )}
                          {e.status !== "cancelado" && e.status !== "pago" && (
                            <>
                              <PermissionGuard module="financeiro" action="edit">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard module="financeiro" action="delete">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => cancelMut.mutate(e.id)}>
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={fEntryType} onValueChange={(v) => { setFEntryType(v); setFCategory(getCategoriesForType(v)[0]?.value || ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTRY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={fCategory} onValueChange={setFCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subcategoria</Label>
                <Input
                  value={fSubcategory}
                  onChange={(e) => setFSubcategory(e.target.value)}
                  placeholder="Ex: Combustível..."
                  list="subcategory-suggestions"
                />
                <datalist id="subcategory-suggestions">
                  {SUBCATEGORY_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={fStatus} onValueChange={setFStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="lancado">Lançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={fAmount}
                onChange={(e) => setFAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Data de competência</Label>
                <Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Centro de custo</Label>
                <Input
                  value={fCostCenter}
                  onChange={(e) => setFCostCenter(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea
                value={fDescription}
                onChange={(e) => setFDescription(e.target.value)}
                rows={2}
                placeholder="Detalhes do lançamento..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={fIsRecurring} onCheckedChange={setFIsRecurring} />
              <Label>Lançamento recorrente</Label>
            </div>

            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
