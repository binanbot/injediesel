import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  X,
  FileIcon,
  Search,
  CheckCircle2,
  Info,
  AlertTriangle,
  User,
  DollarSign,
  Clock,
  FileCheck,
  Bell,
  ArrowRight,
} from "lucide-react";
import { useContractStatus } from "@/hooks/useContractStatus";
import { ContractBlockOverlay } from "@/components/ContractBlockOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  categoriasServicos,
  avisoLegalTexto,
  categoriasVeiculo,
  categoriasComPlaca,
  marcasPorCategoria,
  transmissoes,
} from "@/data/servicos-categorias";
import { ClienteSelect } from "@/components/franqueado/ClienteSelect";
import { NovoClienteDrawer } from "@/components/franqueado/NovoClienteDrawer";
import { ClientePerfilDialog } from "@/components/franqueado/ClientePerfilDialog";
import { Cliente, clientesMock } from "@/data/clientes-mock";

const MAX_FILES = 2;

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export default function EnviarArquivo() {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Categorias de serviço (múltipla escolha) e serviço (texto livre)
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [servicoTexto, setServicoTexto] = useState<string>("");
  const [aceitouResponsabilidade, setAceitouResponsabilidade] = useState(false);

  // Categoria de veículo e marca
  const [categoriaVeiculo, setCategoriaVeiculo] = useState<string>("");
  const [marca, setMarca] = useState<string>("");

  // Cliente
  const [clienteId, setClienteId] = useState<string>("");
  const [novoClienteDrawerOpen, setNovoClienteDrawerOpen] = useState(false);
  const [clientePerfilOpen, setClientePerfilOpen] = useState(false);
  const [clienteSelecionadoParaPerfil, setClienteSelecionadoParaPerfil] = useState<Cliente | null>(null);

  // Valor
  const [valor, setValor] = useState<string>("");

  // Derivados
  const exigePlaca = categoriasComPlaca.includes(categoriaVeiculo);
  const marcasDisponiveis = categoriaVeiculo ? marcasPorCategoria[categoriaVeiculo] || [] : [];

  // Verifica se alguma categoria selecionada exige aviso legal (Emissões)
  const exigeAvisoLegal = categoriasSelecionadas.includes("emissoes");

  // Validação do formulário
  const formValido = useMemo(() => {
    const temCliente = !!clienteId;
    const temCategoria = categoriasSelecionadas.length > 0;
    const temServico = !!servicoTexto.trim();
    const temCategoriaVeiculo = !!categoriaVeiculo;
    const temMarca = !!marca;
    const temValor = !!valor && parseFloat(valor.replace(/[^\d,]/g, "").replace(",", ".")) > 0;
    const temArquivos = files.length > 0;
    const aceitouSeNecessario = exigeAvisoLegal ? aceitouResponsabilidade : true;

    return temCliente && temCategoria && temServico && temCategoriaVeiculo && temMarca && temValor && temArquivos && aceitouSeNecessario;
  }, [clienteId, categoriasSelecionadas, servicoTexto, categoriaVeiculo, marca, valor, files, exigeAvisoLegal, aceitouResponsabilidade]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    const totalFiles = files.length + droppedFiles.length;
    if (totalFiles > MAX_FILES) {
      toast({
        title: "Limite de arquivos",
        description: `Você pode enviar no máximo ${MAX_FILES} arquivos.`,
        variant: "destructive",
      });
      const allowedFiles = droppedFiles.slice(0, MAX_FILES - files.length);
      setFiles((prev) => [...prev, ...allowedFiles]);
    } else {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));

      const totalFiles = files.length + selectedFiles.length;
      if (totalFiles > MAX_FILES) {
        toast({
          title: "Limite de arquivos",
          description: `Você pode enviar no máximo ${MAX_FILES} arquivos.`,
          variant: "destructive",
        });
        const allowedFiles = selectedFiles.slice(0, MAX_FILES - files.length);
        setFiles((prev) => [...prev, ...allowedFiles]);
      } else {
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCategoriaToggle = (categoriaId: string) => {
    setCategoriasSelecionadas((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId]
    );
    // Reset aceite se remover categoria de emissões
    if (categoriaId === "emissoes") {
      setAceitouResponsabilidade(false);
    }
  };

  const handleCategoriaVeiculoChange = (value: string) => {
    setCategoriaVeiculo(value);
    setMarca("");
  };

  const handleClienteCriado = (novoCliente: { id: string; nome: string; telefone: string; email?: string; cidade?: string }) => {
    // Em produção, adicionaria ao banco. Aqui apenas seleciona
    setClienteId(novoCliente.id);
  };

  const handleViewCliente = (cliente: Cliente) => {
    setClienteSelecionadoParaPerfil(cliente);
    setClientePerfilOpen(true);
  };

  const formatValor = (val: string) => {
    // Remove tudo que não é número ou vírgula
    const numericValue = val.replace(/[^\d]/g, "");
    if (!numericValue) return "";

    // Converte para número e formata
    const number = parseInt(numericValue, 10) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatValor(e.target.value);
    setValor(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValido) {
      toast({
        title: "Formulário incompleto",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast({
        title: "Arquivo enviado com sucesso!",
        description: "Você receberá uma notificação quando o processamento for concluído.",
      });
    }, 2000);
  };

  const resetForm = () => {
    setSubmitted(false);
    setCategoriasSelecionadas([]);
    setServicoTexto("");
    setCategoriaVeiculo("");
    setMarca("");
    setClienteId("");
    setValor("");
    setFiles([]);
    setAceitouResponsabilidade(false);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg w-full"
        >
          {/* Ícone de sucesso animado */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-12 w-12 text-success" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Arquivo Enviado com Sucesso!</h2>
          <p className="text-muted-foreground mb-8">
            Seu arquivo foi recebido e está na fila de processamento.
          </p>

          {/* Próximos passos */}
          <Card className="glass-card text-left mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Em Análise</p>
                  <p className="text-xs text-muted-foreground">
                    Nossa equipe irá analisar seu arquivo em breve
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Prazo Médio</p>
                  <p className="text-xs text-muted-foreground">
                    Processamento em até 2 horas (horário comercial)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Notificação</p>
                  <p className="text-xs text-muted-foreground">
                    Você receberá um alerta quando o arquivo estiver pronto
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={resetForm} className="gap-2">
              <Upload className="h-4 w-4" />
              Enviar Outro Arquivo
            </Button>
            <Button variant="hero" onClick={() => (window.location.href = "/franqueado/arquivos")} className="gap-2">
              <FileIcon className="h-4 w-4" />
              Ver Meus Arquivos
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const contractStatus = useContractStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Overlay de bloqueio se contrato vencido */}
      {contractStatus.isExpired && <ContractBlockOverlay action="upload" />}

      <div>
        <h1 className="text-2xl font-bold">Enviar Arquivo</h1>
        <p className="text-muted-foreground">Preencha os dados abaixo para enviar seu arquivo de ECU.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Cliente *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClienteSelect
              value={clienteId}
              onChange={setClienteId}
              onAddNew={() => setNovoClienteDrawerOpen(true)}
              onViewCliente={handleViewCliente}
            />
          </CardContent>
        </Card>

        {/* Categoria e Serviço */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categorias - Múltipla escolha */}
            <div className="space-y-2">
              <Label>Selecione uma ou mais categorias *</Label>
              <div className="flex flex-wrap gap-2">
                {categoriasServicos.map((cat) => {
                  const isSelected = categoriasSelecionadas.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoriaToggle(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/10"
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.nome}</span>
                    </button>
                  );
                })}
              </div>
              {categoriasSelecionadas.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {categoriasSelecionadas.length} categoria(s) selecionada(s)
                </p>
              )}
            </div>

            {/* Serviço - Texto livre */}
            <div className="space-y-2">
              <Label>Serviço a ser executado *</Label>
              <Input
                placeholder="Descreva o serviço a ser realizado..."
                value={servicoTexto}
                onChange={(e) => setServicoTexto(e.target.value)}
                className="glass-input"
                required
              />
            </div>


            {/* Campo Valor */}
            <div className="space-y-2">
              <Label>Valor Cobrado (R$) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="0,00"
                  value={valor}
                  onChange={handleValorChange}
                  className="glass-input pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Este valor será incluído nos relatórios de faturamento
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Veículo */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Dados do Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria do Veículo *</Label>
                <Select value={categoriaVeiculo} onValueChange={handleCategoriaVeiculoChange}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {categoriasVeiculo.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Select value={marca} onValueChange={setMarca} disabled={!categoriaVeiculo}>
                  <SelectTrigger className="glass-input">
                    <SelectValue
                      placeholder={categoriaVeiculo ? "Selecione a marca" : "Selecione a categoria primeiro"}
                    />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {marcasDisponiveis.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {exigePlaca && (
                <div className="space-y-2">
                  <Label>Placa *</Label>
                  <div className="relative">
                    <Input placeholder="ABC-1234" className="glass-input" required />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Consulta automática disponível via API
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input placeholder="Ex: FH 540" className="glass-input" required />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Motor / Cilindrada</Label>
                <Input placeholder="Ex: D13A 540" className="glass-input" />
              </div>
              <div className="space-y-2">
                <Label>Transmissão</Label>
                <Select>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {transmissoes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ano / Modelo *</Label>
                <Input placeholder="Ex: 2020/2021" className="glass-input" required />
              </div>
              <div className="space-y-2">
                <Label>Horas / Km do veículo</Label>
                <Input placeholder="Ex: 15.000" className="glass-input" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload de Arquivos */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Upload de Arquivos (máx. {MAX_FILES})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              } ${files.length >= MAX_FILES ? "opacity-50 pointer-events-none" : ""}`}
            >
              <input
                type="file"
                multiple
                accept=".bin,.ori,.kfg,.bck,.eprom,.zip,.rar"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={files.length >= MAX_FILES}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer ${files.length >= MAX_FILES ? "cursor-not-allowed" : ""}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">
                  {files.length >= MAX_FILES
                    ? "Limite de arquivos atingido"
                    : "Arraste arquivos aqui ou clique para selecionar"}
                </p>
                <p className="text-sm text-muted-foreground">Formatos aceitos: .bin, .ori, .kfg, .bck, .eprom, .zip, .rar</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Limite máximo: 256 MB por arquivo | {files.length}/{MAX_FILES} arquivos
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Adicione informações adicionais sobre o serviço..." rows={4} className="glass-input" />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancelar
          </Button>
          <Button type="submit" variant="hero" disabled={isSubmitting || !formValido}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar Arquivo
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Drawer para novo cliente */}
      <NovoClienteDrawer
        open={novoClienteDrawerOpen}
        onOpenChange={setNovoClienteDrawerOpen}
        onClienteCriado={handleClienteCriado}
      />

      {/* Dialog perfil do cliente */}
      <ClientePerfilDialog
        cliente={clienteSelecionadoParaPerfil}
        open={clientePerfilOpen}
        onOpenChange={setClientePerfilOpen}
      />
    </div>
  );
}
