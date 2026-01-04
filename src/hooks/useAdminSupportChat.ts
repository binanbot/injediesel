import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/utils/notificationSound";
import { showBrowserNotification } from "@/utils/browserNotifications";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "franqueado" | "suporte";
  content: string;
  created_at: string;
}

export function useAdminSupportChat(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // Load messages for conversation
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      const msgs = data as Message[];
      setMessages(msgs);
      // Count messages from franqueado that are newer than lastReadTime
      const unread = msgs.filter(
        m => m.sender_type === "franqueado" && 
        (!lastReadTime || new Date(m.created_at) > lastReadTime)
      ).length;
      setUnreadCount(unread);
    }
    setLoading(false);
  }, [conversationId, lastReadTime]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`admin-support-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          // Increment unread and play sound if from franqueado
          if (newMessage.sender_type === "franqueado") {
            setUnreadCount(prev => prev + 1);
            playNotificationSound();
            showBrowserNotification({
              title: "Nova mensagem do franqueado",
              body: newMessage.content.slice(0, 100) + (newMessage.content.length > 100 ? "..." : ""),
              tag: `msg-${newMessage.id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    setLastReadTime(new Date());
    setUnreadCount(0);
  }, []);

  // Send message as support
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!conversationId || !userId) {
      toast({
        title: "Erro",
        description: "Conversa não encontrada.",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_type: "suporte",
        content,
      });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return {
    messages,
    loading,
    userId,
    unreadCount,
    sendMessage,
    loadMessages,
    markAsRead,
  };
}
