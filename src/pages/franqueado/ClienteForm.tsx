import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tipo, setTipo] = useState<"pf" | "pj">("pf");
  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    cnpj: "",
    email: "",
    phone: "",
    whatsapp: "",
    address_line: "",
    address_number: "",
    address_complement: "",
    address_district: "",
    address_city: "",
    address_state: "",
    zip_code: "",
    notes: "",
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
      setForm({
        full_name: data.full_name || "",
        cpf: data.cpf || "",
        cnpj: data.cnpj || "",
        email: data.email || "",
        phone: data.phone || "",
        whatsapp: (data as any).whatsapp || "",
        address_line: data.address_line || "",
        address_number: (data as any).address_number || "",
        address_complement: (data as any).address_complement || "",
        address_district: (data as any).address_district || "",
        address_city: data.address_city || "",
        address_state: data.address_state || "",
        zip_code: (data as any).zip_code || "",
        notes: (data as any).notes || "",
      });
      setTipo((data as any).type === "PJ" ? "pj" : "pf");
    } catch {
      toast.error("Erro ao carregar cliente");
      navigate("/franqueado/clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const getUnitId = async (): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase.rpc("get_user_unit_id", { _user_id: user.id });
    return data as string | null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        type: tipo === "pj" ? "PJ" : "PF",
        full_name: form.full_name.trim(),
        cpf: tipo === "pf" ? form.cpf.trim() || null : null,
        cnpj: tipo === "pj" ? form.cnpj.trim() || null : null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        address_line: form.address_line.trim() || null,
        address_number: form.address_number.trim() || null,
        address_complement: form.address_complement.trim() || null,
        address_district: form.address_district.trim() || null,
        address_city: form.address_city.trim() || null,
        address_state: form.address_state.trim() || null,
        zip_code: form.zip_code.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (isEdit) {
        const { error } = await supabase.from("customers").update(payload).eq("id", id!);
        if (error) throw error;
        toast.success("Cliente atualizado!");
        navigate(`/franqueado/clientes/${id}`);
      } else {
        const unitId = await getUnitId();
        if (!unitId) { toast.error("Unidade não encontrada"); return; }
        payload.unit_id = unitId;
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
        toast.success("Cliente cadastrado!");
        navigate("/franqueado/clientes");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(isEdit ? "Erro ao atualizar cliente" : "Erro ao cadastrar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Editar Cliente" : "Novo Cliente"}</h1>
          <p className="text-muted-foreground">{isEdit ? "Atualize os dados do cliente" : "Preencha os dados para cadastrar"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo PF/PJ */}
            <div className="space-y-2">
              <Label>Tipo de pessoa</Label>
              <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as "pf" | "pj")} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pf" id="pf" />
                  <Label htmlFor="pf" className="cursor-pointer">Pessoa Física</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pj" id="pj" />
                  <Label htmlFor="pj" className="cursor-pointer">Pessoa Jurídica</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
            </div>

            {/* Documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tipo === "pf" ? (
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
            </div>

            {/* Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(00) 0000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line">Rua / Logradouro</Label>
                <Input id="address_line" value={form.address_line} onChange={(e) => update("address_line", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_number">Número</Label>
                <Input id="address_number" value={form.address_number} onChange={(e) => update("address_number", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input id="address_complement" value={form.address_complement} onChange={(e) => update("address_complement", e.target.value)} placeholder="Apto, sala, bloco..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_district">Bairro</Label>
                <Input id="address_district" value={form.address_district} onChange={(e) => update("address_district", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade</Label>
                <Input id="address_city" value={form.address_city} onChange={(e) => update("address_city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_state">Estado</Label>
                <Input id="address_state" value={form.address_state} onChange={(e) => update("address_state", e.target.value)} placeholder="SP" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input id="zip_code" value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} placeholder="00000-000" />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Anotações internas sobre o cliente..." />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" variant="hero" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEdit ? "Salvar alterações" : "Cadastrar cliente"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
