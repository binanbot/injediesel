import { useState, useEffect, useRef, useCallback } from "react";
import { HeadphonesIcon, Phone, Mail, Clock, Send, History, MessageSquare, CheckCircle, AlertCircle, Loader2, X, User, Headphones, Sparkles, Paperclip, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import SupportChat from "@/components/franqueado/SupportChat";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { playNotificationSound } from "@/utils/notificationSound";
import { showBrowserNotification } from "@/utils/browserNotifications";

// WhatsApp SVG Icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  sender_id: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { 
    label: "Aberto", 
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: <MessageSquare className="h-3 w-3" />
  },
  in_progress: { 
    label: "Em Andamento", 
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: <AlertCircle className="h-3 w-3" />
  },
  resolved: { 
    label: "Resolvido", 
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: <CheckCircle className="h-3 w-3" />
  },
  closed: { 
    label: "Fechado", 
    color: "bg-muted text-muted-foreground border-border",
    icon: <CheckCircle className="h-3 w-3" />
  },
};

export default function Suporte() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("novo");
  
  // Dialog state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Form state for new ticket
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketPriority, setTicketPriority] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketAttachment, setTicketAttachment] = useState<File | null>(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadTickets();
    getUserId();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedTicket || !dialogOpen) return;

    const channel = supabase
      .channel(`ticket-messages-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          const newMsg = payload.new as Message;
          
          // Only play sound for support messages (not user's own)
          if (newMsg.sender_type === 'suporte' && newMsg.sender_id !== userId) {
            playNotificationSound();
            setHasNewMessage(true);
            
            // Show browser notification if page is not visible
            if (document.hidden) {
              showBrowserNotification({
                title: 'Nova mensagem no ticket',
                body: `Suporte respondeu: ${newMsg.content.substring(0, 50)}${newMsg.content.length > 50 ? '...' : ''}`
              });
            }
            
            // Clear indicator after 3 seconds
            setTimeout(() => setHasNewMessage(false), 3000);
          }
          
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, dialogOpen, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !userId) return;

    try {
      setSendingMessage(true);
      const { error } = await supabase
        .from("support_messages")
        .insert({
          conversation_id: selectedTicket.id,
          content: newMessage.trim(),
          sender_id: userId,
          sender_type: "franqueado"
        });

      if (error) throw error;

      setNewMessage("");
      loadMessages(selectedTicket.id);
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

  const handleOpenTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive"
        });
        return;
      }
      setTicketAttachment(file);
    }
  };

  const removeAttachment = () => {
    setTicketAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !ticketSubject.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmittingTicket(true);
      
      let attachmentUrl = null;
      let attachmentName = null;

      // Upload file if present
      if (ticketAttachment) {
        const fileExt = ticketAttachment.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('support-attachments')
          .upload(fileName, ticketAttachment);
        
        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          throw new Error("Erro ao enviar anexo");
        }
        
        const { data: urlData } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(fileName);
        
        attachmentUrl = urlData.publicUrl;
        attachmentName = ticketAttachment.name;
      }

      // Create conversation
      const { error: convError } = await supabase
        .from("support_conversations")
        .insert({
          subject: ticketSubject.trim(),
          franqueado_id: userId,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName
        });

      if (convError) throw convError;

      // Reset form
      setTicketCategory("");
      setTicketPriority("");
      setTicketSubject("");
      setTicketDescription("");
      setTicketAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({
        title: "Ticket enviado!",
        description: "Nossa equipe entrará em contato em breve.",
      });

      // Refresh tickets and switch to history tab
      loadTickets();
      setActiveTab("historico");
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o ticket. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handlePhoneClick = () => {
    window.location.href = "tel:+551130000000";
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/5511999999999?text=Olá! Preciso de suporte.", "_blank");
  };

  const handleEmailClick = () => {
    window.location.href = "mailto:suporte@injediesel.com.br?subject=Suporte Injediesel";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">Entre em contato com nossa equipe de suporte.</p>
      </div>

      {/* Tabs para Novo Ticket e Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="novo" className="flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4" />
            Novo Ticket
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Meus Tickets
            {tickets.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {tickets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Novo Ticket */}
        <TabsContent value="novo" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="relative overflow-hidden border-[hsl(180,100%,40%)]/40 shadow-[0_0_40px_hsl(180,100%,40%,0.15)] bg-gradient-to-br from-[hsl(180,100%,40%)]/5 to-transparent">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(180,100%,40%)]/10 via-transparent to-[hsl(200,100%,50%)]/10 pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(180,100%,40%)]/20 flex items-center justify-center">
                    <HeadphonesIcon className="h-5 w-5 text-[hsl(180,100%,40%)] drop-shadow-[0_0_6px_hsl(180,100%,40%)]" />
                  </div>
                  <span className="text-[hsl(180,100%,50%)] drop-shadow-[0_0_8px_hsl(180,100%,40%,0.5)]">
                    Abrir Ticket de Suporte
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={ticketCategory} onValueChange={setTicketCategory}>
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
                      <Select value={ticketPriority} onValueChange={setTicketPriority}>
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
                    <Label>Assunto *</Label>
                    <Input 
                      placeholder="Descreva brevemente o problema" 
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descreva detalhadamente o problema ou dúvida..."
                      rows={5}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                    />
                  </div>
                  
                  {/* Anexo */}
                  <div className="space-y-2">
                    <Label>Anexo (opcional)</Label>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      {!ticketAttachment ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-dashed border-2 h-16 hover:border-[hsl(180,100%,40%)]/50 hover:bg-[hsl(180,100%,40%)]/5 transition-all"
                        >
                          <Paperclip className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">Clique para anexar arquivo (máx. 10MB)</span>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(180,100%,40%)]/10 border border-[hsl(180,100%,40%)]/30">
                          <div className="w-10 h-10 rounded-lg bg-[hsl(180,100%,40%)]/20 flex items-center justify-center">
                            <FileIcon className="h-5 w-5 text-[hsl(180,100%,40%)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ticketAttachment.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(ticketAttachment.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeAttachment}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      disabled={submittingTicket || !ticketSubject.trim()}
                      className="bg-gradient-to-r from-[hsl(180,100%,35%)] to-[hsl(200,100%,45%)] hover:from-[hsl(180,100%,40%)] hover:to-[hsl(200,100%,50%)] text-white shadow-[0_0_20px_hsl(180,100%,40%,0.4)] hover:shadow-[0_0_30px_hsl(180,100%,40%,0.6)] transition-all duration-300"
                    >
                      {submittingTicket ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="historico" className="space-y-4">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-primary" : ""}
            >
              Todos
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {tickets.length}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === "open" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("open")}
              className={statusFilter === "open" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Aberto
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {tickets.filter(t => t.status === "open").length}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("in_progress")}
              className={statusFilter === "in_progress" ? "bg-yellow-600 hover:bg-yellow-700" : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"}
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Em Andamento
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {tickets.filter(t => t.status === "in_progress").length}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("resolved")}
              className={statusFilter === "resolved" ? "bg-green-600 hover:bg-green-700" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Resolvido
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {tickets.filter(t => t.status === "resolved").length}
              </Badge>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <Card className="p-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Carregando tickets...</span>
                </div>
              </Card>
            ) : tickets.length === 0 ? (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum ticket encontrado</p>
                  <p className="text-sm mt-1">Você ainda não abriu nenhum ticket de suporte.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("novo")}
                  >
                    <HeadphonesIcon className="h-4 w-4 mr-2" />
                    Abrir primeiro ticket
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets
                  .filter(ticket => statusFilter === "all" || ticket.status === statusFilter)
                  .map((ticket, index) => {
                  const status = getStatusConfig(ticket.status);
                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Card 
                        className="hover:border-primary/30 transition-all duration-200 cursor-pointer"
                        onClick={() => handleOpenTicket(ticket)}
                      >
                        <CardContent className="py-4 px-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`${status.color} flex items-center gap-1 text-xs`}
                                >
                                  {status.icon}
                                  {status.label}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Criado: {formatDate(ticket.created_at)}
                                </span>
                                {ticket.updated_at !== ticket.created_at && (
                                  <span className="text-muted-foreground/60">
                                    Atualizado: {formatDate(ticket.updated_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="shrink-0">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Contact Channels - Compacto no Final */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Canais de contato direto</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {/* Telefone - Azul Neon */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card 
              className="cursor-pointer hover:border-[hsl(217,91%,60%)]/50 transition-all duration-300 hover:shadow-[0_0_20px_hsl(217,91%,60%,0.2)]"
              onClick={handlePhoneClick}
            >
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(217,91%,60%)]/15 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-[hsl(217,91%,60%)] drop-shadow-[0_0_4px_hsl(217,91%,60%)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm">Telefone</h4>
                  <p className="text-xs text-muted-foreground truncate">(11) 3000-0000</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  8h-18h
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* WhatsApp - Verde Neon */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card 
              className="cursor-pointer hover:border-[hsl(142,70%,45%)]/50 transition-all duration-300 hover:shadow-[0_0_20px_hsl(142,70%,45%,0.2)]"
              onClick={handleWhatsAppClick}
            >
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(142,70%,45%)]/15 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="h-5 w-5 text-[hsl(142,70%,45%)] drop-shadow-[0_0_4px_hsl(142,70%,45%)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm">WhatsApp</h4>
                  <p className="text-xs text-muted-foreground truncate">(11) 99999-9999</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  8h-18h
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* E-mail - Laranja Neon */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card 
              className="cursor-pointer hover:border-[hsl(25,95%,53%)]/50 transition-all duration-300 hover:shadow-[0_0_20px_hsl(25,95%,53%,0.2)]"
              onClick={handleEmailClick}
            >
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(25,95%,53%)]/15 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[hsl(25,95%,53%)] drop-shadow-[0_0_4px_hsl(25,95%,53%)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm">E-mail</h4>
                  <p className="text-xs text-muted-foreground truncate">suporte@injediesel.com.br</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  24h
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Live Chat Widget */}
      <SupportChat />

      {/* Ticket Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`max-w-2xl max-h-[85vh] flex flex-col p-0 transition-all duration-300 ${hasNewMessage ? 'ring-2 ring-[hsl(180,100%,40%)] shadow-[0_0_30px_hsl(180,100%,40%,0.3)]' : ''}`}>
          <DialogHeader className="p-6 pb-4 border-b border-border/50 relative">
            {/* New message indicator */}
            {hasNewMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(180,100%,40%)]/20 border border-[hsl(180,100%,40%)]/40"
              >
                <Sparkles className="h-3.5 w-3.5 text-[hsl(180,100%,40%)] animate-pulse" />
                <span className="text-xs font-medium text-[hsl(180,100%,40%)]">Nova mensagem</span>
              </motion.div>
            )}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold mb-2">
                  {selectedTicket?.subject}
                </DialogTitle>
                {selectedTicket && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`${getStatusConfig(selectedTicket.status).color} flex items-center gap-1 text-xs`}
                    >
                      {getStatusConfig(selectedTicket.status).icon}
                      {getStatusConfig(selectedTicket.status).label}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Criado: {formatDate(selectedTicket.created_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-6">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Carregando mensagens...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-sm mt-1">Envie uma mensagem para iniciar a conversa.</p>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  {groupMessagesByDate(messages).map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Date separator */}
                      <div className="flex items-center gap-3 my-4">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground px-2">
                          {formatMessageDate(group.date)}
                        </span>
                        <Separator className="flex-1" />
                      </div>

                      {/* Messages */}
                      {group.messages.map((msg) => {
                        const isUser = msg.sender_type === "franqueado";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
                          >
                            <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isUser 
                                  ? "bg-primary/20" 
                                  : "bg-[hsl(180,100%,40%)]/20"
                              }`}>
                                {isUser ? (
                                  <User className="h-4 w-4 text-primary" />
                                ) : (
                                  <Headphones className="h-4 w-4 text-[hsl(180,100%,40%)]" />
                                )}
                              </div>
                              <div className={`rounded-2xl px-4 py-2 ${
                                isUser 
                                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                                  : "bg-muted rounded-bl-sm"
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <span className={`text-[10px] mt-1 block ${
                                  isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}>
                                  {formatMessageTime(msg.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border/50 bg-background/50">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendingMessage}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
