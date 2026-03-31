import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export type DeliveryAddress = {
  recipient_name: string;
  company_name: string;
  cnpj: string;
  phone: string;
  email: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

export type FranchiseProfile = {
  id: string;
  unit_name: string;
  company_name: string;
  cnpj: string;
  phone: string;
  email: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  delivery_address?: DeliveryAddress | null;
};

export const emptyAddress: DeliveryAddress = {
  recipient_name: "",
  company_name: "",
  cnpj: "",
  phone: "",
  email: "",
  zip_code: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

export const buildDefaultDeliveryAddress = (profile: FranchiseProfile): DeliveryAddress => ({
  recipient_name: profile.unit_name || "",
  company_name: profile.company_name || "",
  cnpj: profile.cnpj || "",
  phone: profile.phone || "",
  email: profile.email || "",
  zip_code: profile.zip_code || "",
  street: profile.street || "",
  number: profile.number || "",
  complement: profile.complement || "",
  district: profile.district || "",
  city: profile.city || "",
  state: profile.state || "",
});

interface DeliveryAddressFormProps {
  address: DeliveryAddress;
  onChange: (address: DeliveryAddress) => void;
  profile?: FranchiseProfile | null;
  showSaveButton?: boolean;
}

export function DeliveryAddressForm({
  address,
  onChange,
  profile,
  showSaveButton = false,
}: DeliveryAddressFormProps) {
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof DeliveryAddress, value: string) => {
    onChange({ ...address, [field]: value });
  };

  const handleUseProfileAddress = () => {
    if (!profile) return;
    onChange(buildDefaultDeliveryAddress(profile));
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles_franchisees")
        .update({ delivery_address: address as any })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Endereço de entrega salvo com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      toast.error("Não foi possível salvar o endereço.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Endereço de entrega</span>
        </div>
        {profile && (
          <Button variant="ghost" size="sm" onClick={handleUseProfileAddress} className="text-xs gap-1">
            <RotateCcw className="h-3 w-3" />
            Usar endereço do cadastro
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Destinatário</Label>
          <Input placeholder="Nome do responsável" value={address.recipient_name} onChange={(e) => handleChange("recipient_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Razão Social</Label>
          <Input placeholder="Razão social" value={address.company_name} onChange={(e) => handleChange("company_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>CNPJ</Label>
          <Input placeholder="00.000.000/0000-00" value={address.cnpj} onChange={(e) => handleChange("cnpj", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input placeholder="(00) 00000-0000" value={address.phone} onChange={(e) => handleChange("phone", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>E-mail</Label>
          <Input placeholder="email@exemplo.com" value={address.email} onChange={(e) => handleChange("email", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>CEP</Label>
          <Input placeholder="00000-000" value={address.zip_code} onChange={(e) => handleChange("zip_code", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Rua</Label>
          <Input placeholder="Nome da rua" value={address.street} onChange={(e) => handleChange("street", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Número</Label>
          <Input placeholder="Nº" value={address.number} onChange={(e) => handleChange("number", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Complemento</Label>
          <Input placeholder="Apto, bloco, etc." value={address.complement} onChange={(e) => handleChange("complement", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bairro</Label>
          <Input placeholder="Bairro" value={address.district} onChange={(e) => handleChange("district", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input placeholder="Cidade" value={address.city} onChange={(e) => handleChange("city", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>UF</Label>
          <Input placeholder="UF" value={address.state} onChange={(e) => handleChange("state", e.target.value)} />
        </div>
      </div>

      {showSaveButton && (
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Salvando..." : "Salvar endereço de entrega"}
        </Button>
      )}
    </div>
  );
}
