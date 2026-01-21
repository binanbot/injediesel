import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MailOpen, Heart, ArrowLeft, Clock, AlertTriangle, Info, Megaphone, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MessageCategory = "critico" | "informativo" | "marketing";

const categoryConfig: Record<MessageCategory, { label: string; icon: React.ReactNode; badgeClass: string; borderClass: string }> = {
  critico: {
    label: "Crítico",
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeClass: "bg-destructive/20 text-destructive border-destructive/30",
    borderClass: "border-l-4 border-l-destructive",
  },
  informativo: {
    label: "Informativo",
    icon: <Info className="h-4 w-4" />,
    badgeClass: "bg-info/20 text-info border-info/30",
    borderClass: "border-l-4 border-l-info",
  },
  marketing: {
    label: "Marketing",
    icon: <Megaphone className="h-4 w-4" />,
    badgeClass: "bg-success/20 text-success border-success/30",
    borderClass: "border-l-4 border-l-success",
  },
};

const mensagens = [
  {
    id: 1,
    titulo: "Novo recurso disponível",
    resumo: "Agora você pode acompanhar o status dos seus arquivos em tempo real.",
    conteudo: "Olá!\n\nTemos o prazer de anunciar um novo recurso em nossa plataforma. Agora você pode acompanhar o status dos seus arquivos em tempo real, recebendo notificações instantâneas quando houver qualquer atualização.\n\nPara ativar este recurso, acesse as configurações do seu perfil e habilite as notificações push.\n\nAtenciosamente,\nEquipe Injediesel",
    data: "28/12/2024",
    lida: false,
    curtidas: 45,
    categoria: "informativo" as MessageCategory,
  },
  {
    id: 2,
    titulo: "Manutenção programada",
    resumo: "O sistema ficará indisponível no dia 01/01 das 02h às 06h.",
    conteudo: "Prezado franqueado,\n\nInformamos que haverá uma manutenção programada em nosso sistema no dia 01/01/2025, das 02h às 06h (horário de Brasília).\n\nDurante este período, o sistema ficará indisponível. Pedimos desculpas pelo inconveniente.\n\nAtenciosamente,\nEquipe Injediesel",
    data: "27/12/2024",
    lida: false,
    curtidas: 12,
    categoria: "critico" as MessageCategory,
  },
  {
    id: 3,
    titulo: "Feliz Natal!",
    resumo: "A equipe Injediesel deseja um Feliz Natal a todos os franqueados.",
    conteudo: "Querido franqueado,\n\nA equipe Injediesel deseja a você e sua família um Feliz Natal repleto de paz, amor e prosperidade!\n\nAgradecemos pela parceria durante todo o ano e esperamos continuar crescendo juntos em 2025.\n\nBoas festas!\n\nEquipe Injediesel",
    data: "25/12/2024",
    lida: true,
    curtidas: 87,
    categoria: "marketing" as MessageCategory,
  },
  {
    id: 4,
    titulo: "Atualização de preços",
    resumo: "Confira a nova tabela de preços válida a partir de janeiro.",
    conteudo: "Prezado franqueado,\n\nInformamos que a partir de 01/01/2025, entrarão em vigor os novos preços de nossos serviços.\n\nA nova tabela de preços está disponível na área de downloads do sistema. Caso tenha dúvidas, entre em contato com nosso suporte.\n\nAtenciosamente,\nEquipe Injediesel",
    data: "20/12/2024",
    lida: true,
    curtidas: 23,
    categoria: "critico" as MessageCategory,
  },
];

export default function Mensagens() {
  const [selectedMessage, setSelectedMessage] = useState<typeof mensagens[0] | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<number>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredMensagens = categoryFilter === "all" 
    ? mensagens 
    : mensagens.filter(m => m.categoria === categoryFilter);

  const handleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Detail View (kept mounted to avoid portal/unmount race conditions) */}
      <div hidden={!selectedMessage}>
        {selectedMessage && (() => {
          const config = categoryConfig[selectedMessage.categoria];
          return (
            <>
              <Button variant="ghost" onClick={() => setSelectedMessage(null)}>
                <ArrowLeft className="h-4 w-4" />
                Voltar para mensagens
              </Button>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={config.borderClass}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${config.badgeClass} flex items-center gap-1`}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{selectedMessage.titulo}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {selectedMessage.data}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={likedMessages.has(selectedMessage.id) ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => handleLike(selectedMessage.id, e)}
                      >
                        <Heart className={`h-4 w-4 ${likedMessages.has(selectedMessage.id) ? "fill-current" : ""}`} />
                        {selectedMessage.curtidas + (likedMessages.has(selectedMessage.id) ? 1 : 0)}
                      </Button>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      {selectedMessage.conteudo.split("\n").map((line, i) => (
                        <p key={i} className={line === "" ? "mb-4" : "mb-2"}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          );
        })()}
      </div>

      {/* List View */}
      <div hidden={!!selectedMessage}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mensagens</h1>
            <p className="text-muted-foreground">Acompanhe as últimas novidades e comunicados.</p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              open={filterOpen}
              onOpenChange={setFilterOpen}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="critico">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Crítico
                  </span>
                </SelectItem>
                <SelectItem value="informativo">
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-info" />
                    Informativo
                  </span>
                </SelectItem>
                <SelectItem value="marketing">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-success" />
                    Marketing
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {filteredMensagens.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma mensagem encontrada nesta categoria.
              </CardContent>
            </Card>
          ) : (
            filteredMensagens.map((mensagem) => {
              const config = categoryConfig[mensagem.categoria];
              return (
                <motion.div key={mensagem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    className={`cursor-pointer hover:border-primary/50 transition-all ${config.borderClass} ${
                      !mensagem.lida ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      // Ensure Select portal is closed before swapping UI tree
                      setFilterOpen(false);
                      setSelectedMessage(mensagem);
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${mensagem.lida ? "bg-secondary" : "bg-primary/20"}`}>
                          {mensagem.lida ? (
                            <MailOpen className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Mail className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${config.badgeClass} flex items-center gap-1 text-xs`}>
                                  {config.icon}
                                  {config.label}
                                </Badge>
                                {!mensagem.lida && (
                                  <Badge variant="default" className="text-xs">
                                    Nova
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold">{mensagem.titulo}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{mensagem.resumo}</p>
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{mensagem.data}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <button
                              onClick={(e) => handleLike(mensagem.id, e)}
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  likedMessages.has(mensagem.id) ? "fill-primary text-primary" : ""
                                }`}
                              />
                              {mensagem.curtidas + (likedMessages.has(mensagem.id) ? 1 : 0)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
