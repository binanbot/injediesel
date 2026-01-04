import { useState, useEffect, useRef } from "react";
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
  Loader2,
  Paperclip,
  FileIcon,
  Download,
  X,
  ExternalLink,
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
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { playNotificationSound } from "@/utils/notificationSound";
import { showBrowserNotification } from "@/utils/browserNotifications";
import { ExpandableText } from "@/components/ui/expandable-text";
import { calcularTempoDecorridoISO, getTempoClasses } from "@/utils/tempoDecorrido";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  franqueado_id: string;
  created_at: string;
  updated_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "franqueado" | "suporte";
  content: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

interface TeamMember {
  id: string;
  nome: string;
}

const equipe: TeamMember[] = [
  { id: "1", nome: "Carlos Admin" },
  { id: "2", nome: "Ana Suporte" },
  { id: "3", nome: "Pedro Técnico" },
  { id: "4", nome: "Julia Atendimento" },
];

const statusConfig: Record<string, { label: string; color: string; bgSolid: string; icon: React.ElementType }> = {
  open: { 
    label: "Aberto", 
    color: "bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-[0_0_10px_hsl(200,100%,50%,0.2)]", 
    bgSolid: "bg-sky-600 hover:bg-sky-700 text-white shadow-[0_0_15px_hsl(200,100%,50%,0.3)]",
    icon: MessageSquare 
  },
  in_progress: { 
    label: "Em Andamento", 
    color: "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_hsl(45,100%,50%,0.2)]", 
    bgSolid: "bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_15px_hsl(45,100%,50%,0.3)]",
    icon: Clock 
  },
  resolved: { 
    label: "Resolvido", 
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_hsl(160,100%,40%,0.2)]", 
    bgSolid: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_hsl(160,100%,40%,0.3)]",
    icon: CheckCircle2 
  },
  closed: { 
    label: "Fechado", 
    color: "bg-slate-500/20 text-slate-400 border-slate-500/40", 
    bgSolid: "bg-slate-600 hover:bg-slate-700 text-white",
    icon: XCircle 
  },
};

