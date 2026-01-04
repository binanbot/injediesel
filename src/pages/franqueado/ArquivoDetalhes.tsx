import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar, 
  Car, 
  User, 
  DollarSign,
  AlertTriangle,
  Upload,
  Send,
  Loader2,
  Paperclip,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// Mock data - será substituído por dados reais
const arquivosMock: Record<string, {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  servico: string;
  status: string;
  data: string;
  cliente: string;
  valor: number;
  categorias: string[];
  descricao: string;
  horasKm: string;
  arquivoOriginal: string;
  arquivoModificado?: string;
}> = {
  "1": { 
    id: 1, 
    placa: "ABC-1234", 
    marca: "Volvo", 
    modelo: "FH 540", 
    servico: "Stage 1", 
    status: "completed", 
    data: "28/12/2024",
    cliente: "João Silva",
    valor: 1500,
    categorias: ["Caminhão"],
    descricao: "Remapeamento Stage 1 para aumento de potência e torque",
    horasKm: "450.000 km",
    arquivoOriginal: "volvo_fh540_original.bin",
    arquivoModificado: "volvo_fh540_stage1.bin"
  },
  "2": { 
    id: 2, 
    placa: "DEF-5678", 
    marca: "Scania", 
    modelo: "R 450", 
    servico: "DPF Off", 
    status: "processing", 
    data: "28/12/2024",
    cliente: "Maria Santos",
    valor: 2000,
    categorias: ["Caminhão"],
    descricao: "Remoção do DPF e ajuste de parâmetros",
    horasKm: "320.000 km",
    arquivoOriginal: "scania_r450_original.bin"
  },
  "3": { 
    id: 3, 
    placa: "GHI-9012", 
    marca: "Mercedes", 
    modelo: "Actros", 
    servico: "EGR Off", 
    status: "completed", 
    data: "27/12/2024",
    cliente: "Carlos Oliveira",
    valor: 1800,
    categorias: ["Caminhão"],
    descricao: "Desativação do sistema EGR",
    horasKm: "280.000 km",
    arquivoOriginal: "mercedes_actros_original.bin",
    arquivoModificado: "mercedes_actros_egr_off.bin"
  },
  "4": { 
    id: 4, 
    placa: "JKL-3456", 
    marca: "DAF", 
    modelo: "XF 105", 
    servico: "AdBlue Off", 
    status: "cancelled", 
    data: "27/12/2024",
    cliente: "Ana Costa",
    valor: 1200,
    categorias: ["Caminhão"],
    descricao: "Desativação do sistema AdBlue",
    horasKm: "520.000 km",
    arquivoOriginal: "daf_xf105_original.bin"
  },
  "5": { 
    id: 5, 
    placa: "MNO-7890", 
    marca: "MAN", 
    modelo: "TGX", 
    servico: "Stage 2", 
    status: "recall", 
    data: "26/12/2024",
    cliente: "Pedro Alves",
    valor: 2500,
    categorias: ["Caminhão"],
    descricao: "Remapeamento Stage 2 completo",
    horasKm: "180.000 km",
    arquivoOriginal: "man_tgx_original.bin"
  },
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <span className="status-badge status-completed">Concluído</span>;
    case "processing":
      return <span className="status-badge status-processing">Processando</span>;
    case "cancelled":
      return <span className="status-badge status-cancelled">Cancelado</span>;
    case "recall":
      return <span className="status-badge status-recall">Recall Original</span>;
    case "complex":
      return <span className="status-badge status-complex">Arquivo complexo 48h</span>;
    case "financial":
      return <span className="status-badge status-financial">Contate o financeiro</span>;
    default:
      return <span className="status-badge status-pending">Pendente</span>;
  }
};

