import { Settings, Bell, Shield, Database, Palette, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function AdminConfiguracoes() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "Suas alterações foram aplicadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema.</p>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>Configure como as notificações são enviadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificar novos arquivos</p>
                <p className="text-sm text-muted-foreground">Receba um aviso quando um novo arquivo for enviado.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificar vencimento de contratos</p>
                <p className="text-sm text-muted-foreground">Alerta 30 dias antes do vencimento.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Relatórios semanais</p>
                <p className="text-sm text-muted-foreground">Receba um resumo semanal por e-mail.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Segurança
            </CardTitle>
            <CardDescription>Configurações de segurança do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autenticação em duas etapas</p>
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança.</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sessão expira em</p>
                <p className="text-sm text-muted-foreground">Tempo de inatividade antes de deslogar.</p>
              </div>
              <Input type="number" defaultValue="30" className="w-20" />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Log de atividades</p>
                <p className="text-sm text-muted-foreground">Registrar todas as ações no sistema.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Sistema
            </CardTitle>
            <CardDescription>Configurações gerais do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limite de upload (MB)</Label>
                <Input type="number" defaultValue="256" />
              </div>
              <div className="space-y-2">
                <Label>Prazo padrão de processamento (horas)</Label>
                <Input type="number" defaultValue="24" />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo de manutenção</p>
                <p className="text-sm text-muted-foreground">Bloquear acesso dos franqueados temporariamente.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* API */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Integrações
            </CardTitle>
            <CardDescription>Configure integrações externas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API de consulta de placas</Label>
              <Input placeholder="https://api.exemplo.com/placas" />
            </div>
            <div className="space-y-2">
              <Label>Chave da API</Label>
              <Input type="password" placeholder="••••••••••••••••" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Integração ativa</p>
                <p className="text-sm text-muted-foreground">Habilitar consulta automática de placas.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="hero" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
