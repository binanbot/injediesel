import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Plus, X, Loader2, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSupportChat, type Message, type Conversation } from "@/hooks/useSupportChat";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { requestNotificationPermission, canShowNotifications } from "@/utils/browserNotifications";
import { useToast } from "@/hooks/use-toast";

export default function SupportChat() {
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    userId,
    setActiveConversation,
    createConversation,
    sendMessage,
  } = useSupportChat();

  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(canShowNotifications());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      toast({
        title: "Notificações ativadas",
        description: "Você receberá alertas quando o suporte responder.",
      });
    } else {
      toast({
        title: "Permissão negada",
        description: "Ative as notificações nas configurações do navegador.",
        variant: "destructive",
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const success = await sendMessage(newMessage.trim());
    if (success) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleCreateConversation = async () => {
    if (!newSubject.trim()) return;
    const conversation = await createConversation(newSubject.trim());
    if (conversation) {
      setNewSubject("");
      setIsCreatingConversation(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  if (!userId) {
    return null;
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            isOpen
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-primary hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="border-2 shadow-2xl overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5" />
                    Chat ao Vivo
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={handleEnableNotifications}
                    title={notificationsEnabled ? "Notificações ativadas" : "Ativar notificações"}
                  >
                    {notificationsEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Conversation List / Chat View */}
                {!activeConversation ? (
                  <div className="h-[400px] flex flex-col">
                    {/* New Conversation Form */}
                    {isCreatingConversation ? (
                      <div className="p-4 border-b bg-muted/30">
                        <p className="text-sm font-medium mb-2">Nova conversa</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Assunto..."
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateConversation()}
                          />
                          <Button size="sm" onClick={handleCreateConversation}>
                            Criar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsCreatingConversation(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-b">
                        <Button
                          className="w-full"
                          onClick={() => setIsCreatingConversation(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Conversa
                        </Button>
                      </div>
                    )}

                    {/* Conversations List */}
                    <ScrollArea className="flex-1">
                      {loading ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                          <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Nenhuma conversa ainda.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Inicie uma nova conversa com nosso suporte!
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {conversations.map((conv) => (
                            <ConversationItem
                              key={conv.id}
                              conversation={conv}
                              onClick={() => setActiveConversation(conv)}
                            />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="h-[400px] flex flex-col">
                    {/* Active Conversation Header */}
                    <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveConversation(null)}
                      >
                        ←
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {activeConversation.subject}
                        </p>
                        <Badge
                          variant={activeConversation.status === "open" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {activeConversation.status === "open" ? "Aberto" : "Fechado"}
                        </Badge>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground py-8">
                            Envie uma mensagem para iniciar a conversa.
                          </p>
                        ) : (
                          messages.map((msg) => (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              isOwn={msg.sender_id === userId}
                            />
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    {activeConversation.status === "open" && (
                      <div className="p-3 border-t bg-background">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Digite sua mensagem..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            disabled={sending}
                          />
                          <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={sending || !newMessage.trim()}
                          >
                            {sending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ConversationItem({
  conversation,
  onClick,
}: {
  conversation: Conversation;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm truncate flex-1">{conversation.subject}</p>
        <Badge
          variant={conversation.status === "open" ? "default" : "secondary"}
          className="text-xs shrink-0"
        >
          {conversation.status === "open" ? "Aberto" : "Fechado"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(conversation.updated_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </button>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            "text-xs mt-1",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {new Date(message.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
