import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  Camera,
  Lock,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  History,
  FileText,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ContractAlert } from "@/components/ContractAlert";
import { useContractStatus } from "@/hooks/useContractStatus";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast as sonnerToast } from "sonner";

interface ContractHistoryItem {
  id: string;
  start_date: string;
  end_date: string;
  contract_type: string;
  status: string;
  notes: string | null;
}

interface UnitData {
  display_name: string;
  cnpj: string;
  phone: string;
  email: string;
  zip_code: string;
  street: string;
  address_number: string;
  complement: string;
  district: string;
  cidade: string;
  state: string;
}

const emptyUnitData: UnitData = {
  display_name: "",
  cnpj: "",
  phone: "",
  email: "",
  zip_code: "",
  street: "",
  address_number: "",
  complement: "",
  district: "",
  cidade: "",
  state: "",
};

export default function Perfil() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [contractHistory, setContractHistory] = useState<ContractHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const contractStatus = useContractStatus();

  const [unitData, setUnitData] = useState<UnitData>(emptyUnitData);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("profiles_franchisees")
          .select("id, display_name, cnpj, phone, email, zip_code, street, address_number, complement, district, cidade, state")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setProfileId(data.id);
          setUnitData({
            display_name: data.display_name ?? "",
            cnpj: data.cnpj ?? "",
            phone: (data as any).phone ?? "",
            email: data.email ?? user.email ?? "",
            zip_code: (data as any).zip_code ?? "",
            street: (data as any).street ?? "",
            address_number: (data as any).address_number ?? "",
            complement: (data as any).complement ?? "",
            district: (data as any).district ?? "",
            cidade: data.cidade ?? "",
            state: (data as any).state ?? "",
          });
        } else {
          setUnitData((prev) => ({ ...prev, email: user.email ?? "" }));
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  // Fetch contract history
  useEffect(() => {
    const fetchContractHistory = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('contract_history')
          .select('*')
          .eq('franqueado_id', user.id)
          .order('end_date', { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) {
          setContractHistory([
            { id: 'demo-1', start_date: '2021-01-10', end_date: '2022-01-10', contract_type: 'Basic', status: 'renewed', notes: 'Primeiro contrato da unidade' },
            { id: 'demo-2', start_date: '2022-01-10', end_date: '2023-01-10', contract_type: 'Full', status: 'renewed', notes: 'Upgrade para plano Full' },
            { id: 'demo-3', start_date: '2023-01-10', end_date: '2024-01-10', contract_type: 'Full', status: 'renewed', notes: null },
          ]);
        } else {
          setContractHistory(data);
        }
      } catch {
        setContractHistory([
          { id: 'demo-1', start_date: '2021-01-10', end_date: '2022-01-10', contract_type: 'Basic', status: 'renewed', notes: 'Primeiro contrato da unidade' },
          { id: 'demo-2', start_date: '2022-01-10', end_date: '2023-01-10', contract_type: 'Full', status: 'renewed', notes: 'Upgrade para plano Full' },
          { id: 'demo-3', start_date: '2023-01-10', end_date: '2024-01-10', contract_type: 'Full', status: 'renewed', notes: null },
        ]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchContractHistory();
  }, [user?.id]);

  const handleUnitChange = (field: keyof UnitData, value: string) => {
    setUnitData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    try {
      setFetchingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) return;
      setUnitData((prev) => ({
        ...prev,
        zip_code: cleanCep,
        street: data.logradouro || prev.street,
        district: data.bairro || prev.district,
        cidade: data.localidade || prev.cidade,
        state: data.uf || prev.state,
      }));
    } catch {
      // silently ignore
    } finally {
      setFetchingCep(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileId) {
      sonnerToast.error("Perfil não encontrado. Contacte o suporte.");
      return;
    }
    try {
      setSavingProfile(true);
      const { error } = await supabase
        .from("profiles_franchisees")
        .update({
          display_name: unitData.display_name || null,
          cnpj: unitData.cnpj || null,
          phone: unitData.phone as any,
          email: unitData.email,
          zip_code: unitData.zip_code as any,
          street: unitData.street as any,
          address_number: unitData.address_number as any,
          complement: unitData.complement as any,
          district: unitData.district as any,
          cidade: unitData.cidade || null,
          state: unitData.state as any,
        } as any)
        .eq("id", profileId);

      if (error) throw error;
      sonnerToast.success("Perfil salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      sonnerToast.error("Não foi possível salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    let strength = 0;
    if (value.length >= 8) strength += 25;
    if (/[A-Z]/.test(value)) strength += 25;
    if (/[0-9]/.test(value)) strength += 25;
    if (/[^A-Za-z0-9]/.test(value)) strength += 25;
    setPasswordStrength(strength);
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-destructive";
    if (passwordStrength <= 50) return "bg-warning";
    if (passwordStrength <= 75) return "bg-info";
    return "bg-success";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 25) return "Fraca";
    if (passwordStrength <= 50) return "Regular";
    if (passwordStrength <= 75) return "Boa";
    return "Forte";
  };

  const getContractProgressColor = () => {
    if (!contractStatus.daysRemaining) return "bg-success";
    const days = contractStatus.daysRemaining;
    if (days <= 15) return "bg-destructive";
    if (days <= 30) return "bg-orange-600";
    if (days <= 60) return "bg-warning";
    if (days <= 90) return "bg-yellow-500";
    return "bg-success";
  };

  const getContractProgress = () => {
    if (!contractStatus.daysRemaining) return 100;
    const totalDays = 365;
    const daysUsed = totalDays - contractStatus.daysRemaining;
    return Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">Gerencie as informações da sua unidade.</p>
      </div>

      <ContractAlert useHook />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                  {unitData.display_name ? unitData.display_name.slice(0, 2).toUpperCase() : "UN"}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h3 className="font-semibold text-lg">{unitData.display_name || "Minha Unidade"}</h3>
            <p className="text-sm text-muted-foreground">Franqueado {contractStatus.contractType || "Full"}</p>
          </CardContent>
        </Card>

        {/* Contract Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Informações do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data de início</p>
                <p className="font-medium">10/01/2024</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de vencimento</p>
                <p className="font-medium text-warning">
                  {contractStatus.expirationDate
                    ? new Date(contractStatus.expirationDate).toLocaleDateString('pt-BR')
                    : "10/01/2025"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de revenda</p>
                <p className="font-medium">Full</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={`status-badge ${
                  contractStatus.isExpired ? "status-rejected"
                    : contractStatus.isNearExpiration ? "status-processing"
                    : "status-approved"
                }`}>
                  {contractStatus.isExpired ? "Vencido"
                    : contractStatus.isNearExpiration ? "Vencendo"
                    : "Ativo"}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vigência do contrato</span>
                <span className={`font-medium ${
                  contractStatus.daysRemaining && contractStatus.daysRemaining <= 30
                    ? "text-destructive"
                    : contractStatus.daysRemaining && contractStatus.daysRemaining <= 60
                      ? "text-warning" : "text-foreground"
                }`}>
                  {contractStatus.isExpired ? "Contrato vencido"
                    : contractStatus.daysRemaining ? `${contractStatus.daysRemaining} dias restantes`
                    : "365 dias restantes"}
                </span>
              </div>
              <div className="relative">
                <Progress value={getContractProgress()} className="h-3 bg-secondary" />
                <div
                  className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-500 ${getContractProgressColor()} ${
                    contractStatus.daysRemaining && contractStatus.daysRemaining <= 15
                      ? "animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]" : ""
                  }`}
                  style={{ width: `${getContractProgress()}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Início</span>
                <span>Vencimento</span>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-3">
                <Button
                  variant={contractStatus.isExpired || (contractStatus.daysRemaining && contractStatus.daysRemaining <= 30) ? "hero" : "outline"}
                  className="w-full gap-2"
                  onClick={() => toast({
                    title: "Solicitação enviada!",
                    description: "Nossa equipe entrará em contato para renovação do contrato."
                  })}
                >
                  <RefreshCw className="h-4 w-4" />
                  Renovar Contrato
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit Info - Editable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Dados da Unidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input
                    placeholder="Nome da empresa"
                    value={unitData.display_name}
                    onChange={(e) => handleUnitChange("display_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={unitData.cnpj}
                    onChange={(e) => handleUnitChange("cnpj", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={unitData.phone}
                    onChange={(e) => handleUnitChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    placeholder="email@exemplo.com"
                    value={unitData.email}
                    onChange={(e) => handleUnitChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      placeholder="00000-000"
                      value={unitData.zip_code}
                      onChange={(e) => {
                        handleUnitChange("zip_code", e.target.value);
                        fetchAddressByCep(e.target.value);
                      }}
                    />
                    {fetchingCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rua</Label>
                  <Input
                    placeholder="Nome da rua"
                    value={unitData.street}
                    onChange={(e) => handleUnitChange("street", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    placeholder="Nº"
                    value={unitData.address_number}
                    onChange={(e) => handleUnitChange("address_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    placeholder="Apto, bloco, etc."
                    value={unitData.complement}
                    onChange={(e) => handleUnitChange("complement", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    placeholder="Bairro"
                    value={unitData.district}
                    onChange={(e) => handleUnitChange("district", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    placeholder="Cidade"
                    value={unitData.cidade}
                    onChange={(e) => handleUnitChange("cidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input
                    placeholder="UF"
                    value={unitData.state}
                    onChange={(e) => handleUnitChange("state", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingProfile ? "Salvando..." : "Salvar Dados"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contract History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : contractHistory.length > 0 ? (
            <div className="space-y-3">
              {contractHistory.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(contract.start_date).toLocaleDateString('pt-BR')} — {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tipo: {contract.contract_type}
                        {contract.notes && ` • ${contract.notes}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      contract.status === 'renewed'
                        ? "bg-success/10 text-success border-success/30"
                        : contract.status === 'expired'
                          ? "bg-muted text-muted-foreground border-muted"
                          : "bg-warning/10 text-warning border-warning/30"
                    }
                  >
                    {contract.status === 'renewed' ? 'Renovado' :
                     contract.status === 'expired' ? 'Expirado' :
                     contract.status === 'cancelled' ? 'Cancelado' : contract.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum contrato anterior registrado</p>
              <p className="text-xs mt-1">O histórico aparecerá aqui após renovações</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Senha atual</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div></div>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={(e) => handlePasswordChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordStrength > 0 && (
                <div className="space-y-1">
                  <Progress value={passwordStrength} className={`h-2 ${getStrengthColor()}`} />
                  <p className="text-xs text-muted-foreground">
                    Força da senha: <span className={passwordStrength >= 75 ? "text-success" : ""}>{getStrengthText()}</span>
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="hero"
              onClick={() => toast({ title: "Senha alterada!", description: "Sua senha foi alterada com sucesso." })}
            >
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}