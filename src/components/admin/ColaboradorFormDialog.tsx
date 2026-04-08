import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDepartments,
  fetchJobPositions,
  upsertEmployee,
  upsertSellerProfile,
  deleteSellerProfile,
  type EmployeeRow,
} from "@/services/employeeService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart } from "lucide-react";
import { logAuditEvent } from "@/services/auditService";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRow | null;
  defaultCompanyId?: string;
  isGlobal: boolean;
}

export function ColaboradorFormDialog({ open, onOpenChange, employee, defaultCompanyId, isGlobal }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!employee;

  // Form state
  const [companyId, setCompanyId] = useState(defaultCompanyId || "");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [positionId, setPositionId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [hiredAt, setHiredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [userId, setUserId] = useState("");

  // Seller state
  const [isSeller, setIsSeller] = useState(false);
  const [sellerMode, setSellerMode] = useState<string>("both");
  const [commissionType, setCommissionType] = useState<string>("percentage");
  const [commissionValue, setCommissionValue] = useState<number>(0);
  const [canSellEcu, setCanSellEcu] = useState(true);
  const [canSellParts, setCanSellParts] = useState(true);
  const [sellerActive, setSellerActive] = useState(true);
  const [targetMonthly, setTargetMonthly] = useState<number>(0);
  const [maxDiscountPct, setMaxDiscountPct] = useState<number>(0);
  const [salesChannelMode, setSalesChannelMode] = useState<string>("both");
  const [canSellServices, setCanSellServices] = useState(true);
  const [commissionEnabled, setCommissionEnabled] = useState(true);
  const [targetEnabled, setTargetEnabled] = useState(true);

  // Populate on edit
  useEffect(() => {
    if (employee) {
      setCompanyId(employee.company_id);
      setDisplayName(employee.display_name || "");
      setPhone(employee.phone || "");
      setDepartmentId(employee.department_id || "");
      setPositionId(employee.job_position_id || "");
      setIsActive(employee.is_active);
      setHiredAt(employee.hired_at || "");
      setNotes(employee.notes || "");
      setUserId(employee.user_id);

      if (employee.seller_profile) {
        setIsSeller(true);
        setSellerMode(employee.seller_profile.seller_mode);
        setCommissionType(employee.seller_profile.commission_type);
        setCommissionValue(employee.seller_profile.commission_value);
        setCanSellEcu(employee.seller_profile.can_sell_ecu);
        setCanSellParts(employee.seller_profile.can_sell_parts);
        setSellerActive(employee.seller_profile.is_active);
        setTargetMonthly(employee.seller_profile.target_monthly || 0);
        setMaxDiscountPct(employee.seller_profile.max_discount_pct || 0);
        setSalesChannelMode(employee.seller_profile.sales_channel_mode || "both");
        setCanSellServices(employee.seller_profile.can_sell_services ?? true);
        setCommissionEnabled(employee.seller_profile.commission_enabled ?? true);
        setTargetEnabled(employee.seller_profile.target_enabled ?? true);
      } else {
        setIsSeller(false);
        resetSellerFields();
      }
    } else {
      resetForm();
    }
  }, [employee, open]);

  const resetSellerFields = () => {
    setSellerMode("both");
    setCommissionType("percentage");
    setCommissionValue(0);
    setCanSellEcu(true);
    setCanSellParts(true);
    setSellerActive(true);
    setTargetMonthly(0);
    setMaxDiscountPct(0);
    setSalesChannelMode("both");
    setCanSellServices(true);
    setCommissionEnabled(true);
    setTargetEnabled(true);
  };

  const resetForm = () => {
    setCompanyId(defaultCompanyId || "");
    setDisplayName("");
    setPhone("");
    setDepartmentId("");
    setPositionId("");
    setIsActive(true);
    setHiredAt("");
    setNotes("");
    setUserId("");
    setIsSeller(false);
    resetSellerFields();
  };

  // Companies for global view
  const { data: companies } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
    enabled: isGlobal,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", companyId],
    queryFn: () => fetchDepartments(companyId || undefined),
    enabled: !!companyId,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions", companyId, departmentId],
    queryFn: () => fetchJobPositions(companyId || undefined, departmentId || undefined),
    enabled: !!companyId,
  });

  // Users search (simplified - uses user_roles to find users in the company)
  const { data: availableUsers = [] } = useQuery({
    queryKey: ["company-users", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("company_id", companyId);
      return (data || []).map((r) => r.user_id);
    },
    enabled: !!companyId && !isEditing,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !userId) throw new Error("Empresa e usuário são obrigatórios");

      const empId = await upsertEmployee({
        id: employee?.id,
        user_id: userId,
        company_id: companyId,
        department_id: departmentId || null,
        job_position_id: positionId || null,
        display_name: displayName.trim(),
        phone: phone.trim(),
        is_active: isActive,
        hired_at: hiredAt || null,
        notes: notes.trim() || undefined,
      });

      // Audit: employee created/updated
      logAuditEvent({
        action: isEditing ? "employee.updated" : "employee.created",
        module: "colaboradores",
        companyId,
        targetType: "employee_profile",
        targetId: empId,
        details: { display_name: displayName.trim(), is_active: isActive },
      });

      // Handle seller profile
      if (isSeller) {
        const prevSeller = employee?.seller_profile;
        await upsertSellerProfile({
          id: prevSeller?.id,
          employee_profile_id: empId,
          seller_mode: sellerMode,
          commission_type: commissionType,
          commission_value: commissionValue,
          can_sell_ecu: canSellEcu,
          can_sell_parts: canSellParts,
          is_active: sellerActive,
          target_monthly: targetMonthly || null,
          max_discount_pct: maxDiscountPct,
          sales_channel_mode: salesChannelMode,
          can_sell_services: canSellServices,
          commission_enabled: commissionEnabled,
          target_enabled: targetEnabled,
        });

        // Audit seller-specific changes
        if (prevSeller) {
          if (prevSeller.is_active !== sellerActive) {
            logAuditEvent({
              action: sellerActive ? "seller.activated" : "seller.deactivated",
              module: "vendedores",
              companyId,
              targetType: "seller_profile",
              targetId: prevSeller.id,
              details: { display_name: displayName.trim() },
            });
          }
          if (prevSeller.commission_value !== commissionValue || prevSeller.commission_type !== commissionType) {
            logAuditEvent({
              action: "seller.commission_changed",
              module: "vendedores",
              companyId,
              targetType: "seller_profile",
              targetId: prevSeller.id,
              details: {
                previous: { type: prevSeller.commission_type, value: prevSeller.commission_value },
                current: { type: commissionType, value: commissionValue },
              },
            });
          }
          if (prevSeller.seller_mode !== sellerMode) {
            logAuditEvent({
              action: "seller.mode_changed",
              module: "vendedores",
              companyId,
              targetType: "seller_profile",
              targetId: prevSeller.id,
              details: { previous: prevSeller.seller_mode, current: sellerMode },
            });
          }
          // Audit commercial access flags
          const flagChanges: Record<string, { prev: any; curr: any }> = {};
          if (prevSeller.commission_enabled !== commissionEnabled) flagChanges.commission_enabled = { prev: prevSeller.commission_enabled, curr: commissionEnabled };
          if (prevSeller.target_enabled !== targetEnabled) flagChanges.target_enabled = { prev: prevSeller.target_enabled, curr: targetEnabled };
          if (prevSeller.can_sell_services !== canSellServices) flagChanges.can_sell_services = { prev: prevSeller.can_sell_services, curr: canSellServices };
          if (prevSeller.sales_channel_mode !== salesChannelMode) flagChanges.sales_channel_mode = { prev: prevSeller.sales_channel_mode, curr: salesChannelMode };
          if (Object.keys(flagChanges).length > 0) {
            logAuditEvent({
              action: "seller.commercial_access_changed",
              module: "vendedores",
              companyId,
              targetType: "seller_profile",
              targetId: prevSeller.id,
              details: { display_name: displayName.trim(), changes: flagChanges },
            });
          }
        } else {
          logAuditEvent({
            action: "seller.activated",
            module: "vendedores",
            companyId,
            targetType: "seller_profile",
            targetId: empId,
            details: { display_name: displayName.trim(), seller_mode: sellerMode },
          });
        }
      } else if (employee?.seller_profile) {
        await deleteSellerProfile(empId);
        logAuditEvent({
          action: "seller.deactivated",
          module: "vendedores",
          companyId,
          targetType: "seller_profile",
          targetId: employee.seller_profile.id,
          details: { display_name: displayName.trim(), reason: "seller_removed" },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(isEditing ? "Colaborador atualizado" : "Colaborador cadastrado");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar colaborador");
    },
  });

  // Sync seller mode with flags
  useEffect(() => {
    if (sellerMode === "ecu") { setCanSellEcu(true); setCanSellParts(false); }
    else if (sellerMode === "parts") { setCanSellEcu(false); setCanSellParts(true); }
    else { setCanSellEcu(true); setCanSellParts(true); }
  }, [sellerMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Company selector (global only) */}
          {isGlobal && (
            <div className="space-y-1.5">
              <Label>Empresa *</Label>
              <Select value={companyId} onValueChange={setCompanyId} disabled={isEditing}>
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {(companies || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* User ID - simplified input */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label>User ID (auth) *</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="UUID do usuário no sistema de autenticação"
              />
              <p className="text-xs text-muted-foreground">
                O usuário já deve existir no sistema de autenticação.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nome do colaborador" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Departamento</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Select value={positionId} onValueChange={setPositionId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data de contratação</Label>
              <Input type="date" value={hiredAt} onChange={(e) => setHiredAt(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Ativo</Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {/* Acesso Comercial section */}
          <Separator />
          <div className="flex items-center gap-3">
            <Switch checked={isSeller} onCheckedChange={setIsSeller} />
            <Label className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Acesso Comercial
            </Label>
            {isSeller && (
              <Badge variant="secondary" className="text-xs">Habilitado</Badge>
            )}
          </div>

          {isSeller && (
            <div className="space-y-4 pl-2 border-l-2 border-primary/20">
              {/* Configurações gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Canal de venda</Label>
                  <Select value={salesChannelMode} onValueChange={setSalesChannelMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="counter">Balcão</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={sellerActive} onCheckedChange={setSellerActive} />
                  <Label>Vendedor ativo</Label>
                </div>
              </div>

              {/* O que pode vender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Modalidade de venda</Label>
                  <Select value={sellerMode} onValueChange={setSellerMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecu">Só ECU/Mapa</SelectItem>
                      <SelectItem value="parts">Só Peças</SelectItem>
                      <SelectItem value="both">Misto (ambos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={canSellServices} onCheckedChange={setCanSellServices} />
                  <Label>Pode vender serviços</Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Badge variant={canSellEcu ? "default" : "outline"} className="text-xs">
                  {canSellEcu ? "✓" : "✗"} ECU/Mapa
                </Badge>
                <Badge variant={canSellParts ? "default" : "outline"} className="text-xs">
                  {canSellParts ? "✓" : "✗"} Peças
                </Badge>
                <Badge variant={canSellServices ? "default" : "outline"} className="text-xs">
                  {canSellServices ? "✓" : "✗"} Serviços
                </Badge>
              </div>

              <Separator className="my-2" />

              {/* Participação em metas e comissão */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch checked={targetEnabled} onCheckedChange={setTargetEnabled} />
                  <Label>Participa de metas</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={commissionEnabled} onCheckedChange={setCommissionEnabled} />
                  <Label>Tem direito a comissão</Label>
                </div>
              </div>

              {/* Comissão - condicional */}
              {commissionEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tipo de comissão</Label>
                    <Select value={commissionType} onValueChange={setCommissionType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                        <SelectItem value="tiered">Escalonada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      {commissionType === "percentage" ? "Percentual (%)" : "Valor (R$)"}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={commissionType === "percentage" ? 0.5 : 0.01}
                      value={commissionValue}
                      onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}

              {/* Meta mensal - condicional */}
              {targetEnabled && (
                <div className="space-y-1.5">
                  <Label>Meta mensal (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={targetMonthly}
                    onChange={(e) => setTargetMonthly(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Desconto máximo (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={maxDiscountPct}
                  onChange={(e) => setMaxDiscountPct(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Limite máximo de desconto que este vendedor pode aplicar.</p>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
