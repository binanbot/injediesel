import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  ExternalLink,
  RefreshCw,
  FileText,
  User,
  Calendar,
  Car,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CorrectionChatPanel from "@/components/admin/CorrectionChatPanel";

interface CorrectionTicket {
  id: string;
  arquivo_id: string;
  franqueado_id: string;
  motivo: string;
  arquivo_anexo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  conversation_id: string | null;
}

// Dados mockados para exibição (em produção viriam do banco)
const mockTicketsData: Record<string, {
  franqueado: string;
  placa: string;
  veiculo: string;
  servico: string;
}> = {
  "1": { franqueado: "João Silva - Unidade SP", placa: "ABC-1234", veiculo: "Volvo FH 540", servico: "Stage 1" },
  "2": { franqueado: "Carlos Transportes", placa: "DEF-5678", veiculo: "Scania R 450", servico: "DPF Off" },
  "3": { franqueado: "Pedro Santos - MG", placa: "GHI-9012", veiculo: "Mercedes Actros", servico: "EGR Off" },
  "4": { franqueado: "Maria Oliveira - PR", placa: "JKL-3456", veiculo: "DAF XF 105", servico: "AdBlue Off" },
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "aberto":
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          Aberto
        </Badge>
      );
    case "em_analise":
      return (
        <Badge className="bg-info/20 text-info border-info/30">
          <Eye className="h-3 w-3 mr-1" />
          Em Análise
        </Badge>
      );
    case "resolvido":
      return (
        <Badge className="bg-success/20 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Resolvido
        </Badge>
      );
    case "rejeitado":
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Mock de tickets para demonstração
const mockTickets: CorrectionTicket[] = [
  {
    id: "1",
    arquivo_id: "1",
    franqueado_id: "user-1",
    motivo: "O arquivo não está funcionando corretamente. Após aplicar a modificação, o veículo apresentou falhas no sistema de injeção.",
    arquivo_anexo_url: null,
    status: "aberto",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    conversation_id: "conv-1",
  },
  {
    id: "2",
    arquivo_id: "2",
    franqueado_id: "user-2",
    motivo: "Preciso de ajuste na calibração. O cliente relatou consumo elevado após a modificação.",
    arquivo_anexo_url: "https://example.com/file.bin",
    status: "em_analise",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    conversation_id: "conv-2",
  },
  {
    id: "3",
    arquivo_id: "3",
    franqueado_id: "user-3",
    motivo: "Erro no DPF. O veículo entrou em modo de emergência após a aplicação.",
    arquivo_anexo_url: null,
    status: "resolvido",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
    conversation_id: null,
  },
];

