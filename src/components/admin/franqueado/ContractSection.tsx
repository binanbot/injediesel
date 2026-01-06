import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ContractSectionProps {
  profile: {
    contract_type: string | null;
    contract_expiration_date: string | null;
    start_date: string | null;
    is_prepaid: boolean;
    rental_value_brl: number | null;
    allow_manual_credits: boolean;
  };
  onUpdate: (field: string, value: unknown) => void;
}

export function ContractSection({ profile, onUpdate }: ContractSectionProps) {
  const expirationDate = profile.contract_expiration_date 
    ? new Date(profile.contract_expiration_date)
    : null;
  
  const startDate = profile.start_date
    ? new Date(profile.start_date)
    : null;

  const daysRemaining = expirationDate 
    ? differenceInDays(expirationDate, new Date())
    : null;

  const getContractStatus = () => {
    if (!daysRemaining) return { status: "unknown", label: "Sem data", color: "secondary" };
    if (daysRemaining < 0) return { status: "expired", label: "Vencido", color: "destructive" };
    if (daysRemaining <= 30) return { status: "expiring", label: "Vencendo", color: "warning" };
    return { status: "active", label: "Ativo", color: "success" };
  };

  const contractStatus = getContractStatus();

  const StatusIcon = () => {
    switch (contractStatus.status) {
      case "expired":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "expiring":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "active":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Contract Status Card */}
      <Card className={`border-2 ${
        contractStatus.status === "expired" ? "border-destructive/50 bg-destructive/5" :
        contractStatus.status === "expiring" ? "border-amber-500/50 bg-amber-500/5" :
        "border-emerald-500/50 bg-emerald-500/5"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                contractStatus.status === "expired" ? "bg-destructive/10" :
                contractStatus.status === "expiring" ? "bg-amber-500/10" :
                "bg-emerald-500/10"
              }`}>
                <StatusIcon />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Status do Contrato</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={contractStatus.color as "default" | "secondary" | "destructive" | "outline"}>
                    {contractStatus.label}
                  </Badge>
                  {daysRemaining !== null && (
                    <span className="text-sm text-muted-foreground">
                      {daysRemaining >= 0 
                        ? `${daysRemaining} dias restantes`
                        : `Vencido há ${Math.abs(daysRemaining)} dias`
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
              <p className="text-xl font-bold text-primary">
                {profile.contract_type || "Leve"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Dates */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período do Contrato
            </CardTitle>
            <CardDescription>Datas de início e término</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={profile.start_date || ""}
                onChange={(e) => onUpdate("start_date", e.target.value)}
              />
              {startDate && (
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={profile.contract_expiration_date || ""}
                onChange={(e) => onUpdate("contract_expiration_date", e.target.value)}
              />
              {expirationDate && (
                <p className="text-sm text-muted-foreground">
                  {format(expirationDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configurações Contratuais
            </CardTitle>
            <CardDescription>Tipo e valores do contrato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Contrato</Label>
              <Select
                value={profile.contract_type || "Leve"}
                onValueChange={(value) => onUpdate("contract_type", value)}
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
              <Label>Valor Locação (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={profile.rental_value_brl || ""}
                onChange={(e) => onUpdate("rental_value_brl", parseFloat(e.target.value) || null)}
                placeholder="0,00"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opções do Contrato</CardTitle>
          <CardDescription>Configurações adicionais</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Modalidade Pré-paga</Label>
              <p className="text-sm text-muted-foreground">
                Franqueado paga antecipadamente
              </p>
            </div>
            <Switch
              checked={profile.is_prepaid}
              onCheckedChange={(checked) => onUpdate("is_prepaid", checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Créditos Manuais</Label>
              <p className="text-sm text-muted-foreground">
                Permitir adicionar créditos manualmente
              </p>
            </div>
            <Switch
              checked={profile.allow_manual_credits}
              onCheckedChange={(checked) => onUpdate("allow_manual_credits", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
