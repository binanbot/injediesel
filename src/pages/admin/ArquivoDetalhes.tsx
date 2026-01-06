import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar, 
  Car, 
  User, 
  DollarSign,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
  unidade: string;
  franqueado: string;
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
    categorias: ["Truck"],
    descricao: "Remapeamento Stage 1 para aumento de potência e torque",
    horasKm: "450.000 km",
    arquivoOriginal: "volvo_fh540_original.bin",
    arquivoModificado: "volvo_fh540_stage1.bin",
    unidade: "São Paulo - Centro",
    franqueado: "Roberto Mendes"
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
    categorias: ["Truck"],
    descricao: "Remoção do DPF e ajuste de parâmetros",
    horasKm: "320.000 km",
    arquivoOriginal: "scania_r450_original.bin",
    unidade: "Rio de Janeiro",
    franqueado: "Carlos Ferreira"
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
    categorias: ["Truck"],
    descricao: "Desativação do sistema EGR",
    horasKm: "280.000 km",
    arquivoOriginal: "mercedes_actros_original.bin",
    arquivoModificado: "mercedes_actros_egr_off.bin",
    unidade: "Belo Horizonte",
    franqueado: "Ana Paula Costa"
  },
};

// Mock de solicitações de correção
const correcoesMock: Record<string, Array<{
  id: number;
  data: string;
  descricao: string;
  status: "pendente" | "em_analise" | "resolvido";
  arquivoEnviado?: string;
  respostaAdmin?: string;
}>> = {
  "1": [
    {
      id: 1,
      data: "29/12/2024 10:30",
      descricao: "O arquivo não está funcionando corretamente. O veículo apresenta falha de injeção após a instalação.",
      status: "pendente",
      arquivoEnviado: "volvo_fh540_erro_log.bin"
    }
  ],
  "3": [
    {
      id: 1,
      data: "28/12/2024 15:00",
      descricao: "Luz do motor acendeu após o remapeamento. Preciso de correção urgente.",
      status: "resolvido",
      respostaAdmin: "Arquivo corrigido e reenviado. Problema identificado no mapeamento do sensor de temperatura."
    },
    {
      id: 2,
      data: "29/12/2024 09:15",
      descricao: "Nova falha detectada no sistema de freio motor.",
      status: "em_analise",
      arquivoEnviado: "mercedes_actros_freio_log.bin"
    }
  ]
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

const getCorrecaoStatusBadge = (status: "pendente" | "em_analise" | "resolvido") => {
  switch (status) {
    case "pendente":
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Pendente</Badge>;
    case "em_analise":
      return <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-600"><Clock className="h-3 w-3" /> Em Análise</Badge>;
    case "resolvido":
      return <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-600"><CheckCircle className="h-3 w-3" /> Resolvido</Badge>;
  }
};

export default function AdminArquivoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [respostaDialogOpen, setRespostaDialogOpen] = useState(false);
  const [arquivoProcessado, setArquivoProcessado] = useState<File | null>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [respostaCorrecao, setRespostaCorrecao] = useState("");
  const [correcaoSelecionada, setCorrecaoSelecionada] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  const arquivo = id ? arquivosMock[id] : null;
  const correcoes = id ? correcoesMock[id] || [] : [];

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

  const handleUploadArquivo = async () => {
    if (!arquivoProcessado) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEnviando(false);
    setUploadDialogOpen(false);
    setArquivoProcessado(null);

    toast({
      title: "Arquivo enviado",
      description: "O arquivo processado foi enviado com sucesso.",
    });
  };

  const handleAlterarStatus = async () => {
    if (!novoStatus) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um status.",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setEnviando(false);
    setStatusDialogOpen(false);
    setNovoStatus("");

    toast({
      title: "Status atualizado",
      description: `O status foi alterado para ${novoStatus}.`,
    });
  };

  const handleResponderCorrecao = async () => {
    if (!respostaCorrecao.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, escreva uma resposta.",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEnviando(false);
    setRespostaDialogOpen(false);
    setRespostaCorrecao("");
    setCorrecaoSelecionada(null);

    toast({
      title: "Resposta enviada",
      description: "A resposta foi enviada ao franqueado.",
    });
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

      <div className="grid gap-6 lg:grid-cols-2">
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

        {/* Informações do Franqueado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações do Franqueado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Unidade</p>
                  <p className="font-medium">{arquivo.unidade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{arquivo.franqueado}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente Final</p>
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Informações do Serviço */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-medium">{arquivo.servico}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Envio</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {arquivo.data}
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

      {/* Arquivos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
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

              {arquivo.arquivoModificado ? (
                <div className="flex-1 p-4 border border-primary/50 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Arquivo Modificado</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">{arquivo.arquivoModificado}</span>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Modificado
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-4 border border-dashed border-border rounded-lg flex items-center justify-center">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Arquivo Processado
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Solicitações de Correção */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Solicitações de Correção
              {correcoes.filter(c => c.status === "pendente").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {correcoes.filter(c => c.status === "pendente").length} pendente(s)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {correcoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Nenhuma solicitação de correção recebida.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {correcoes.map((correcao) => (
                  <div 
                    key={correcao.id} 
                    className={`p-4 border rounded-lg ${
                      correcao.status === "pendente" 
                        ? "border-destructive/50 bg-destructive/5" 
                        : correcao.status === "em_analise"
                        ? "border-yellow-500/50 bg-yellow-500/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {correcao.data}
                      </div>
                      {getCorrecaoStatusBadge(correcao.status)}
                    </div>
                    
                    <p className="mb-3">{correcao.descricao}</p>
                    
                    {correcao.arquivoEnviado && (
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Arquivo anexado:</span>
                        <Button variant="link" size="sm" className="h-auto p-0">
                          {correcao.arquivoEnviado}
                        </Button>
                      </div>
                    )}

                    {correcao.respostaAdmin && (
                      <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Resposta:</p>
                        <p className="text-sm">{correcao.respostaAdmin}</p>
                      </div>
                    )}

                    {correcao.status !== "resolvido" && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm"
                          onClick={() => {
                            setCorrecaoSelecionada(correcao.id);
                            setRespostaDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Responder
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setUploadDialogOpen(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Enviar Correção
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Ações Administrativas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Ações Administrativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setStatusDialogOpen(true)}>
                Alterar Status
              </Button>
              <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Arquivo Processado
              </Button>
              <Button variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Download Original
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog de Upload de Arquivo Processado */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar Arquivo Processado
            </DialogTitle>
            <DialogDescription>
              Selecione o arquivo processado para enviar ao franqueado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="arquivo">Arquivo Processado *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <Input
                  id="arquivo"
                  type="file"
                  accept=".bin,.ori,.mod"
                  onChange={(e) => setArquivoProcessado(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {arquivoProcessado && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <Upload className="h-4 w-4 inline mr-1" />
                    {arquivoProcessado.name}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: .bin, .ori, .mod
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUploadArquivo}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar Arquivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Alteração de Status */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Status</DialogTitle>
            <DialogDescription>
              Selecione o novo status para este arquivo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={novoStatus} onValueChange={setNovoStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="recall">Recall Original</SelectItem>
                <SelectItem value="complex">Arquivo complexo 48h</SelectItem>
                <SelectItem value="financial">Contate o financeiro</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusDialogOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAlterarStatus}
              disabled={enviando}
            >
              {enviando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Resposta à Correção */}
      <Dialog open={respostaDialogOpen} onOpenChange={setRespostaDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Responder Solicitação
            </DialogTitle>
            <DialogDescription>
              Escreva uma resposta para o franqueado sobre a solicitação de correção.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resposta">Resposta *</Label>
              <Textarea
                id="resposta"
                placeholder="Digite sua resposta..."
                value={respostaCorrecao}
                onChange={(e) => setRespostaCorrecao(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRespostaDialogOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleResponderCorrecao}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar Resposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
