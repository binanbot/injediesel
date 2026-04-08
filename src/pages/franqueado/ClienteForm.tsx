import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Search, Users, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchActiveSellers } from "@/services/employeeService";
import { logAuditEvent } from "@/services/auditService";
import { toast } from "sonner";

const EMPTY_FORM = {
  full_name: "",
  cpf: "",
  cnpj: "",
  email: "",
  phone: "",
  whatsapp: "",
  zip_code: "",
  address_line: "",
  address_number: "",
  address_complement: "",
  address_district: "",
  address_city: "",
  address_state: "",
  notes: "",
};

export default function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { company } = useCompany();
  const { can } = usePermissions();
  const isEdit = !!id;

  const canAssignPrimarySeller = can("clientes", "assign_primary_seller");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [tipo, setTipo] = useState<"PF" | "PJ">("PF");
  const [isActive, setIsActive] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [primarySellerId, setPrimarySellerId] = useState<string>("");
  const [originalPrimarySellerId, setOriginalPrimarySellerId] = useState<string>("");

  // Load eligible sellers for primary seller field
  const companyId = company?.id;
  const { data: sellers = [] } = useQuery({
    queryKey: ["active-sellers-for-wallet", companyId],
    queryFn: () => fetchActiveSellers(companyId!),
    enabled: !!companyId && canAssignPrimarySeller,
  });

  useEffect(() => {
    if (isEdit) loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const d = data as any;
      setForm({
        full_name: d.full_name || "",
        cpf: d.cpf || "",
        cnpj: d.cnpj || "",
        email: d.email || "",
        phone: d.phone || "",
        whatsapp: d.whatsapp || "",
        zip_code: d.zip_code || "",
        address_line: d.address_line || "",
        address_number: d.address_number || "",
        address_complement: d.address_complement || "",
        address_district: d.address_district || "",
        address_city: d.address_city || "",
        address_state: d.address_state || "",
        notes: d.notes || "",
      });
      setTipo(d.type === "PJ" ? "PJ" : "PF");
      setIsActive(d.is_active ?? true);
      setPrimarySellerId(d.primary_seller_id || "");
      setOriginalPrimarySellerId(d.primary_seller_id || "");
    } catch {
      toast.error("Cliente não encontrado ou sem permissão");
      navigate("/franqueado/clientes");
    } finally {
      setIsLoading(false);
    }
  };

  // ── ViaCEP ──
  const fetchCep = useCallback(async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setForm((f) => ({
        ...f,
        address_line: data.logradouro || f.address_line,
        address_district: data.bairro || f.address_district,
        address_city: data.localidade || f.address_city,
        address_state: data.uf || f.address_state,
        address_complement: data.complemento || f.address_complement,
      }));
      toast.success("Endereço preenchido via CEP");
    } catch {
      toast.error("Erro ao consultar CEP");
    } finally {
      setIsFetchingCep(false);
    }
  }, []);

  const handleCepBlur = () => {
    if (form.zip_code.replace(/\D/g, "").length === 8) {
      fetchCep(form.zip_code);
    }
  };

  // ── Validation ──
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = tipo === "PF" ? "Nome é obrigatório" : "Razão social é obrigatória";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "E-mail inválido";
    if (tipo === "PF" && form.cpf && form.cpf.replace(/\D/g, "").length !== 11) errs.cpf = "CPF deve ter 11 dígitos";
    if (tipo === "PJ" && form.cnpj && form.cnpj.replace(/\D/g, "").length !== 14) errs.cnpj = "CNPJ deve ter 14 dígitos";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload: any = {
        type: tipo,
        full_name: form.full_name.trim(),
        cpf: tipo === "PF" ? form.cpf.trim() || null : null,
        cnpj: tipo === "PJ" ? form.cnpj.trim() || null : null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        zip_code: form.zip_code.trim() || null,
        address_line: form.address_line.trim() || null,
        address_number: form.address_number.trim() || null,
        address_complement: form.address_complement.trim() || null,
        address_district: form.address_district.trim() || null,
        address_city: form.address_city.trim() || null,
        address_state: form.address_state.trim() || null,
        notes: form.notes.trim() || null,
        is_active: isActive,
      };

      // Include primary_seller_id if user has permission
      if (canAssignPrimarySeller) {
        payload.primary_seller_id = primarySellerId || null;
      }

      if (isEdit) {
        const { error } = await supabase.from("customers").update(payload).eq("id", id!);
        if (error) throw error;

        // Audit primary seller change
        if (canAssignPrimarySeller && primarySellerId !== originalPrimarySellerId) {
          await logAuditEvent({
            action: "customer.primary_seller_changed",
            module: "comercial",
            companyId: companyId || undefined,
            targetType: "customer",
            targetId: id!,
            details: {
              previous_seller_id: originalPrimarySellerId || null,
              new_seller_id: primarySellerId || null,
              customer_name: form.full_name.trim(),
            },
          });
        }

        toast.success("Cliente atualizado!");
        navigate(`/franqueado/clientes/${id}`);
      } else {
        if (!user) return;
        const { data: unitId } = await supabase.rpc("get_user_unit_id", { _user_id: user.id });
        if (!unitId) { toast.error("Unidade não encontrada"); setIsSaving(false); return; }
        payload.unit_id = unitId;
        const { data: newCustomer, error } = await supabase.from("customers").insert(payload).select("id").single();
        if (error) throw error;

        // Audit initial primary seller assignment
        if (canAssignPrimarySeller && primarySellerId) {
          await logAuditEvent({
            action: "customer.primary_seller_changed",
            module: "comercial",
            companyId: companyId || undefined,
            targetType: "customer",
            targetId: (newCustomer as any)?.id || "",
            details: {
              previous_seller_id: null,
              new_seller_id: primarySellerId,
              customer_name: form.full_name.trim(),
            },
          });
        }

        toast.success("Cliente cadastrado!");
        navigate("/franqueado/clientes");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(isEdit ? "Erro ao atualizar" : "Erro ao cadastrar");
    } finally {
      setIsSaving(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  // Current seller name for display
  const currentSellerName = useMemo(() => {
    if (!primarySellerId) return null;
    const match = sellers.find((s) => s.seller_profile?.id === primarySellerId);
    return match?.display_name || null;
  }, [primarySellerId, sellers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Editar Cliente" : "Novo Cliente"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Atualize os dados do cliente" : "Preencha os dados para cadastrar"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo + Status */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <Label>Tipo de pessoa</Label>
                <RadioGroup
                  value={tipo}
                  onValueChange={(v) => setTipo(v as "PF" | "PJ")}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="PF" id="pf" />
                    <Label htmlFor="pf" className="cursor-pointer">Pessoa Física</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="PJ" id="pj" />
                    <Label htmlFor="pj" className="cursor-pointer">Pessoa Jurídica</Label>
                  </div>
                </RadioGroup>
              </div>

              {isEdit && (
                <div className="flex items-center gap-3">
                  <Label htmlFor="is_active">Status</Label>
                  <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm text-muted-foreground">
                    {isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="full_name">
                {tipo === "PF" ? "Nome completo *" : "Razão social *"}
              </Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder={tipo === "PF" ? "Nome completo do cliente" : "Razão social da empresa"}
                className={errors.full_name ? "border-destructive" : ""}
              />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tipo === "PF" ? (
                <div className="space-y-1">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={form.cpf}
                    onChange={(e) => update("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    className={errors.cpf ? "border-destructive" : ""}
                  />
                  {errors.cpf && <p className="text-xs text-destructive">{errors.cpf}</p>}
                </div>
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={form.cnpj}
                    onChange={(e) => update("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className={errors.cnpj ? "border-destructive" : ""}
                  />
                  {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="email@exemplo.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Contato</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carteira Comercial */}
        {canAssignPrimarySeller && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Carteira Comercial
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">
                        O vendedor principal é o responsável comercial deste cliente.
                        Ele será sugerido automaticamente ao lançar vendas manuais.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="primary_seller">Vendedor principal</Label>
                <Select
                  value={primarySellerId || "none"}
                  onValueChange={(v) => setPrimarySellerId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum vendedor vinculado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {sellers.map((s) => (
                      <SelectItem key={s.seller_profile!.id} value={s.seller_profile!.id}>
                        {s.display_name || "Sem nome"} ({s.seller_profile!.seller_mode === "ecu" ? "ECU" : s.seller_profile!.seller_mode === "parts" ? "Peças" : "Misto"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Este vendedor será sugerido automaticamente nas vendas manuais deste cliente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endereço */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* CEP + botão buscar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="zip_code">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="zip_code"
                    value={form.zip_code}
                    onChange={(e) => update("zip_code", e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isFetchingCep || form.zip_code.replace(/\D/g, "").length !== 8}
                    onClick={() => fetchCep(form.zip_code)}
                  >
                    {isFetchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="address_line">Rua / Logradouro</Label>
                <Input id="address_line" value={form.address_line} onChange={(e) => update("address_line", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_number">Número</Label>
                <Input id="address_number" value={form.address_number} onChange={(e) => update("address_number", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input id="address_complement" value={form.address_complement} onChange={(e) => update("address_complement", e.target.value)} placeholder="Apto, sala, bloco..." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_district">Bairro</Label>
                <Input id="address_district" value={form.address_district} onChange={(e) => update("address_district", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="address_city">Cidade</Label>
                <Input id="address_city" value={form.address_city} onChange={(e) => update("address_city", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address_state">UF</Label>
                <Input id="address_state" value={form.address_state} onChange={(e) => update("address_state", e.target.value)} placeholder="SP" maxLength={2} className="uppercase" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              placeholder="Anotações internas sobre o cliente..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" variant="hero" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
