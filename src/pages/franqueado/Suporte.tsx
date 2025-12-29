import { HeadphonesIcon, MessageSquare, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const canaisContato = [
  {
    icon: Phone,
    titulo: "Telefone",
    descricao: "Ligue para nosso suporte",
    info: "(11) 3000-0000",
    disponibilidade: "Seg a Sex, 8h às 18h",
  },
  {
    icon: MessageSquare,
    titulo: "WhatsApp",
    descricao: "Atendimento rápido",
    info: "(11) 99999-9999",
    disponibilidade: "Seg a Sex, 8h às 18h",
  },
  {
    icon: Mail,
    titulo: "E-mail",
    descricao: "Para assuntos detalhados",
    info: "suporte@injediesel.com.br",
    disponibilidade: "Resposta em até 24h",
  },
];

export default function Suporte() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Ticket enviado!",
      description: "Nossa equipe entrará em contato em breve.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">Entre em contato com nossa equipe de suporte.</p>
      </div>

      {/* Contact Channels */}
      <div className="grid sm:grid-cols-3 gap-4">
        {canaisContato.map((canal) => (
          <Card key={canal.titulo} className="hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <canal.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{canal.titulo}</h3>
              <p className="text-sm text-muted-foreground mb-2">{canal.descricao}</p>
              <p className="font-medium text-primary">{canal.info}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {canal.disponibilidade}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Support Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5 text-primary" />
            Abrir Ticket de Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Suporte Técnico</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="sistema">Sistema / Plataforma</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input placeholder="Descreva brevemente o problema" required />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva detalhadamente o problema ou dúvida..."
                rows={6}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button variant="hero" type="submit">
                <Send className="h-4 w-4" />
                Enviar Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
