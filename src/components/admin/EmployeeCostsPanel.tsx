import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEmployeeCosts,
  upsertEmployeeCost,
  deleteEmployeeCost,
  calcEmployeeTotalMonthlyCost,
  EMPLOYEE_COST_TYPES,
  EMPLOYEE_COST_CATEGORIES,
  type EmployeeCostRow,
} from "@/services/costService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Props {
  employeeProfileId: string;
  companyId: string;
  employeeName?: string;
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function EmployeeCostsPanel({ employeeProfileId, companyId, employeeName }: Props) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeCostRow | null>(null);

  // Form state
  const [costType, setCostType] = useState("salario_base");
  const [costCategory, setCostCategory] = useState("pessoal_fixo");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [notes, setNotes] = useState("");

  const { data: costs = [], isLoading } = useQuery({
    queryKey: ["employee-costs", employeeProfileId],
    queryFn: () => fetchEmployeeCosts(employeeProfileId),
  });

  const totalMonthly = calcEmployeeTotalMonthlyCost(costs);

  const resetForm = () => {
    setCostType("salario_base");
    setCostCategory("pessoal_fixo");
    setLabel("");
    setAmount("");
    setIsRecurring(true);
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setEffectiveUntil("");
    setNotes("");
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (cost: EmployeeCostRow) => {
    setEditing(cost);
    setCostType(cost.cost_type);
    setCostCategory(cost.cost_category);
    setLabel(cost.label || "");
    setAmount(String(cost.amount_brl));
    setIsRecurring(cost.is_recurring);
    setEffectiveFrom(cost.effective_from);
    setEffectiveUntil(cost.effective_until || "");
    setNotes(cost.notes || "");
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertEmployeeCost({
        id: editing?.id,
        employee_profile_id: employeeProfileId,
        company_id: companyId,
        cost_type: costType,
        cost_category: costCategory,
        label: costType === "outro" ? label : null,
        amount_brl: parseFloat(amount) || 0,
        is_recurring: isRecurring,
        effective_from: effectiveFrom,
        effective_until: effectiveUntil || null,
        notes: notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-costs", employeeProfileId] });
      toast.success(editing ? "Custo atualizado" : "Custo adicionado");
      setFormOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployeeCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-costs", employeeProfileId] });
      toast.success("Custo removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getCostTypeLabel = (val: string) =>
    EMPLOYEE_COST_TYPES.find((t) => t.value === val)?.label || val;
  const getCostCatLabel = (val: string) =>
    EMPLOYEE_COST_CATEGORIES.find((c) => c.value === val)?.label || val;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-primary" />
          Custos do Colaborador
          {employeeName && <span className="text-muted-foreground font-normal">— {employeeName}</span>}
        </CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total card */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Custo Mensal Estimado</p>
            <p className="text-lg font-bold text-primary">{fmtBRL(totalMonthly)}</p>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : costs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum custo cadastrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Recorrente</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {getCostTypeLabel(c.cost_type)}
                    {c.cost_type === "outro" && c.label && (
                      <span className="text-muted-foreground ml-1">({c.label})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getCostCatLabel(c.cost_category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{fmtBRL(c.amount_brl)}</TableCell>
                  <TableCell>{c.is_recurring ? "Sim" : "Não"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.effective_from}
                    {c.effective_until ? ` → ${c.effective_until}` : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteMutation.mutate(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Form dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Custo" : "Novo Custo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={costType} onValueChange={setCostType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_COST_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Select value={costCategory} onValueChange={setCostCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_COST_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {costType === "outro" && (
                <div className="space-y-1">
                  <Label>Descrição</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Plano de saúde" />
                </div>
              )}

              <div className="space-y-1">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                <Label>Custo recorrente (mensal)</Label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Vigência início</Label>
                  <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Vigência fim (opcional)</Label>
                  <Input type="date" value={effectiveUntil} onChange={(e) => setEffectiveUntil(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
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
      </CardContent>
    </Card>
  );
}
