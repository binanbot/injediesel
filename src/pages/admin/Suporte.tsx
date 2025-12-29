import { useState } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type TicketStatus = "aberto" | "em_andamento" | "resolvido" | "cancelado";

interface Ticket {
  id: number;
  titulo: string;
  descricao: string;
  franqueado: string;
  data: string;
  status: TicketStatus;
  prioridade: "baixa" | "media" | "alta";
  mensagens: number;
}

const chamados: Ticket[] = [
  {
    id: 1,
    titulo: "Erro ao enviar arquivo",
    descricao: "Estou recebendo erro 500 ao tentar enviar arquivos maiores que 10MB.",
    franqueado: "João Silva - SP Centro",
    data: "28/12/2024",
    status: "aberto",
    prioridade: "alta",
    mensagens: 3,
  },
  {
    id: 2,
    titulo: "Dúvida sobre nova funcionalidade",
    descricao: "Como faço para utilizar o novo recurso de acompanhamento em tempo real?",
    franqueado: "Maria Santos - RJ Copacabana",
    data: "27/12/2024",
    status: "em_andamento",
    prioridade: "media",
    mensagens: 5,
  },
  {
    id: 3,
    titulo: "Solicitação de acesso adicional",
    descricao: "Preciso de acesso para um novo funcionário da minha unidade.",
    franqueado: "Carlos Oliveira - BH Centro",
    data: "26/12/2024",
    status: "resolvido",
    prioridade: "baixa",
    mensagens: 2,
  },
  {
    id: 4,
    titulo: "Problema com download de arquivos",
    descricao: "Os arquivos processados não estão sendo baixados corretamente.",
    franqueado: "Ana Paula - Curitiba",
    data: "25/12/2024",
    status: "aberto",
    prioridade: "alta",
    mensagens: 1,
  },
  {
    id: 5,
    titulo: "Atualização de dados cadastrais",
    descricao: "Gostaria de atualizar o endereço da minha unidade.",
    franqueado: "Roberto Lima - Porto Alegre",
    data: "24/12/2024",
    status: "cancelado",
    prioridade: "baixa",
    mensagens: 0,
  },
];

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  aberto: { label: "Aberto", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertCircle },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  resolvido: { label: "Resolvido", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
};

const prioridadeConfig = {
  baixa: "bg-slate-500/20 text-slate-400",
  media: "bg-amber-500/20 text-amber-400",
  alta: "bg-red-500/20 text-red-400",
};

export default function AdminSuporte() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<TicketStatus | "todos">("todos");

  const stats = {
    abertos: chamados.filter((c) => c.status === "aberto").length,
    emAndamento: chamados.filter((c) => c.status === "em_andamento").length,
    resolvidos: chamados.filter((c) => c.status === "resolvido").length,
    total: chamados.length,
  };

  const filteredChamados = filter === "todos" 
    ? chamados 
    : chamados.filter((c) => c.status === filter);

  const handleResponder = () => {
    toast({
      title: "Resposta enviada!",
      description: "O franqueado será notificado da sua resposta.",
    });
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">Gerencie os chamados de suporte dos franqueados.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => setFilter("aberto")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abertos</p>
                  <p className="text-3xl font-bold text-orange-400">{stats.abertos}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => setFilter("em_andamento")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.emAndamento}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:border-green-500/50 transition-colors cursor-pointer" onClick={() => setFilter("resolvido")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                  <p className="text-3xl font-bold text-green-400">{stats.resolvidos}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setFilter("todos")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Headphones className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter indicator */}
      {filter !== "todos" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrando por:</span>
          <Badge variant="outline" className={statusConfig[filter].color}>
            {statusConfig[filter].label}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setFilter("todos")}>
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chamados {filter !== "todos" && `- ${statusConfig[filter].label}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredChamados.map((chamado) => {
              const StatusIcon = statusConfig[chamado.status].icon;
              return (
                <motion.div
                  key={chamado.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(chamado)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${statusConfig[chamado.status].color.split(" ")[0]}`}>
                          <StatusIcon className={`h-4 w-4 ${statusConfig[chamado.status].color.split(" ")[1]}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{chamado.titulo}</h3>
                            <Badge variant="outline" className={prioridadeConfig[chamado.prioridade]}>
                              {chamado.prioridade}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{chamado.descricao}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pl-11">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {chamado.franqueado}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {chamado.data}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {chamado.mensagens} mensagens
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={statusConfig[chamado.status].color}>
                        {statusConfig[chamado.status].label}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-primary" />
              {selectedTicket?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={statusConfig[selectedTicket.status].color}>
                  {statusConfig[selectedTicket.status].label}
                </Badge>
                <Badge variant="outline" className={prioridadeConfig[selectedTicket.prioridade]}>
                  Prioridade: {selectedTicket.prioridade}
                </Badge>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedTicket.franqueado}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Aberto em: {selectedTicket.data}</span>
                </div>
                <p className="text-sm">{selectedTicket.descricao}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Responder ao chamado</label>
                <Textarea placeholder="Digite sua resposta..." rows={4} />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Fechar
                </Button>
                <Button variant="hero" onClick={handleResponder}>
                  <MessageSquare className="h-4 w-4" />
                  Enviar Resposta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
