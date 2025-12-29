import { 
  MessageSquare, 
  UserPlus, 
  Flag, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineEventType = 
  | "mensagem_franqueado" 
  | "mensagem_suporte" 
  | "atribuicao" 
  | "prioridade" 
  | "status" 
  | "criacao";

interface TimelineEvent {
  id: number;
  tipo: TimelineEventType;
  conteudo: string;
  autor: string;
  data: string;
  hora: string;
  detalhes?: string;
}

interface TicketTimelineProps {
  ticketId: number;
}

// Mock data - will be replaced with real data
const getTimelineEvents = (ticketId: number): TimelineEvent[] => {
  const eventsByTicket: Record<number, TimelineEvent[]> = {
    1: [
      {
        id: 1,
        tipo: "criacao",
        conteudo: "Chamado aberto",
        autor: "João Silva",
        data: "28/12/2024",
        hora: "09:15",
        detalhes: "Erro ao enviar arquivo",
      },
      {
        id: 2,
        tipo: "mensagem_franqueado",
        conteudo: "Estou recebendo erro 500 ao tentar enviar arquivos maiores que 10MB. Já tentei em diferentes navegadores mas o problema persiste.",
        autor: "João Silva",
        data: "28/12/2024",
        hora: "09:15",
      },
      {
        id: 3,
        tipo: "prioridade",
        conteudo: "Prioridade alterada para Alta",
        autor: "Sistema",
        data: "28/12/2024",
        hora: "09:20",
      },
      {
        id: 4,
        tipo: "mensagem_suporte",
        conteudo: "Olá João, estamos analisando o problema. Pode nos informar qual o tamanho exato do arquivo que está tentando enviar?",
        autor: "Ana Suporte",
        data: "28/12/2024",
        hora: "10:30",
      },
      {
        id: 5,
        tipo: "mensagem_franqueado",
        conteudo: "O arquivo tem aproximadamente 15MB. É um arquivo de calibração de ECU.",
        autor: "João Silva",
        data: "28/12/2024",
        hora: "11:00",
      },
    ],
    2: [
      {
        id: 1,
        tipo: "criacao",
        conteudo: "Chamado aberto",
        autor: "Maria Santos",
        data: "27/12/2024",
        hora: "14:00",
        detalhes: "Dúvida sobre nova funcionalidade",
      },
      {
        id: 2,
        tipo: "mensagem_franqueado",
        conteudo: "Como faço para utilizar o novo recurso de acompanhamento em tempo real?",
        autor: "Maria Santos",
        data: "27/12/2024",
        hora: "14:00",
      },
      {
        id: 3,
        tipo: "atribuicao",
        conteudo: "Chamado atribuído para Ana Suporte",
        autor: "Carlos Admin",
        data: "27/12/2024",
        hora: "14:15",
      },
      {
        id: 4,
        tipo: "status",
        conteudo: "Status alterado para Em Andamento",
        autor: "Ana Suporte",
        data: "27/12/2024",
        hora: "14:20",
      },
      {
        id: 5,
        tipo: "mensagem_suporte",
        conteudo: "Olá Maria! O recurso de acompanhamento em tempo real está disponível na aba 'Meus Arquivos'. Após enviar um arquivo, você verá um indicador de status que atualiza automaticamente.",
        autor: "Ana Suporte",
        data: "27/12/2024",
        hora: "14:25",
      },
      {
        id: 6,
        tipo: "mensagem_franqueado",
        conteudo: "Obrigada! Mas não estou vendo essa opção. Pode me enviar um print de onde fica?",
        autor: "Maria Santos",
        data: "27/12/2024",
        hora: "15:00",
      },
      {
        id: 7,
        tipo: "mensagem_suporte",
        conteudo: "Claro! Vou preparar um guia visual e enviar para você. Aguarde um momento.",
        autor: "Ana Suporte",
        data: "27/12/2024",
        hora: "15:10",
      },
    ],
    4: [
      {
        id: 1,
        tipo: "criacao",
        conteudo: "Chamado aberto",
        autor: "Ana Paula",
        data: "25/12/2024",
        hora: "08:00",
        detalhes: "Problema com download de arquivos",
      },
      {
        id: 2,
        tipo: "mensagem_franqueado",
        conteudo: "Os arquivos processados não estão sendo baixados corretamente. O download inicia mas para no meio.",
        autor: "Ana Paula",
        data: "25/12/2024",
        hora: "08:00",
      },
      {
        id: 3,
        tipo: "prioridade",
        conteudo: "Prioridade alterada para Urgente",
        autor: "Sistema",
        data: "25/12/2024",
        hora: "08:05",
      },
    ],
  };

  return eventsByTicket[ticketId] || [
    {
      id: 1,
      tipo: "criacao",
      conteudo: "Chamado aberto",
      autor: "Franqueado",
      data: "24/12/2024",
      hora: "10:00",
    },
  ];
};

const eventConfig: Record<TimelineEventType, { icon: React.ElementType; color: string; bgColor: string }> = {
  mensagem_franqueado: { icon: User, color: "text-slate-400", bgColor: "bg-slate-500/20" },
  mensagem_suporte: { icon: MessageSquare, color: "text-primary", bgColor: "bg-primary/20" },
  atribuicao: { icon: UserPlus, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  prioridade: { icon: Flag, color: "text-amber-400", bgColor: "bg-amber-500/20" },
  status: { icon: Clock, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  criacao: { icon: AlertCircle, color: "text-green-400", bgColor: "bg-green-500/20" },
};

export function TicketTimeline({ ticketId }: TicketTimelineProps) {
  const events = getTimelineEvents(ticketId);

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        Histórico do Chamado
      </h4>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {events.map((event, index) => {
            const config = eventConfig[event.tipo];
            const Icon = config.icon;
            const isMessage = event.tipo === "mensagem_franqueado" || event.tipo === "mensagem_suporte";
            
            return (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-2 w-5 h-5 rounded-full flex items-center justify-center",
                  config.bgColor
                )}>
                  <Icon className={cn("h-3 w-3", config.color)} />
                </div>
                
                <div className={cn(
                  "rounded-lg p-3",
                  isMessage ? "bg-secondary/50 border border-border" : "bg-transparent"
                )}>
                  {isMessage ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-sm font-medium",
                          event.tipo === "mensagem_suporte" ? "text-primary" : "text-foreground"
                        )}>
                          {event.autor}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {event.data} às {event.hora}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.conteudo}</p>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium", config.color)}>
                          {event.conteudo}
                        </span>
                        {event.detalhes && (
                          <span className="text-xs text-muted-foreground">
                            - {event.detalhes}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.data} às {event.hora}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