export default function ArquivoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [correcaoDialogOpen, setCorrecaoDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [correcaoDescricao, setCorrecaoDescricao] = useState("");
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const arquivo = id ? arquivosMock[id] : null;

  if (!arquivo) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Arquivo não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      setNovoArquivo(file);
    }
  };

  const handleRemoveFile = () => {
    setNovoArquivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEnviarCorrecao = async () => {
    if (!correcaoDescricao.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o problema encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (correcaoDescricao.trim().length < 10) {
      toast({
        title: "Descrição muito curta",
        description: "Por favor, forneça mais detalhes sobre a correção necessária.",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        setEnviando(false);
        return;
      }

      let arquivoAnexoUrl: string | null = null;

      if (novoArquivo) {
        const fileExt = novoArquivo.name.split('.').pop();
        const fileName = `${user.id}/${arquivo.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('correction-files')
          .upload(fileName, novoArquivo, {
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
          setEnviando(false);
          return;
        }

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

        await supabase
          .from('support_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            sender_type: 'franqueado',
            content: `📋 **Solicitação de Correção**\n\n**Veículo:** ${arquivo.marca} ${arquivo.modelo}\n**Placa:** ${arquivo.placa}\n**Serviço:** ${arquivo.servico}\n\n**Descrição do problema:**\n${correcaoDescricao.trim()}${arquivoAnexoUrl ? '\n\n📎 Arquivo anexado' : ''}`
          });
      }

      const { error: insertError } = await supabase
        .from('correction_tickets')
        .insert({
          arquivo_id: String(arquivo.id),
          franqueado_id: user.id,
          motivo: correcaoDescricao.trim(),
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
        setEnviando(false);
        return;
      }

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de correção foi enviada com sucesso. Nossa equipe irá analisar em breve.",
      });
      
      setCorrecaoDialogOpen(false);
      setCorrecaoDescricao("");
      setNovoArquivo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Arquivo</h1>
            <p className="text-muted-foreground">
              {arquivo.marca} {arquivo.modelo} - {arquivo.placa}
            </p>
          </div>
        </div>
        {getStatusBadge(arquivo.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Veículo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Informações do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="font-medium">{arquivo.placa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium">{arquivo.marca}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{arquivo.modelo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas/Km</p>
                  <p className="font-medium">{arquivo.horasKm}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Categorias</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {arquivo.categorias.map((cat) => (
                    <span key={cat} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Informações do Serviço */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Serviço</p>
                  <p className="font-medium">{arquivo.servico}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {arquivo.data}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {arquivo.cliente}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium flex items-center gap-1 text-green-600">
                    <DollarSign className="h-4 w-4" />
                    R$ {arquivo.valor.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="mt-1">{arquivo.descricao}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Arquivos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Arquivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Arquivo Original</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{arquivo.arquivoOriginal}</span>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {arquivo.arquivoModificado && (
                <div className="flex-1 p-4 border border-primary/50 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Arquivo Modificado</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">{arquivo.arquivoModificado}</span>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {!arquivo.arquivoModificado && arquivo.status !== "completed" && (
                <div className="flex-1 p-4 border border-dashed border-border rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    Arquivo modificado ainda não disponível
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* CTA Primário: Download quando concluído */}
              {arquivo.status === "completed" && arquivo.arquivoModificado && (
                <Button variant="hero" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Arquivo Modificado
                </Button>
              )}
              
              {/* CTA Secundário: Solicitar Correção (outline + confirmação) */}
              <Button 
                variant="outline"
                onClick={() => setConfirmDialogOpen(true)}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Solicitar Correção
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog de confirmação para solicitar correção */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirmar Solicitação de Correção
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja solicitar uma correção para este arquivo? 
              Isso abrirá um ticket de correção que será analisado pela nossa equipe técnica.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setConfirmDialogOpen(false);
              setCorrecaoDialogOpen(true);
            }}>
              Sim, solicitar correção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Solicitação de Correção */}
      <Dialog open={correcaoDialogOpen} onOpenChange={setCorrecaoDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Solicitar Correção
            </DialogTitle>
            <DialogDescription>
              Descreva o problema encontrado e, se necessário, envie um novo arquivo para análise.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Problema *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva detalhadamente o problema encontrado com o arquivo..."
                value={correcaoDescricao}
                onChange={(e) => setCorrecaoDescricao(e.target.value)}
                rows={4}
                disabled={enviando}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 10 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label>Novo Arquivo (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".bin,.ori,.mod"
                disabled={enviando}
              />
              
              {novoArquivo ? (
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-border/30">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-sm truncate">{novoArquivo.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(novoArquivo.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={handleRemoveFile}
                    disabled={enviando}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={enviando}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher Arquivo
                  <span className="ml-2 text-muted-foreground">nenhum arquivo selecionado</span>
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: .bin, .ori, .mod
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCorrecaoDialogOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleEnviarCorrecao}
              disabled={enviando}
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
