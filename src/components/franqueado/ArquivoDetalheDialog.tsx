import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Download,
  User,
  Car,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Gauge,
  Settings,
  Tag,
  AlertCircle,
  X,
  Upload,
  Loader2,
  Paperclip,
} from "lucide-react";

export interface ArquivoDetalhado {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano?: string;
  cambio?: string;
  combustivel?: string;
  horasKm?: string;
  servico: string;
  status: string;
  data: string;
  categoria?: string;
  valor?: string;
  cliente?: {
    nome: string;
    telefone: string;
    email: string;
    cidade?: string;
    servicosAnteriores?: number;
  };
  observacoes?: string;
}

interface ArquivoDetalheDialogProps {
  arquivo: ArquivoDetalhado | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSolicitarCorrecao?: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-success/20 text-success border-success/30">Concluído</Badge>;
    case "processing":
      return <Badge className="bg-warning/20 text-warning border-warning/30">Processando</Badge>;
    case "cancelled":
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Cancelado</Badge>;
    default:
      return <Badge className="bg-muted/20 text-muted-foreground border-muted/30">Pendente</Badge>;
  }
};

export function ArquivoDetalheDialog({ arquivo, open, onOpenChange, onSolicitarCorrecao }: ArquivoDetalheDialogProps) {
  const [showCorrecao, setShowCorrecao] = useState(false);
  const [correcaoMotivo, setCorrecaoMotivo] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!arquivo) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSolicitarCorrecao = async () => {
    if (!correcaoMotivo.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva o motivo da correção.",
        variant: "destructive",
      });
      return;
    }

    if (correcaoMotivo.trim().length < 10) {
      toast({
        title: "Descrição muito curta",
        description: "Por favor, forneça mais detalhes sobre a correção necessária.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      let arquivoAnexoUrl: string | null = null;

      // Upload do arquivo se existir
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${arquivo.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('correction-files')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Erro no upload",
            description: "Não foi possível enviar o arquivo. Tente novamente.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        // Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
          .from('correction-files')
          .getPublicUrl(fileName);

        arquivoAnexoUrl = urlData.publicUrl;
      }

      // Criar conversa de suporte vinculada ao ticket
      const { data: conversationData, error: conversationError } = await supabase
        .from('support_conversations')
        .insert({
          franqueado_id: user.id,
          subject: `Correção: ${arquivo.placa} - ${arquivo.servico}`,
          status: 'open'
        })
        .select()
        .single();

      let conversationId: string | null = null;
      if (!conversationError && conversationData) {
        conversationId = conversationData.id;

        // Enviar primeira mensagem com o motivo da correção
        await supabase
          .from('support_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            sender_type: 'franqueado',
            content: `📋 **Solicitação de Correção**\n\n**Veículo:** ${arquivo.marca} ${arquivo.modelo}\n**Placa:** ${arquivo.placa}\n**Serviço:** ${arquivo.servico}\n\n**Descrição do problema:**\n${correcaoMotivo.trim()}${arquivoAnexoUrl ? '\n\n📎 Arquivo anexado' : ''}`
          });
      }

      // Criar ticket de correção com link para a conversa
      const { error: insertError } = await supabase
        .from('correction_tickets')
        .insert({
          arquivo_id: String(arquivo.id),
          franqueado_id: user.id,
          motivo: correcaoMotivo.trim(),
          arquivo_anexo_url: arquivoAnexoUrl,
          status: 'aberto',
          conversation_id: conversationId
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast({
          title: "Erro ao criar solicitação",
          description: "Não foi possível criar a solicitação. Tente novamente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de correção foi enviada com sucesso. Nossa equipe irá analisar em breve.",
      });
      
      // Resetar estado
      setShowCorrecao(false);
      setCorrecaoMotivo("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowCorrecao(false);
    setCorrecaoMotivo("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col glass-card border-border/30 p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes do Arquivo
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-5 py-4">
            {/* Status e Data */}
            <div className="flex items-center justify-between">
              {getStatusBadge(arquivo.status)}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {arquivo.data}
              </span>
            </div>

            {/* Informações do Veículo */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Veículo
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Placa</p>
                  <p className="font-medium text-foreground">{arquivo.placa}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Marca/Modelo</p>
                  <p className="font-medium text-foreground">{arquivo.marca} {arquivo.modelo}</p>
                </div>
                {arquivo.ano && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Ano</p>
                    <p className="font-medium text-foreground">{arquivo.ano}</p>
                  </div>
                )}
                {arquivo.cambio && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Câmbio</p>
                    <p className="font-medium text-foreground">{arquivo.cambio}</p>
                  </div>
                )}
                {arquivo.combustivel && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Combustível</p>
                    <p className="font-medium text-foreground">{arquivo.combustivel}</p>
                  </div>
                )}
                {arquivo.horasKm && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Gauge className="h-3 w-3" /> Horas/Km
                    </p>
                    <p className="font-medium text-foreground">{arquivo.horasKm}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Serviço */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Serviço
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Descrição</p>
                  <p className="font-medium text-foreground">{arquivo.servico}</p>
                </div>
                {arquivo.categoria && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Categoria
                    </p>
                    <p className="font-medium text-foreground">{arquivo.categoria}</p>
                  </div>
                )}
                {arquivo.valor && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium text-primary">{arquivo.valor}</p>
                  </div>
                )}
              </div>
              {arquivo.observacoes && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Observações</p>
                  <p className="text-sm text-foreground bg-secondary/30 p-2 rounded-lg">{arquivo.observacoes}</p>
                </div>
              )}
            </div>

            {/* Cliente */}
            {arquivo.cliente && (
              <>
                <Separator className="bg-border/30" />
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Nome</p>
                      <p className="font-medium text-foreground">{arquivo.cliente.nome}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Telefone
                      </p>
                      <p className="font-medium text-foreground">{arquivo.cliente.telefone}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </p>
                      <p className="font-medium text-foreground">{arquivo.cliente.email}</p>
                    </div>
                    {arquivo.cliente.cidade && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Cidade
                        </p>
                        <p className="font-medium text-foreground">{arquivo.cliente.cidade}</p>
                      </div>
                    )}
                    {arquivo.cliente.servicosAnteriores !== undefined && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Serviços Anteriores</p>
                        <p className="font-medium text-foreground">{arquivo.cliente.servicosAnteriores}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Formulário de Correção */}
            {showCorrecao && (
              <>
                <Separator className="bg-border/30" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Solicitar Correção
                    </h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowCorrecao(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Campo de descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="correcao-motivo">Descreva o problema ou correção necessária *</Label>
                    <Textarea
                      id="correcao-motivo"
                      placeholder="Detalhe o motivo da solicitação de correção..."
                      value={correcaoMotivo}
                      onChange={(e) => setCorrecaoMotivo(e.target.value)}
                      className="min-h-[100px] bg-secondary/30"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo de 10 caracteres</p>
                  </div>

                  {/* Upload de arquivo */}
                  <div className="space-y-2">
                    <Label>Anexar arquivo (opcional)</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".bin,.ori,.mod,.zip,.rar,.pdf,.jpg,.jpeg,.png"
                      disabled={isSubmitting}
                    />
                    
                    {selectedFile ? (
                      <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-border/30">
                        <Paperclip className="h-4 w-4 text-primary" />
                        <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={handleRemoveFile}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar arquivo
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: .bin, .ori, .mod, .zip, .rar, .pdf, .jpg, .png (máx. 10MB)
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer fixo */}
        <DialogFooter className="px-6 py-4 border-t border-border/30 bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {showCorrecao ? (
              <>
                <Button 
                  variant="warning" 
                  className="flex-1" 
                  onClick={handleSolicitarCorrecao}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowCorrecao(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                {arquivo.status === "completed" && (
                  <Button variant="hero" className="flex-1">
                    <Download className="h-4 w-4" />
                    Baixar Arquivo
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1 border-warning/30 text-warning hover:bg-warning/10"
                  onClick={() => {
                    setShowCorrecao(true);
                    // Trigger scroll and highlight on parent
                    onSolicitarCorrecao?.();
                  }}
                >
                  <AlertCircle className="h-4 w-4" />
                  Solicitar Correção
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Fechar
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
