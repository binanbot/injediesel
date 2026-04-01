import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  "Veículo de Passeio",
  "Pick-up",
  "Truck",
  "Ônibus",
  "Motos",
  "Máquinas Agrícolas",
  "Máquinas Pesadas",
  "Jet Ski / Lancha",
  "Outros",
];

const FUEL_TYPES = ["Gasolina", "Etanol", "Flex", "Diesel", "GNV", "Elétrico", "Híbrido"];
const TRANSMISSION_TYPES = ["Manual", "Automático", "CVT", "Automatizado"];

export default function VeiculoForm() {
  const navigate = useNavigate();
  const { id: customerId, vehicleId } = useParams<{ id: string; vehicleId: string }>();
  const isEditing = !!vehicleId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const [form, setForm] = useState({
    plate: "",
    brand: "",
    model: "",
    year: "",
    category: "",
    engine: "",
  });

  useEffect(() => {
    loadCustomer();
    if (isEditing) loadVehicle();
  }, [customerId, vehicleId]);

  const loadCustomer = async () => {
    const { data } = await supabase
      .from("customers")
      .select("full_name")
      .eq("id", customerId!)
      .single();
    if (data) setCustomerName(data.full_name);
  };

  const loadVehicle = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId!)
      .single();

    if (error || !data) {
      toast.error("Veículo não encontrado");
      navigate(`/franqueado/clientes/${customerId}`);
      return;
    }

    setForm({
      plate: data.plate || "",
      brand: data.brand || "",
      model: data.model || "",
      year: data.year || "",
      category: data.category || "",
      engine: data.engine || "",
    });
    setIsLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.plate && !form.brand && !form.model) {
      toast.error("Informe pelo menos a placa ou marca/modelo do veículo");
      return;
    }

    setIsSaving(true);

    try {
      // Get user unit_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: unitId } = await supabase.rpc("get_user_unit_id", { _user_id: user.id });
      if (!unitId) throw new Error("Unidade não encontrada");

      // Verify customer belongs to this unit
      const { data: customer } = await supabase
        .from("customers")
        .select("unit_id")
        .eq("id", customerId!)
        .single();

      if (!customer || customer.unit_id !== unitId) {
        toast.error("Cliente não pertence à sua unidade");
        return;
      }

      const payload = {
        plate: form.plate || null,
        brand: form.brand || null,
        model: form.model || null,
        year: form.year || null,
        category: form.category || null,
        engine: form.engine || null,
        customer_id: customerId!,
        unit_id: unitId,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", vehicleId!);
        if (error) throw error;
        toast.success("Veículo atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert(payload);
        if (error) throw error;
        toast.success("Veículo cadastrado com sucesso");
      }

      navigate(`/franqueado/clientes/${customerId}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar veículo");
    } finally {
      setIsSaving(false);
    }
  };

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
        <Button variant="ghost" size="icon" onClick={() => navigate(`/franqueado/clientes/${customerId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Veículo" : "Novo Veículo"}
          </h1>
          {customerName && (
            <p className="text-sm text-muted-foreground">Cliente: {customerName}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Dados do Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Placa</Label>
                <Input
                  placeholder="ABC-1234"
                  value={form.plate}
                  onChange={(e) => handleChange("plate", e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  placeholder="Ex: Volkswagen"
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  placeholder="Ex: Gol 1.6"
                  value={form.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  placeholder="Ex: 2023/2024"
                  value={form.year}
                  onChange={(e) => handleChange("year", e.target.value)}
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <Label>Motor / Cilindrada</Label>
                <Input
                  placeholder="Ex: 1.0 TSI 116cv"
                  value={form.engine}
                  onChange={(e) => handleChange("engine", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/franqueado/clientes/${customerId}`)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditing ? "Salvar Alterações" : "Cadastrar Veículo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
