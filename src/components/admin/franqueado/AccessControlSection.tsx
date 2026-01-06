import { useState } from "react";
import { Shield, ShieldOff, Lock, Unlock, AlertTriangle, CheckCircle, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface AccessControlSectionProps {
  profile: {
    requires_password_reset: boolean;
  };
  isActive: boolean;
  onUpdate: (field: string, value: unknown) => void;
  onToggleAccess: (active: boolean) => Promise<void>;
}

export function AccessControlSection({ 
  profile, 
  isActive, 
  onUpdate,
  onToggleAccess 
}: AccessControlSectionProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleAccess = async (active: boolean) => {
    setIsToggling(true);
    try {
      await onToggleAccess(active);
      toast.success(active 
        ? "Acesso liberado com sucesso" 
        : "Acesso bloqueado com sucesso"
      );
    } catch (error) {
      console.error("Erro ao alterar acesso:", error);
      toast.error("Erro ao alterar acesso");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Access Status Card */}
      <Card className={`border-2 ${
        isActive 
          ? "border-emerald-500/50 bg-emerald-500/5" 
          : "border-destructive/50 bg-destructive/5"
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                isActive 
                  ? "bg-emerald-500/10" 
                  : "bg-destructive/10"
              }`}>
                {isActive ? (
                  <Shield className="h-6 w-6 text-emerald-500" />
                ) : (
                  <ShieldOff className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Status de Acesso</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={isActive ? "default" : "destructive"}>
                    {isActive ? "Ativo" : "Bloqueado"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {isActive 
                      ? "Franqueado pode acessar o sistema" 
                      : "Acesso ao sistema está bloqueado"
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant={isActive ? "destructive" : "default"}
                  disabled={isToggling}
                >
                  {isActive ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Bloquear Acesso
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Liberar Acesso
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isActive ? "Bloquear Acesso" : "Liberar Acesso"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isActive
                      ? "O franqueado não conseguirá mais acessar o sistema. Todos os serviços serão interrompidos até que o acesso seja liberado novamente."
                      : "O franqueado voltará a ter acesso completo ao sistema e poderá retomar suas atividades."
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleToggleAccess(!isActive)}
                    className={isActive ? "bg-destructive hover:bg-destructive/90" : ""}
                  >
                    {isActive ? "Bloquear" : "Liberar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Access Settings */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Segurança da Conta
            </CardTitle>
            <CardDescription>
              Configurações de segurança e autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Forçar Reset de Senha</Label>
                <p className="text-sm text-muted-foreground">
                  Usuário precisará definir uma nova senha no próximo login
                </p>
              </div>
              <Switch
                checked={profile.requires_password_reset}
                onCheckedChange={(checked) => onUpdate("requires_password_reset", checked)}
              />
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                {profile.requires_password_reset ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-500">Reset de senha pendente</p>
                      <p className="text-sm text-muted-foreground">
                        O usuário será solicitado a criar uma nova senha ao fazer login
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-500">Senha atualizada</p>
                      <p className="text-sm text-muted-foreground">
                        A senha do usuário está atualizada
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Motivos para Bloqueio
            </CardTitle>
            <CardDescription>
              Situações que podem levar ao bloqueio do acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-destructive font-bold">•</span>
                <span>Contrato vencido sem renovação</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-destructive font-bold">•</span>
                <span>Inadimplência financeira</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-destructive font-bold">•</span>
                <span>Violação dos termos de uso</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-destructive font-bold">•</span>
                <span>Solicitação do próprio franqueado</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-destructive font-bold">•</span>
                <span>Suspensão administrativa</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
