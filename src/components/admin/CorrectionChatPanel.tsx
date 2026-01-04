import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminSupportChat, type Message } from "@/hooks/useAdminSupportChat";
import { cn } from "@/lib/utils";

interface CorrectionChatPanelProps {
  conversationId: string | null;
  onUnreadCountChange?: (count: number) => void;
  isActive?: boolean;
}

export default function CorrectionChatPanel({ 
  conversationId, 
  onUnreadCountChange,
  isActive = false 
}: CorrectionChatPanelProps) {
  const {
    messages,
    loading,
    userId,
    unreadCount,
    sendMessage,
    markAsRead,
  } = useAdminSupportChat(conversationId);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Notify parent of unread count changes
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Mark as read when chat becomes active
  useEffect(() => {
    if (isActive && unreadCount > 0) {
      markAsRead();
    }
  }, [isActive, unreadCount, markAsRead]);

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

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
        <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Nenhuma conversa vinculada a este ticket.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhuma mensagem ainda. Inicie a conversa!
            </p>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_type === "suporte"}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 border-t border-border/30 bg-background/50">
        <div className="flex gap-2">
          <Input
            placeholder="Responder ao franqueado..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending}
            className="bg-secondary/30"
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
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-xs font-medium",
            isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {isOwn ? "Suporte" : "Franqueado"}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            "text-xs mt-1",
            isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
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
