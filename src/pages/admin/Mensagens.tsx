import { useState } from "react";
import { Send, Plus, Mail, MailOpen, Users } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const mensagens = [
  {
    id: 1,
    titulo: "Novo recurso disponível",
    resumo: "Agora você pode acompanhar o status dos seus arquivos em tempo real.",
    data: "28/12/2024",
    enviadas: 48,
    lidas: 32,
    curtidas: 45,
  },
  {
    id: 2,
    titulo: "Manutenção programada",
    resumo: "O sistema ficará indisponível no dia 01/01 das 02h às 06h.",
    data: "27/12/2024",
    enviadas: 48,
    lidas: 45,
    curtidas: 12,
  },
  {
    id: 3,
    titulo: "Feliz Natal!",
    resumo: "A equipe Injediesel deseja um Feliz Natal a todos os franqueados.",
    data: "25/12/2024",
    enviadas: 48,
    lidas: 48,
    curtidas: 87,
  },
  {
    id: 4,
    titulo: "Atualização de preços",
    resumo: "Confira a nova tabela de preços válida a partir de janeiro.",
    data: "20/12/2024",
    enviadas: 48,
    lidas: 46,
    curtidas: 23,
  },
];

export default function AdminMensagens() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

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
        <CardHeader>
          <CardTitle className="text-lg">Mensagens Enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mensagens.map((mensagem) => (
              <div
                key={mensagem.id}
                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