export default function AdminSuporte() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<string>("todos");
  
  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Attachment state
  const [messageAttachment, setMessageAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // Load tickets
  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tickets.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Load messages for selected ticket
  const loadMessages = async (ticketId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`admin-ticket-messages-${selectedTicket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          if (newMsg.sender_type === "franqueado") {
            playNotificationSound();
            if (document.hidden) {
              showBrowserNotification({
                title: "Nova mensagem do franqueado",
                body: newMsg.content.slice(0, 100)
              });
            }
          }
          
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setMessages([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive"
        });
        return;
      }
      setMessageAttachment(file);
    }
  };

  const removeAttachment = () => {
    setMessageAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !messageAttachment) || !selectedTicket || !userId) return;

    try {
      setSendingMessage(true);
      
      let attachmentUrl = null;
      let attachmentName = null;

      // Upload attachment if present
      if (messageAttachment) {
        const fileExt = messageAttachment.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('support-attachments')
          .upload(fileName, messageAttachment);
        
        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          throw new Error("Erro ao enviar anexo");
        }
        
        const { data: urlData } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(fileName);
        
        attachmentUrl = urlData.publicUrl;
        attachmentName = messageAttachment.name;
      }

      const messageContent = newMessage.trim() || (attachmentName ? `📎 Anexo: ${attachmentName}` : "");

      const { error } = await supabase
        .from("support_messages")
        .insert({
          conversation_id: selectedTicket.id,
          content: messageContent,
          sender_id: userId,
          sender_type: "suporte"
        });

      if (error) throw error;

      setNewMessage("");
      setMessageAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_conversations")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: "Status atualizado!",
        description: `O status foi alterado para ${statusConfig[newStatus]?.label || newStatus}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: ptBR });
  };

  const formatMessageDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM", { locale: ptBR });
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.open;
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    msgs.forEach((msg) => {
      const msgDate = format(new Date(msg.created_at), "yyyy-MM-dd");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.created_at, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const filteredTickets = filter === "todos" 
    ? tickets 
    : tickets.filter(t => t.status === filter);

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    total: tickets.length,
  };

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">Gerencie os tickets de suporte dos franqueados.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => setFilter("open")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abertos</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.open}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="hover:border-yellow-500/50 transition-colors cursor-pointer" onClick={() => setFilter("in_progress")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.in_progress}</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:border-green-500/50 transition-colors cursor-pointer" onClick={() => setFilter("resolved")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                  <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
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
          <Badge variant="outline" className={getStatusConfig(filter).color}>
            {getStatusConfig(filter).label}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setFilter("todos")}>
            Limpar filtro
          </Button>
        </div>
      )}

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tickets {filter !== "todos" && `- ${getStatusConfig(filter).label}`}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Carregando tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Headphones className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum ticket encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const status = getStatusConfig(ticket.status);
                const StatusIcon = status.icon;
                const tempoDecorrido = calcularTempoDecorridoISO(ticket.updated_at);
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenTicket(ticket)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Resumo - 1 linha */}
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${status.color.split(" ")[0]}`}>
                            <StatusIcon className={`h-4 w-4 ${status.color.split(" ")[1]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate">{ticket.subject}</h3>
                              {ticket.attachment_url && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  <Paperclip className="h-3 w-3 mr-1" />
                                  Anexo
                                </Badge>
                              )}
                            </div>
                            {/* Data inline com resumo */}
                            <p className="text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatDate(ticket.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${getTempoClasses(tempoDecorrido.level)} text-xs`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {tempoDecorrido.label}
                        </Badge>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary" />
                  {selectedTicket?.subject}
                </DialogTitle>
                {selectedTicket && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className={getStatusConfig(selectedTicket.status).color}>
                      {getStatusConfig(selectedTicket.status).label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(selectedTicket.created_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {selectedTicket && (
            <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 mx-6 max-w-[calc(100%-3rem)]">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="gerenciar">Gerenciar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0 px-6 pb-6">
                {/* Attachment Preview (if ticket has one) */}
                {selectedTicket.attachment_url && (
                  <div className="mb-4 p-3 rounded-lg bg-[hsl(180,100%,40%)]/10 border border-[hsl(180,100%,40%)]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(180,100%,40%)]/20 flex items-center justify-center">
                        <FileIcon className="h-5 w-5 text-[hsl(180,100%,40%)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Anexo do Ticket</p>
                        <p className="text-xs text-muted-foreground truncate">{selectedTicket.attachment_name || "Arquivo anexado"}</p>
                      </div>
                      <div className="flex gap-2">
                        {isImageFile(selectedTicket.attachment_url) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(selectedTicket.attachment_url!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={selectedTicket.attachment_url} download={selectedTicket.attachment_name} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </a>
                        </Button>
                      </div>
                    </div>
                    {isImageFile(selectedTicket.attachment_url) && (
                      <div className="mt-3">
                        <img 
                          src={selectedTicket.attachment_url} 
                          alt="Anexo" 
                          className="max-h-48 rounded-lg object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 pr-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Carregando mensagens...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {groupMessagesByDate(messages).map((group, groupIndex) => (
                        <div key={groupIndex}>
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                              {formatMessageDate(group.date)}
                            </span>
                          </div>
                          {group.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex mb-3 ${message.sender_type === "suporte" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                  message.sender_type === "suporte"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-secondary/80 rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <span
                                  className={`text-[10px] mt-1 block ${
                                    message.sender_type === "suporte"
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {formatMessageTime(message.created_at)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="pt-4 border-t border-border/50 space-y-3">
                  {/* Attachment Preview */}
                  {messageAttachment && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border border-border">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{messageAttachment.name}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(messageAttachment.size)}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeAttachment}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || (!newMessage.trim() && !messageAttachment)}
                      className="shrink-0"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gerenciar" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-5 pt-4">
                    {/* Ticket Info */}
                    <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Aberto em: {formatDate(selectedTicket.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Última atualização: {formatDate(selectedTicket.updated_at)}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Status Management */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Alterar Status
                      </Label>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
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
