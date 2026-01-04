import { useState } from "react";
import { Send, Plus, Mail, MailOpen, Users, AlertTriangle, Info, Megaphone, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type MessageCategory = "critico" | "informativo" | "marketing";

const categoryConfig: Record<MessageCategory, { label: string; icon: React.ReactNode; badgeClass: string; borderClass: string }> = {
  critico: {
    label: "Crítico",
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeClass: "bg-destructive/20 text-destructive border-destructive/30",
    borderClass: "border-l-4 border-l-destructive",
  },
  informativo: {
    label: "Informativo",
    icon: <Info className="h-4 w-4" />,
    badgeClass: "bg-info/20 text-info border-info/30",
    borderClass: "border-l-4 border-l-info",
  },
  marketing: {
    label: "Marketing",
    icon: <Megaphone className="h-4 w-4" />,
    badgeClass: "bg-success/20 text-success border-success/30",
    borderClass: "border-l-4 border-l-success",
  },
};

const mensagens = [
  {
    id: 1,
    titulo: "Novo recurso disponível",
    resumo: "Agora você pode acompanhar o status dos seus arquivos em tempo real.",
    data: "28/12/2024",
    enviadas: 48,
    lidas: 32,
    curtidas: 45,
    categoria: "informativo" as MessageCategory,
  },
  {
    id: 2,
    titulo: "Manutenção programada",
    resumo: "O sistema ficará indisponível no dia 01/01 das 02h às 06h.",
    data: "27/12/2024",
    enviadas: 48,
    lidas: 45,
    curtidas: 12,
    categoria: "critico" as MessageCategory,
  },
  {
    id: 3,
    titulo: "Feliz Natal!",
    resumo: "A equipe Injediesel deseja um Feliz Natal a todos os franqueados.",
    data: "25/12/2024",
    enviadas: 48,
    lidas: 48,
    curtidas: 87,
    categoria: "marketing" as MessageCategory,
  },
  {
    id: 4,
    titulo: "Atualização de preços",
    resumo: "Confira a nova tabela de preços válida a partir de janeiro.",
    data: "20/12/2024",
    enviadas: 48,
    lidas: 46,
    curtidas: 23,
    categoria: "critico" as MessageCategory,
  },
];

export default function AdminMensagens() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [newMessageCategory, setNewMessageCategory] = useState<MessageCategory>("informativo");

  const filteredMensagens = categoryFilter === "all" 
    ? mensagens 
    : mensagens.filter(m => m.categoria === categoryFilter);

  const handleEnviar = () => {
    toast({
      title: "Mensagem enviada!",
      description: "A mensagem foi enviada para todos os franqueados.",
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mensagens</h1>
          <p className="text-muted-foreground">Envie comunicados para os franqueados.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="h-4 w-4" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Mensagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newMessageCategory} onValueChange={(v) => setNewMessageCategory(v as MessageCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critico">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        Crítico
                      </span>
                    </SelectItem>
                    <SelectItem value="informativo">
                      <span className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-info" />
                        Informativo
                      </span>
                    </SelectItem>
                    <SelectItem value="marketing">
                      <span className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-success" />
                        Marketing
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Digite o título da mensagem" />
              </div>
              <div className="space-y-2">
                <Label>Resumo</Label>
                <Input placeholder="Breve resumo que aparecerá na lista" />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea placeholder="Digite o conteúdo completo da mensagem..." rows={8} />
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Destinatários</p>
                  <p className="text-sm text-muted-foreground">Todos os 48 franqueados ativos</p>
                </div>
              </div>
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="hero" onClick={handleEnviar}>
                  <Send className="h-4 w-4" />
                  Enviar Mensagem
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Enviadas</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Leitura</p>
                <p className="text-2xl font-bold">89%</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <MailOpen className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Destinatários</p>
                <p className="text-2xl font-bold">48</p>
              </div>
              <div className="p-3 rounded-xl bg-info/10 text-info">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Curtidas</p>
                <p className="text-2xl font-bold">167</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                ❤️
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Mensagens Enviadas</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critico">Crítico</SelectItem>
                <SelectItem value="informativo">Informativo</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMensagens.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma mensagem encontrada nesta categoria.
              </p>
            ) : (
              filteredMensagens.map((mensagem) => {
                const config = categoryConfig[mensagem.categoria];
                return (
                  <div
                    key={mensagem.id}
                    className={`p-4 rounded-lg border border-border hover:border-primary/50 transition-colors ${config.borderClass}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${config.badgeClass} flex items-center gap-1 text-xs`}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{mensagem.titulo}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{mensagem.resumo}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                          <span>Enviada em: {mensagem.data}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MailOpen className="h-4 w-4" />
                            {mensagem.lidas}/{mensagem.enviadas} lidas
                          </span>
                          <span>•</span>
                          <span>❤️ {mensagem.curtidas}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {Math.round((mensagem.lidas / mensagem.enviadas) * 100)}% leitura
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
