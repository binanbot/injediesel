import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/utils/notificationSound";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "franqueado" | "suporte";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  franqueado_id: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export function useSupportChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("franqueado_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas.",
        variant: "destructive",
      });
    } else {
      setConversations(data as Conversation[]);
    }
    setLoading(false);
  }, [userId, toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(async () => {
    if (!activeConversation) return;

    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", activeConversation.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data as Message[]);
    }
  }, [activeConversation]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`support-messages-${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          // Play notification sound if message is from support
          if (newMessage.sender_type === "suporte") {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  // Create new conversation
  const createConversation = async (subject: string): Promise<Conversation | null> => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para iniciar uma conversa.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("support_conversations")
      .insert({
        franqueado_id: userId,
        subject,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conversa.",
        variant: "destructive",
      });
      return null;
    }

    const newConversation = data as Conversation;
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversation(newConversation);
    return newConversation;
  };

  // Send message
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!activeConversation || !userId) {
      toast({
        title: "Erro",
        description: "Selecione ou inicie uma conversa primeiro.",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: activeConversation.id,
        sender_id: userId,
        sender_type: "franqueado",
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
    conversations,
    activeConversation,
    messages,
    loading,
    userId,
    setActiveConversation,
    createConversation,
    sendMessage,
    loadConversations,
  };
}