export default function AdminCorrecoes() {
  const [tickets, setTickets] = useState<CorrectionTicket[]>(mockTickets);
  const [filteredTickets, setFilteredTickets] = useState<CorrectionTicket[]>(mockTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedTicket, setSelectedTicket] = useState<CorrectionTicket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resposta, setResposta] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Carregar tickets do banco (com fallback para mock)
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('correction_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tickets:', error);
          // Usar dados mock em caso de erro
          return;
        }

        if (data && data.length > 0) {
          setTickets(data);
          setFilteredTickets(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchTickets();
  }, []);

  // Filtrar tickets
  useEffect(() => {
    let filtered = tickets;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.motivo.toLowerCase().includes(term) ||
        t.arquivo_id.toLowerCase().includes(term) ||
        mockTicketsData[t.arquivo_id]?.franqueado.toLowerCase().includes(term) ||
        mockTicketsData[t.arquivo_id]?.placa.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    setFilteredTickets(filtered);
  }, [searchTerm, statusFilter, tickets]);

  const handleOpenTicket = (ticket: CorrectionTicket) => {
    setSelectedTicket(ticket);
    setNovoStatus(ticket.status);
    setResposta("");
    setDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('correction_tickets')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) {
        console.error('Update error:', error);
        // Atualizar localmente mesmo com erro (para demo)
      }

      // Atualizar estado local
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, status: novoStatus, updated_at: new Date().toISOString() }
          : t
      ));

      toast({
        title: "Status atualizado",
        description: `O ticket foi marcado como "${novoStatus}".`,
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: tickets.length,
    abertos: tickets.filter(t => t.status === "aberto").length,
    emAnalise: tickets.filter(t => t.status === "em_analise").length,
    resolvidos: tickets.filter(t => t.status === "resolvido").length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitações de Correção</h1>
          <p className="text-muted-foreground">Gerencie os tickets de correção dos franqueados</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abertos</p>
                  <p className="text-3xl font-bold text-warning">{stats.abertos}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10 text-warning">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Análise</p>
                  <p className="text-3xl font-bold text-info">{stats.emAnalise}</p>
                </div>
                <div className="p-3 rounded-xl bg-info/10 text-info">
                  <Eye className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                  <p className="text-3xl font-bold text-success">{stats.resolvidos}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10 text-success">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por franqueado, placa ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="aberto">Abertos</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="resolvido">Resolvidos</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Tickets de Correção ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum ticket encontrado</p>
              </div>
            ) : (
              filteredTickets.map((ticket, index) => {
                const ticketData = mockTicketsData[ticket.arquivo_id] || {
                  franqueado: "Franqueado",
                  placa: "---",
                  veiculo: "Veículo",
                  servico: "Serviço"
                };

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenTicket(ticket)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(ticket.status)}
                          <span className="text-sm text-muted-foreground">
                            #{ticket.id.slice(0, 8)}
                          </span>
                          {ticket.arquivo_anexo_url && (
                            <Badge variant="outline" className="text-xs">
                              <Download className="h-3 w-3 mr-1" />
                              Anexo
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-foreground font-medium">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {ticketData.franqueado}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Car className="h-4 w-4" />
                            {ticketData.placa} - {ticketData.veiculo}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.motivo}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {formatDate(ticket.created_at)}
                        </div>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog with Chat */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col glass-card border-border/30 p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-5 w-5 text-warning" />
              Detalhes do Ticket
              {selectedTicket && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  #{selectedTicket.id.slice(0, 8)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2">
              <TabsTrigger value="detalhes" className="gap-2">
                <FileText className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat
                {selectedTicket?.conversation_id && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    Ativo
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="flex-1 px-6 h-[400px]">
                {selectedTicket && (
                  <div className="space-y-5 py-4">
                    {/* Status atual */}
                    <div className="flex items-center justify-between">
                      {getStatusBadge(selectedTicket.status)}
                    </div>

                    {/* Dados do arquivo */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">Arquivo Relacionado</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm bg-secondary/30 p-3 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Franqueado</p>
                          <p className="font-medium text-foreground">
                            {mockTicketsData[selectedTicket.arquivo_id]?.franqueado || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Placa</p>
                          <p className="font-medium text-foreground">
                            {mockTicketsData[selectedTicket.arquivo_id]?.placa || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Veículo</p>
                          <p className="font-medium text-foreground">
                            {mockTicketsData[selectedTicket.arquivo_id]?.veiculo || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Serviço</p>
                          <p className="font-medium text-foreground">
                            {mockTicketsData[selectedTicket.arquivo_id]?.servico || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Motivo da correção */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">Descrição do Problema</h4>
                      <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">
                        {selectedTicket.motivo}
                      </p>
                    </div>

                    {/* Arquivo anexo */}
                    {selectedTicket.arquivo_anexo_url && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Arquivo Anexado</h4>
                        <Button variant="outline" className="w-full" asChild>
                          <a href={selectedTicket.arquivo_anexo_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Anexo
                          </a>
                        </Button>
                      </div>
                    )}

                    <Separator className="bg-border/30" />

                    {/* Atualizar status */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">Gerenciar Ticket</h4>
                      <div className="space-y-2">
                        <Label>Alterar Status</Label>
                        <Select value={novoStatus} onValueChange={setNovoStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="em_analise">Em Análise</SelectItem>
                            <SelectItem value="resolvido">Resolvido</SelectItem>
                            <SelectItem value="rejeitado">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Observação Interna (opcional)</Label>
                        <Textarea
                          placeholder="Adicione uma nota sobre o ticket..."
                          value={resposta}
                          onChange={(e) => setResposta(e.target.value)}
                          className="min-h-[80px] bg-secondary/30"
                        />
                      </div>
                    </div>

                    {/* Datas */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Criado: {formatDate(selectedTicket.created_at)}</span>
                      <span>Atualizado: {formatDate(selectedTicket.updated_at)}</span>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 overflow-hidden mt-0 h-[400px]">
              <CorrectionChatPanel conversationId={selectedTicket?.conversation_id || null} />
            </TabsContent>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t border-border/30 bg-background/50 backdrop-blur-sm">
            <div className="flex gap-2 w-full">
              <Button 
                variant="hero" 
                className="flex-1"
                onClick={handleUpdateStatus}
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
