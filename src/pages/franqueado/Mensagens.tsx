import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MailOpen, Heart, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mensagens = [
  {
    id: 1,
    titulo: "Novo recurso disponível",
    resumo: "Agora você pode acompanhar o status dos seus arquivos em tempo real.",
    conteudo: "Olá!\n\nTemos o prazer de anunciar um novo recurso em nossa plataforma. Agora você pode acompanhar o status dos seus arquivos em tempo real, recebendo notificações instantâneas quando houver qualquer atualização.\n\nPara ativar este recurso, acesse as configurações do seu perfil e habilite as notificações push.\n\nAtenciosamente,\nEquipe Injediesel",
    data: "28/12/2024",
    lida: false,
    curtidas: 45,
  },
  {
    id: 2,
    titulo: "Manutenção programada",
    resumo: "O sistema ficará indisponível no dia 01/01 das 02h às 06h.",
    conteudo: "Prezado franqueado,\n\nInformamos que haverá uma manutenção programada em nosso sistema no dia 01/01/2025, das 02h às 06h (horário de Brasília).\n\nDurante este período, o sistema ficará indisponível. Pedimos desculpas pelo inconveniente.\n\nAtenciosamente,\nEquipe Injediesel",
    data: "27/12/2024",
    lida: false,
    curtidas: 12,
  },
  {
    id: 3,
    titulo: "Feliz Natal!",
    resumo: "A equipe Injediesel deseja um Feliz Natal a todos os franqueados.",
    conteudo: "Querido franqueado,\n\nA equipe Injediesel deseja a você e sua família um Feliz Natal repleto de paz, amor e prosperidade!\n\nAgradecemos pela parceria durante todo o ano e esperamos continuar crescendo juntos em 2025.\n\nBoas festas!\n\nEquipe Injediesel",
    data: "25/12/2024",
    lida: true,
    curtidas: 87,
  },
  {
    id: 4,
    titulo: "Atualização de preços",
    resumo: "Confira a nova tabela de preços válida a partir de janeiro.",
    conteudo: "Prezado franqueado,\n\nInformamos que a partir de 01/01/2025, entrarão em vigor os novos preços de nossos serviços.\n\nA nova tabela de preços está disponível na área de downloads do sistema. Caso tenha dúvidas, entre em contato com nosso suporte.\n\nAtenciosamente,\nEquipe Injediesel",
    data: "20/12/2024",
    lida: true,
    curtidas: 23,
  },
];

export default function Mensagens() {
  const [selectedMessage, setSelectedMessage] = useState<typeof mensagens[0] | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<number>>(new Set());

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

  if (selectedMessage) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedMessage(null)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para mensagens
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
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
                {selectedMessage.conteudo.split('\n').map((line, i) => (
                  <p key={i} className={line === '' ? 'mb-4' : 'mb-2'}>{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <p className="text-muted-foreground">Acompanhe as últimas novidades e comunicados.</p>
      </div>

      <div className="space-y-4">
        {mensagens.map((mensagem) => (
          <motion.div
            key={mensagem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              className={`cursor-pointer hover:border-primary/50 transition-all ${
                !mensagem.lida ? "border-primary/30 bg-primary/5" : ""
              }`}
              onClick={() => setSelectedMessage(mensagem)}
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
                        <h3 className="font-semibold flex items-center gap-2">
                          {mensagem.titulo}
                          {!mensagem.lida && (
                            <Badge variant="default" className="text-xs">Nova</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{mensagem.resumo}</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {mensagem.data}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={(e) => handleLike(mensagem.id, e)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Heart className={`h-4 w-4 ${likedMessages.has(mensagem.id) ? "fill-primary text-primary" : ""}`} />
                        {mensagem.curtidas + (likedMessages.has(mensagem.id) ? 1 : 0)}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
