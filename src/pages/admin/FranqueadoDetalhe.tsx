import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Save, Loader2, User, Building, FileText, 
  History, MapPin, Users, BarChart3, MessageSquare, Shield 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CitiesChipsInput } from "@/components/admin/CitiesChipsInput";
import { ContractSection } from "@/components/admin/franqueado/ContractSection";
import { CustomersSection } from "@/components/admin/franqueado/CustomersSection";
import { RevenueChartSection } from "@/components/admin/franqueado/RevenueChartSection";
import { SupportHistorySection } from "@/components/admin/franqueado/SupportHistorySection";
import { AccessControlSection } from "@/components/admin/franqueado/AccessControlSection";

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
  phone: string | null;
  state: string | null;
  district: string | null;
  street: string | null;
  address_number: string | null;
  complement: string | null;
  zip_code: string | null;
  delivery_address: unknown;
  requires_password_reset: boolean;
  contract_type: string | null;
  contract_expiration_date: string | null;
  created_at: string;
  updated_at: string;
  service_areas: ServiceArea[];
  cidade: string | null;
}

interface Unit {
  id: string;
  name: string;
  is_active: boolean;
}

export default function FranqueadoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FranchiseeProfile | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
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
      // Load franchisee profile
      const { data, error } = await supabase
        .from("profiles_franchisees")
        .select("id, user_id, email, display_name, first_name, last_name, phone, cpf, cnpj, cidade, state, district, street, address_number, complement, zip_code, delivery_address, service_areas, contract_expiration_date, contract_type, equipment_type, kess_serial, kess_expires_at, ktag_serial, ktag_expires_at, is_prepaid, rental_value_brl, start_date, allow_manual_credits, requires_password_reset, created_at, updated_at")
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
      
      setProfile({
        ...data,
        service_areas: areas,
      } as FranchiseeProfile);

      // Load unit data
      if (data?.id) {
        const { data: unitData } = await supabase
          .from("units")
          .select("*")
          .eq("franchisee_id", data.id)
          .maybeSingle();
        
        if (unitData) {
          setUnit(unitData);
        }
      }
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

      // Sync to franchisee_profiles
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

  const updateField = (field: string, value: unknown) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleToggleAccess = async (active: boolean) => {
    if (!unit) {
      toast.error("Unidade não encontrada");
      return;
    }

    const { error } = await supabase
      .from("units")
      .update({ is_active: active })
      .eq("id", unit.id);

    if (error) throw error;

    setUnit({ ...unit, is_active: active });
  };

  const franchiseeName = profile?.display_name || 
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || 
    "Franqueado";

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {franchiseeName}
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

      {/* Tabs */}
      <Tabs defaultValue="contrato" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 h-auto">
          <TabsTrigger value="contrato" className="flex flex-col items-center gap-1 py-3">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Contrato</span>
          </TabsTrigger>
          <TabsTrigger value="cadastro" className="flex flex-col items-center gap-1 py-3">
            <User className="h-4 w-4" />
            <span className="text-xs">Cadastro</span>
          </TabsTrigger>
          <TabsTrigger value="cobertura" className="flex flex-col items-center gap-1 py-3">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">Cidades</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex flex-col items-center gap-1 py-3">
            <Users className="h-4 w-4" />
            <span className="text-xs">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="faturamento" className="flex flex-col items-center gap-1 py-3">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Faturamento</span>
          </TabsTrigger>
          <TabsTrigger value="suporte" className="flex flex-col items-center gap-1 py-3">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Suporte</span>
          </TabsTrigger>
          <TabsTrigger value="acesso" className="flex flex-col items-center gap-1 py-3">
            <Shield className="h-4 w-4" />
            <span className="text-xs">Acesso</span>
          </TabsTrigger>
          <TabsTrigger value="equipamentos" className="flex flex-col items-center gap-1 py-3">
            <Building className="h-4 w-4" />
            <span className="text-xs">Equipamentos</span>
          </TabsTrigger>
        </TabsList>

        {/* Contract Tab */}
        <TabsContent value="contrato">
          <ContractSection profile={profile} onUpdate={updateField} />
        </TabsContent>

        {/* Registration Tab */}
        <TabsContent value="cadastro">
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
                <Label>Cidade Principal</Label>
                <Input
                  value={profile.cidade || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Cadastro</Label>
                <Input
                  value={new Date(profile.created_at).toLocaleDateString("pt-BR")}
                  disabled
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Tab */}
        <TabsContent value="cobertura">
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

        {/* Customers Tab */}
        <TabsContent value="clientes">
          <CustomersSection unitId={unit?.id || null} franchiseeName={franchiseeName} />
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="faturamento">
          <RevenueChartSection unitId={unit?.id || null} />
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="suporte">
          <SupportHistorySection userId={profile.user_id} />
        </TabsContent>

        {/* Access Tab */}
        <TabsContent value="acesso">
          <AccessControlSection
            profile={profile}
            isActive={unit?.is_active ?? true}
            onUpdate={updateField}
            onToggleAccess={handleToggleAccess}
          />
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipamentos">
          <Card>
            <CardHeader>
              <CardTitle>Licenças e Equipamentos</CardTitle>
              <CardDescription>Seriais e datas de expiração</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Equipamento</Label>
                <Input
                  value={profile.equipment_type || ""}
                  onChange={(e) => updateField("equipment_type", e.target.value)}
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

          {/* Audit Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Dados de Auditoria
              </CardTitle>
              <CardDescription>Informações do sistema</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
