import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ContractAlert } from "@/components/ContractAlert";
import { useContractStatus } from "@/hooks/useContractStatus";

export default function Perfil() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const contractStatus = useContractStatus();

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

  // Contract progress bar color based on days remaining
  const getContractProgressColor = () => {
    if (!contractStatus.daysRemaining) return "bg-success";
    const days = contractStatus.daysRemaining;
    if (days <= 15) return "bg-destructive";
    if (days <= 30) return "bg-orange-600";
    if (days <= 60) return "bg-warning";
    if (days <= 90) return "bg-yellow-500";
    return "bg-success";
  };

  // Calculate contract progress percentage (assuming 365 days contract)
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

      {/* Contract Alert - usa dados do banco via hook */}
      <ContractAlert useHook />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-3xl bg-primary/20 text-primary">SP</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h3 className="font-semibold text-lg">Unidade São Paulo</h3>
            <p className="text-sm text-muted-foreground">Franqueado Full</p>
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
                  contractStatus.isExpired 
                    ? "status-rejected" 
                    : contractStatus.isNearExpiration 
                      ? "status-processing" 
                      : "status-approved"
                }`}>
                  {contractStatus.isExpired 
                    ? "Vencido" 
                    : contractStatus.isNearExpiration 
                      ? "Vencendo" 
                      : "Ativo"}
                </span>
              </div>
            </div>

            {/* Contract Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vigência do contrato</span>
                <span className={`font-medium ${
                  contractStatus.daysRemaining && contractStatus.daysRemaining <= 30 
                    ? "text-destructive" 
                    : contractStatus.daysRemaining && contractStatus.daysRemaining <= 60 
                      ? "text-warning" 
                      : "text-foreground"
                }`}>
                  {contractStatus.isExpired 
                    ? "Contrato vencido" 
                    : contractStatus.daysRemaining 
                      ? `${contractStatus.daysRemaining} dias restantes`
                      : "365 dias restantes"}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={getContractProgress()} 
                  className="h-3 bg-secondary"
                />
                <div 
                  className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-500 ${getContractProgressColor()}`}
                  style={{ width: `${getContractProgress()}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Início</span>
                <span>Vencimento</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Dados da Unidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input value="Injediesel São Paulo Ltda" readOnly className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value="12.345.678/0001-90" readOnly className="bg-secondary/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-input">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-input">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">(11) 99999-9999</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-input">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">contato@injedieselsp.com.br</span>
              </div>
            </div>
          </div>
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
              <div className="relative">
                <Input type="password" placeholder="••••••••" />
              </div>
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
