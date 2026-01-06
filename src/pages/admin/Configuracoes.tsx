import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Database, Palette, Globe, Save, Facebook, Instagram, ShoppingBag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSocialLinks } from "@/hooks/useSocialLinks";

const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return true; // Empty is valid
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// TikTok icon component (not available in lucide-react)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function AdminConfiguracoes() {
  const { toast } = useToast();
  const { socialLinks, loading, updateSocialLinks } = useSocialLinks();
  
  const [formLinks, setFormLinks] = useState({
    facebook: "",
    instagram: "",
    tiktok: "",
    shop: "",
  });

  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading) {
      setFormLinks(socialLinks);
    }
  }, [socialLinks, loading]);

  const validateUrls = (): boolean => {
    const errors: Record<string, string> = {};
    Object.entries(formLinks).forEach(([key, value]) => {
      if (value && !isValidUrl(value)) {
        errors[key] = "URL inválida. Use o formato: https://exemplo.com";
      }
    });
    setUrlErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSocialLinkChange = (key: keyof typeof formLinks, value: string) => {
    setFormLinks((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (urlErrors[key]) {
      setUrlErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateUrls()) {
      toast({
        title: "Erro de validação",
        description: "Corrija as URLs inválidas antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateSocialLinks(formLinks);
    if (success) {
      toast({
        title: "Configurações salvas!",
        description: "Suas alterações foram aplicadas com sucesso.",
      });
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema.</p>
      </div>

      <div className="grid gap-6">
        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Redes Sociais
            </CardTitle>
            <CardDescription>Configure os links das redes sociais que aparecem no painel do franqueado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </Label>
                <Input 
                  placeholder="https://facebook.com/suapagina" 
                  value={formLinks.facebook}
                  onChange={(e) => handleSocialLinkChange("facebook", e.target.value)}
                  className={urlErrors.facebook ? "border-destructive" : ""}
                />
                {urlErrors.facebook && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {urlErrors.facebook}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram
                </Label>
                <Input 
                  placeholder="https://instagram.com/suapagina" 
                  value={formLinks.instagram}
                  onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                  className={urlErrors.instagram ? "border-destructive" : ""}
                />
                {urlErrors.instagram && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {urlErrors.instagram}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TikTokIcon className="h-4 w-4" />
                  TikTok
                </Label>
                <Input 
                  placeholder="https://tiktok.com/@suapagina" 
                  value={formLinks.tiktok}
                  onChange={(e) => handleSocialLinkChange("tiktok", e.target.value)}
                  className={urlErrors.tiktok ? "border-destructive" : ""}
                />
                {urlErrors.tiktok && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {urlErrors.tiktok}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-green-600" />
                  Loja (E-commerce)
                </Label>
                <Input 
                  placeholder="https://sualoja.com.br" 
                  value={formLinks.shop}
                  onChange={(e) => handleSocialLinkChange("shop", e.target.value)}
                  className={urlErrors.shop ? "border-destructive" : ""}
                />
                {urlErrors.shop && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {urlErrors.shop}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
