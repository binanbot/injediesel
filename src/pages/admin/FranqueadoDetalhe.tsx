import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, User, Building, FileText, History, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CitiesChipsInput } from "@/components/admin/CitiesChipsInput";

interface ServiceArea {
  country: string;
  state: string;
  city: string;
  city_id: string;
}

interface FranchiseeProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  cpf: string | null;
  cnpj: string | null;
  start_date: string | null;
  equipment_type: string | null;
  is_prepaid: boolean;
  rental_value_brl: number | null;
  allow_manual_credits: boolean;
  kess_serial: string | null;
  kess_expires_at: string | null;
  ktag_serial: string | null;
  ktag_expires_at: string | null;
  legacy_user_login: string | null;
  legacy_source_user_id: string | null;
  legacy_role: string | null;
  legacy_user_registered_at: string | null;
  requires_password_reset: boolean;
  contract_type: string | null;
  contract_expiration_date: string | null;
  created_at: string;
  updated_at: string;
  service_areas: ServiceArea[];
}

export default function FranqueadoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FranchiseeProfile | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles_franchisees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Parse service_areas from JSONB
      const rawAreas = data?.service_areas;
      const areas: ServiceArea[] = Array.isArray(rawAreas) 
        ? rawAreas.map((a: unknown) => {
            const area = a as Record<string, unknown>;
            return {
              country: String(area.country || ""),
              state: String(area.state || ""),
              city: String(area.city || ""),
              city_id: String(area.city_id || ""),
            };
          })
        : [];
      setServiceAreas(areas);
      
      // Set profile without service_areas to avoid type issues
      setProfile({
        ...data,
        service_areas: areas,
      } as FranchiseeProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles_franchisees")
        .update({
          display_name: profile.display_name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          cpf: profile.cpf,
          cnpj: profile.cnpj,
          start_date: profile.start_date,
          equipment_type: profile.equipment_type,
          is_prepaid: profile.is_prepaid,
          rental_value_brl: profile.rental_value_brl,
          allow_manual_credits: profile.allow_manual_credits,
          kess_serial: profile.kess_serial,
          kess_expires_at: profile.kess_expires_at,
          ktag_serial: profile.ktag_serial,
          ktag_expires_at: profile.ktag_expires_at,
          contract_type: profile.contract_type,
          contract_expiration_date: profile.contract_expiration_date,
          requires_password_reset: profile.requires_password_reset,
          service_areas: JSON.parse(JSON.stringify(serviceAreas))
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Also update franchisee_profiles for contract sync
      if (profile.user_id) {
        await supabase
          .from("franchisee_profiles")
          .update({
            nome: profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
            contract_expiration_date: profile.contract_expiration_date
          })
          .eq("user_id", profile.user_id);
      }

      toast.success("Perfil atualizado com sucesso");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof FranchiseeProfile, value: unknown) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Franqueado não encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`}
            </h1>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="cadastro">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cadastro" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Cadastro
          </TabsTrigger>
          <TabsTrigger value="cobertura" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Cobertura
          </TabsTrigger>
          <TabsTrigger value="equipamentos" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="contrato" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contrato
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Cadastrais</CardTitle>
              <CardDescription>Informações básicas do franqueado</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome de Exibição</Label>
                <Input
                  value={profile.display_name || ""}
                  onChange={(e) => updateField("display_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Primeiro Nome</Label>
                <Input
                  value={profile.first_name || ""}
                  onChange={(e) => updateField("first_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sobrenome</Label>
                <Input
                  value={profile.last_name || ""}
                  onChange={(e) => updateField("last_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={profile.cpf || ""}
                  onChange={(e) => updateField("cpf", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={profile.cnpj || ""}
                  onChange={(e) => updateField("cnpj", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={profile.start_date || ""}
                  onChange={(e) => updateField("start_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Equipamento</Label>
                <Input
                  value={profile.equipment_type || ""}
                  onChange={(e) => updateField("equipment_type", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cobertura" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cidades Atendidas</CardTitle>
              <CardDescription>
                Gerencie as cidades que esta franquia atende
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Áreas de Cobertura</Label>
                <CitiesChipsInput
                  value={serviceAreas}
                  onChange={setServiceAreas}
                />
                <p className="text-sm text-muted-foreground">
                  Total: {serviceAreas.length} cidade{serviceAreas.length !== 1 ? "s" : ""} cadastrada{serviceAreas.length !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipamentos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Licenças e Equipamentos</CardTitle>
              <CardDescription>Seriais e datas de expiração</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Serial KESS</Label>
                <Input
                  value={profile.kess_serial || ""}
                  onChange={(e) => updateField("kess_serial", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiração KESS</Label>
                <Input
                  type="date"
                  value={profile.kess_expires_at || ""}
                  onChange={(e) => updateField("kess_expires_at", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Serial KTAG</Label>
                <Input
                  value={profile.ktag_serial || ""}
                  onChange={(e) => updateField("ktag_serial", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiração KTAG</Label>
                <Input
                  type="date"
                  value={profile.ktag_expires_at || ""}
                  onChange={(e) => updateField("ktag_expires_at", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contrato" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Contratuais</CardTitle>
              <CardDescription>Configurações financeiras e contratuais</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select
                  value={profile.contract_type || "Full"}
                  onValueChange={(value) => updateField("contract_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full">Full</SelectItem>
                    <SelectItem value="Leve">Leve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vencimento do Contrato</Label>
                <Input
                  type="date"
                  value={profile.contract_expiration_date || ""}
                  onChange={(e) => updateField("contract_expiration_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Locação (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={profile.rental_value_brl || ""}
                  onChange={(e) => updateField("rental_value_brl", parseFloat(e.target.value) || null)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Pré-pago</Label>
                  <p className="text-sm text-muted-foreground">Modalidade pré-paga</p>
                </div>
                <Switch
                  checked={profile.is_prepaid}
                  onCheckedChange={(checked) => updateField("is_prepaid", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label>Créditos Manuais</Label>
                  <p className="text-sm text-muted-foreground">Permitir adicionar créditos manualmente</p>
                </div>
                <Switch
                  checked={profile.allow_manual_credits}
                  onCheckedChange={(checked) => updateField("allow_manual_credits", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados de Auditoria</CardTitle>
              <CardDescription>Informações do sistema legado e controle</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Login Legado</Label>
                <Input value={profile.legacy_user_login || "-"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>ID Fonte Legado</Label>
                <Input value={profile.legacy_source_user_id || "-"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Role Legado</Label>
                <Input value={profile.legacy_role || "-"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Data Registro Legado</Label>
                <Input value={profile.legacy_user_registered_at || "-"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Criado em</Label>
                <Input 
                  value={new Date(profile.created_at).toLocaleString("pt-BR")} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
              <div className="space-y-2">
                <Label>Atualizado em</Label>
                <Input 
                  value={new Date(profile.updated_at).toLocaleString("pt-BR")} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg col-span-2">
                <div>
                  <Label>Requer Reset de Senha</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuário precisa definir uma nova senha no próximo login
                  </p>
                </div>
                <Switch
                  checked={profile.requires_password_reset}
                  onCheckedChange={(checked) => updateField("requires_password_reset", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
