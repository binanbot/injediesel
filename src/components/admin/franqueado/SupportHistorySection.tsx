import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Clock, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversation {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages_count?: number;
}

interface SupportHistorySectionProps {
  userId: string;
}

export function SupportHistorySection({ userId }: SupportHistorySectionProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_conversations")
        .select(`
          *,
          messages:support_messages(count)
        `)
        .eq("franqueado_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const conversationsWithCounts = (data || []).map(c => ({
        ...c,
        messages_count: c.messages?.[0]?.count || 0,
      }));

      setConversations(conversationsWithCounts);
    } catch (error) {
      console.error("Erro ao carregar histórico de suporte:", error);
      toast.error("Erro ao carregar histórico de suporte");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open":
        return {
          label: "Aberto",
          variant: "default" as const,
          icon: AlertCircle,
          color: "text-amber-500",
        };
      case "closed":
        return {
          label: "Fechado",
          variant: "secondary" as const,
          icon: CheckCircle,
          color: "text-emerald-500",
        };
      case "in_progress":
        return {
          label: "Em andamento",
          variant: "outline" as const,
          icon: Clock,
          color: "text-blue-500",
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          icon: MessageSquare,
          color: "text-muted-foreground",
        };
    }
  };

  const stats = {
    total: conversations.length,
    open: conversations.filter(c => c.status === "open").length,
    closed: conversations.filter(c => c.status === "closed").length,
    totalMessages: conversations.reduce((acc, c) => acc + (c.messages_count || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Tickets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Aberto</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolvidos</p>
                <p className="text-2xl font-bold">{stats.closed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mensagens</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Chamados</CardTitle>
          <CardDescription>
            Todos os chamados de suporte deste franqueado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum chamado de suporte registrado
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {conversations.map((conversation) => {
                  const statusConfig = getStatusConfig(conversation.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={conversation.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full bg-muted ${statusConfig.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">
                            {conversation.subject}
                          </h4>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Criado em {format(new Date(conversation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span>•</span>
                          <span>
                            {conversation.messages_count || 0} mensagens
                          </span>
                          <span>•</span>
                          <span>
                            Última atividade: {format(new Date(conversation.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
