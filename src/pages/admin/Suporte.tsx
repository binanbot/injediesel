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
  UserPlus,
  Flag,
  Send,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TicketTimeline } from "@/components/admin/TicketTimeline";

type TicketStatus = "aberto" | "em_andamento" | "resolvido" | "cancelado";
type TicketPrioridade = "baixa" | "media" | "alta" | "urgente";

interface TeamMember {
  id: string;
  nome: string;
  avatar?: string;
}

interface Ticket {
  id: number;
  titulo: string;
  descricao: string;
  franqueado: string;
  data: string;
  status: TicketStatus;
  prioridade: TicketPrioridade;
  mensagens: number;
  atribuidoPara?: string;
}

const equipe: TeamMember[] = [
  { id: "1", nome: "Carlos Admin" },
  { id: "2", nome: "Ana Suporte" },
  { id: "3", nome: "Pedro Técnico" },
  { id: "4", nome: "Julia Atendimento" },
];

const chamadosIniciais: Ticket[] = [
  {
    id: 1,
    titulo: "Erro ao enviar arquivo",
    descricao: "Estou recebendo erro 500 ao tentar enviar arquivos maiores que 10MB.",
    franqueado: "João Silva - SP Centro",
    data: "28/12/2024",
    status: "aberto",
    prioridade: "alta",
    mensagens: 3,
    atribuidoPara: undefined,
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
    atribuidoPara: "2",
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
    atribuidoPara: "1",
  },
  {
    id: 4,
    titulo: "Problema com download de arquivos",
    descricao: "Os arquivos processados não estão sendo baixados corretamente.",
    franqueado: "Ana Paula - Curitiba",
    data: "25/12/2024",
    status: "aberto",
    prioridade: "urgente",
    mensagens: 1,
    atribuidoPara: undefined,
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
    atribuidoPara: "3",
  },
];

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  aberto: { label: "Aberto", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertCircle },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  resolvido: { label: "Resolvido", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
};

const prioridadeConfig: Record<TicketPrioridade, { label: string; color: string; bgColor: string }> = {
  baixa: { label: "Baixa", color: "text-slate-400", bgColor: "bg-slate-500/20" },
  media: { label: "Média", color: "text-amber-400", bgColor: "bg-amber-500/20" },
  alta: { label: "Alta", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  urgente: { label: "Urgente", color: "text-red-400", bgColor: "bg-red-500/20" },
};

export default function AdminSuporte() {
  const { toast } = useToast();
  const [chamados, setChamados] = useState<Ticket[]>(chamadosIniciais);
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

  const handleUpdateTicket = (ticketId: number, updates: Partial<Ticket>) => {
    setChamados((prev) =>
      prev.map((c) => (c.id === ticketId ? { ...c, ...updates } : c))
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleAtribuir = (ticketId: number, membroId: string) => {
    const membro = equipe.find((m) => m.id === membroId);
    handleUpdateTicket(ticketId, { atribuidoPara: membroId });
    toast({
      title: "Chamado atribuído!",
      description: `O chamado foi atribuído para ${membro?.nome}.`,
    });
  };

  const handleAlterarPrioridade = (ticketId: number, prioridade: TicketPrioridade) => {
    handleUpdateTicket(ticketId, { prioridade });
    toast({
      title: "Prioridade alterada!",
      description: `A prioridade foi alterada para ${prioridadeConfig[prioridade].label}.`,
    });
  };

  const handleAlterarStatus = (ticketId: number, status: TicketStatus) => {
    handleUpdateTicket(ticketId, { status });
    toast({
      title: "Status alterado!",
      description: `O status foi alterado para ${statusConfig[status].label}.`,
    });
  };

  const handleResponder = () => {
    toast({
      title: "Resposta enviada!",
      description: "O franqueado será notificado da sua resposta.",
    });
    setSelectedTicket(null);
  };

  const getMembroNome = (id?: string) => {
    if (!id) return null;
    return equipe.find((m) => m.id === id)?.nome;
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
              const membroAtribuido = getMembroNome(chamado.atribuidoPara);
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
                            <Badge variant="outline" className={`${prioridadeConfig[chamado.prioridade].bgColor} ${prioridadeConfig[chamado.prioridade].color}`}>
                              <Flag className="h-3 w-3 mr-1" />
                              {prioridadeConfig[chamado.prioridade].label}
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
                        {membroAtribuido && (
                          <span className="flex items-center gap-1 text-primary">
                            <UserPlus className="h-4 w-4" />
                            {membroAtribuido}
                          </span>
                        )}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-primary" />
              {selectedTicket?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <Tabs defaultValue="historico" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="historico">Histórico</TabsTrigger>
                <TabsTrigger value="gerenciar">Gerenciar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="historico" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {/* Current Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={statusConfig[selectedTicket.status].color}>
                        {statusConfig[selectedTicket.status].label}
                      </Badge>
                      <Badge variant="outline" className={`${prioridadeConfig[selectedTicket.prioridade].bgColor} ${prioridadeConfig[selectedTicket.prioridade].color}`}>
                        <Flag className="h-3 w-3 mr-1" />
                        {prioridadeConfig[selectedTicket.prioridade].label}
                      </Badge>
                      {selectedTicket.atribuidoPara && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          <UserPlus className="h-3 w-3 mr-1" />
                          {getMembroNome(selectedTicket.atribuidoPara)}
                        </Badge>
                      )}
                    </div>

                    {/* Ticket Info Summary */}
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-medium">{selectedTicket.franqueado}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Aberto em: {selectedTicket.data}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Timeline */}
                    <TicketTimeline ticketId={selectedTicket.id} />

                    <Separator />

                    {/* Quick Response */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Resposta rápida
                      </Label>
                      <Textarea placeholder="Digite sua resposta..." rows={3} />
                      <div className="flex justify-end">
                        <Button variant="hero" size="sm" onClick={handleResponder}>
                          <Send className="h-4 w-4" />
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="gerenciar" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-5">
                    {/* Ticket Info */}
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

                    <Separator />

                    {/* Management Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Atribuir */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Atribuir para
                        </Label>
                        <Select
                          value={selectedTicket.atribuidoPara || ""}
                          onValueChange={(value) => handleAtribuir(selectedTicket.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar membro" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipe.map((membro) => (
                              <SelectItem key={membro.id} value={membro.id}>
                                {membro.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Prioridade */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Prioridade
                        </Label>
                        <Select
                          value={selectedTicket.prioridade}
                          onValueChange={(value: TicketPrioridade) => handleAlterarPrioridade(selectedTicket.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(prioridadeConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <span className={config.color}>{config.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Status
                        </Label>
                        <Select
                          value={selectedTicket.status}
                          onValueChange={(value: TicketStatus) => handleAlterarStatus(selectedTicket.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <span className={config.color.split(" ")[1]}>{config.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                        Fechar
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
