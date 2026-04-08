import { useState, useMemo, useCallback } from "react";
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
  Loader2,
  Lock,
  ShieldAlert,
  AlertCircle,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { CommercialAttributionSection, type CommercialAttributionData } from "@/components/admin/CommercialAttributionSection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isCompanyAdminLevel } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { logAuditEvent } from "@/services/auditService";
import { getWalletStatus, validateSellerForAttribution } from "@/services/commercialEligibilityService";
import { useCompany } from "@/hooks/useCompany";

const MAX_FILES = 2;

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

// Interface para dados da placa
interface PlateData {
  placa: string;
  marca: string;
  modelo: string;
  anoModelo: string;
  motor: string;
  transmissao: string;
  rawPayload?: Record<string, unknown>;
}

// Campos que vieram incompletos da API
type IncompleteField = "motor" | "transmissao";

export default function EnviarArquivo() {
  const { user, userRole } = useAuth();
  const { can } = usePermissions();
  const showCommercialSection = isCompanyAdminLevel(userRole);
  const canAssignSeller = can("vendas", "assign_seller");
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
  
  // Placa e dados do veículo (preenchidos via API)
  const [placa, setPlaca] = useState<string>("");
  const [modelo, setModelo] = useState<string>("");
  const [motor, setMotor] = useState<string>("");
  const [transmissao, setTransmissao] = useState<string>("");
  const [anoModelo, setAnoModelo] = useState<string>("");
  const [horasKm, setHorasKm] = useState<string>("");
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [placaEncontrada, setPlacaEncontrada] = useState(false);
  const [placaConsultada, setPlacaConsultada] = useState(false);
  const [dadosManuais, setDadosManuais] = useState(false);
  
  // Auditoria de placa
  const [plateLookupPayload, setPlateLookupPayload] = useState<Record<string, unknown> | null>(null);
  const [plateLookupSuccess, setPlateLookupSuccess] = useState<boolean | null>(null);
  
  // Campos incompletos (P2)
  const [incompleteFields, setIncompleteFields] = useState<IncompleteField[]>([]);
  
  // Modal de responsabilidade
  const [modalResponsabilidadeOpen, setModalResponsabilidadeOpen] = useState(false);
  const [aceitouTermoPlaca, setAceitouTermoPlaca] = useState(false);

  // Cliente
  const [clienteId, setClienteId] = useState<string>("");
  const [clientePrimarySellerId, setClientePrimarySellerId] = useState<string | null>(null);
  const [novoClienteDrawerOpen, setNovoClienteDrawerOpen] = useState(false);
  const [clienteRefreshSignal, setClienteRefreshSignal] = useState(0);

  // Atribuição comercial
  const [sellerProfileId, setSellerProfileId] = useState<string>("");
  const [saleChannel, setSaleChannel] = useState<string>("");

  // Valor
  const [valor, setValor] = useState<string>("");

  // Derivados
  const exigePlaca = categoriasComPlaca.includes(categoriaVeiculo);
  const marcasDisponiveis = categoriaVeiculo ? marcasPorCategoria[categoriaVeiculo] || [] : [];

  // Verifica se alguma categoria selecionada exige aviso legal (Emissões)
  const exigeAvisoLegal = categoriasSelecionadas.includes("emissoes");

  // Verifica se um campo específico é editável por estar incompleto
  const isFieldIncomplete = useCallback((field: IncompleteField) => {
    return incompleteFields.includes(field);
  }, [incompleteFields]);

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
    
    // Para veículos emplacados, deve ter consultado a placa ou ter dados manuais
    const validacaoPlaca = exigePlaca ? (placaEncontrada || dadosManuais) : true;

    return temCliente && temCategoria && temServico && temCategoriaVeiculo && temMarca && temValor && temArquivos && aceitouSeNecessario && validacaoPlaca;
  }, [clienteId, categoriasSelecionadas, servicoTexto, categoriaVeiculo, marca, valor, files, exigeAvisoLegal, aceitouResponsabilidade, exigePlaca, placaEncontrada, dadosManuais]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
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
        file: file,
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
    // Reset vehicle data when category changes
    setPlaca("");
    setModelo("");
    setMotor("");
    setTransmissao("");
    setAnoModelo("");
    setPlacaEncontrada(false);
    setPlacaConsultada(false);
    setDadosManuais(false);
    setAceitouTermoPlaca(false);
  };

  // Verifica se os campos devem estar bloqueados (apenas para veículos emplacados)
  // Campos bloqueados ANTES da consulta da placa
  const camposBloqueadosPreConsulta = exigePlaca && !placaConsultada && !dadosManuais;
  
  // Campos bloqueados APÓS consulta bem-sucedida (exceto campos incompletos)
  const camposBloqueadosPosConsulta = placaEncontrada && !dadosManuais;

  // Função para buscar dados do veículo pela placa via Edge Function
  const buscarPlaca = async () => {
    if (!categoriaVeiculo) {
      toast({
        title: "Selecione a categoria",
        description: "Selecione a categoria do veículo antes de buscar a placa.",
        variant: "destructive",
      });
      return;
    }

    if (!placa || placa.length < 7) {
      toast({
        title: "Placa inválida",
        description: "Digite uma placa válida (ex: ABC1234 ou ABC1D23).",
        variant: "destructive",
      });
      return;
    }

    setBuscandoPlaca(true);
    setPlacaConsultada(true);
    setIncompleteFields([]);
    
    try {
      const { data, error } = await supabase.functions.invoke("lookup-plate", {
        body: { plate: placa.toUpperCase(), country: "BR" },
      });

      if (error) {
        console.error("Erro ao consultar placa:", error);
        
        // Verificar se é erro 406 (placa não encontrada)
        if (error.message?.includes("406") || error.message?.includes("PLATE_NOT_FOUND")) {
          setBuscandoPlaca(false);
          setPlacaEncontrada(false);
          setPlateLookupSuccess(false);
          setModalResponsabilidadeOpen(true);
          return;
        }
        
        throw error;
      }

      if (!data?.success) {
        // Placa não encontrada - abrir modal de responsabilidade
        setBuscandoPlaca(false);
        setPlacaEncontrada(false);
        setPlateLookupSuccess(false);
        setModalResponsabilidadeOpen(true);
        return;
      }

      // Sucesso - preencher campos
      const plateData = data.data as PlateData;
      
      setMarca(plateData.marca || "");
      setModelo(plateData.modelo || "");
      setMotor(plateData.motor || "");
      setAnoModelo(plateData.anoModelo || "");
      setTransmissao(plateData.transmissao || "");
      setPlacaEncontrada(true);
      setDadosManuais(false);
      setPlateLookupSuccess(true);
      setPlateLookupPayload(plateData.rawPayload || null);
      
      // Verificar campos incompletos (P2)
      if (data.incompleteFields && data.incompleteFields.length > 0) {
        setIncompleteFields(data.incompleteFields as IncompleteField[]);
        toast({
          title: "Veículo encontrado!",
          description: `${plateData.marca} ${plateData.modelo} - Alguns campos requerem preenchimento manual.`,
        });
      } else {
        toast({
          title: "Veículo encontrado!",
          description: `${plateData.marca} ${plateData.modelo} - ${plateData.anoModelo}`,
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar placa:", error);
      setBuscandoPlaca(false);
      setPlacaEncontrada(false);
      setPlateLookupSuccess(false);
      setModalResponsabilidadeOpen(true);
    } finally {
      setBuscandoPlaca(false);
    }
  };

  // Confirmar termo de responsabilidade
  const confirmarTermoResponsabilidade = () => {
    setDadosManuais(true);
    setModalResponsabilidadeOpen(false);
    setAceitouTermoPlaca(false);
    setPlateLookupSuccess(false);
    toast({
      title: "Dados liberados para edição",
      description: "Preencha os dados do veículo manualmente.",
    });
  };

  // Cancelar termo de responsabilidade
  const cancelarTermoResponsabilidade = () => {
    setModalResponsabilidadeOpen(false);
    setPlaca("");
    setPlacaConsultada(false);
    setAceitouTermoPlaca(false);
  };

  // Format plate input
  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length > 7) value = value.slice(0, 7);
    setPlaca(value);
    setPlacaEncontrada(false);
    setPlacaConsultada(false);
    setDadosManuais(false);
  };

  const handleClienteCriado = (novoCliente: { id: string; full_name: string }) => {
    setClienteId(novoCliente.id);
    setClienteRefreshSignal((s) => s + 1);
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      // Obtém o user_id e unit_id
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("Usuário não autenticado");
      }

      // Busca o unit_id do franqueado
      const { data: unitData } = await supabase
        .from("units")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!unitData) {
        throw new Error("Unidade não encontrada. Entre em contato com o suporte.");
      }

      // Gera ID único para o arquivo
      const arquivoId = crypto.randomUUID();

      // Upload do primeiro arquivo (original)
      let arquivoOriginalUrl = null;
      let arquivoOriginalNome = null;

      if (files.length > 0) {
        const file = files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${unitData.id}/${arquivoId}/${Date.now()}_original.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("received-files")
          .upload(fileName, file.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          throw new Error("Erro ao fazer upload do arquivo");
        }

        const { data: urlData } = supabase.storage
          .from("received-files")
          .getPublicUrl(fileName);

        arquivoOriginalUrl = urlData.publicUrl;
        arquivoOriginalNome = file.name;
      }

      // Converte valor para número
      const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));

      // Insere o registro no banco com campos de auditoria de placa
      // Nota: Campos de auditoria adicionados via migração - cast para any para evitar erro de tipo
      const insertData: Record<string, unknown> = {
        id: arquivoId,
        unit_id: unitData.id,
        customer_id: clienteId || null,
        placa: placa || "SEM PLACA",
        marca: marca,
        modelo: modelo,
        horas_km: horasKm,
        servico: servicoTexto,
        categorias: categoriasSelecionadas,
        descricao: `Categoria: ${categoriaVeiculo}. Motor: ${motor}. Transmissão: ${transmissao}. Ano: ${anoModelo}`,
        valor_brl: valorNumerico,
        arquivo_original_url: arquivoOriginalUrl,
        arquivo_original_nome: arquivoOriginalNome,
        status: "pending",
        // Atribuição comercial
        operator_user_id: userData.user.id,
        seller_profile_id: sellerProfileId || null,
        sale_channel: saleChannel || null,
        // Campos de auditoria de busca de placa
        plate_lookup_success: plateLookupSuccess,
        manual_vehicle_data: dadosManuais,
        plate_lookup_payload: plateLookupPayload,
        plate_lookup_at: placaConsultada ? new Date().toISOString() : null,
        plate_lookup_user_id: userData.user.id,
        plate_lookup_unit_id: unitData.id,
      };

      const { error: insertError } = await supabase
        .from("received_files")
        .insert(insertData as any);

      if (insertError) {
        console.error("Erro ao inserir:", insertError);
        throw new Error("Erro ao salvar os dados do arquivo");
      }

      // Audit: file commercial attribution
      if (sellerProfileId || saleChannel) {
        const walletStatus = getWalletStatus(sellerProfileId || null, clientePrimarySellerId || null);
        logAuditEvent({
          action: "file.attribution_set",
          module: "arquivos",
          targetType: "received_file",
          targetId: arquivoId,
          details: {
            seller_profile_id: sellerProfileId || null,
            operator_user_id: userData.user.id,
            sale_channel: saleChannel || null,
            customer_id: clienteId || null,
            customer_primary_seller_id: clientePrimarySellerId || null,
            is_out_of_wallet: walletStatus === "out_of_wallet",
            is_third_party: sellerProfileId ? true : false,
          },
        });
      }

      setIsSubmitting(false);
      setSubmitted(true);
      toast({
        title: "Arquivo enviado com sucesso!",
        description: "Você receberá uma notificação quando o processamento for concluído.",
      });
    } catch (error: any) {
      console.error("Erro ao enviar arquivo:", error);
      setIsSubmitting(false);
      toast({
        title: "Erro ao enviar arquivo",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setCategoriasSelecionadas([]);
    setServicoTexto("");
    setCategoriaVeiculo("");
    setMarca("");
    setPlaca("");
    setModelo("");
    setMotor("");
    setTransmissao("");
    setAnoModelo("");
    setHorasKm("");
    setPlacaEncontrada(false);
    setPlacaConsultada(false);
    setDadosManuais(false);
    setAceitouTermoPlaca(false);
    setClienteId("");
    setClientePrimarySellerId(null);
    setSellerProfileId("");
    setSaleChannel("");
    setValor("");
    setFiles([]);
    setAceitouResponsabilidade(false);
    // Reset de auditoria
    setPlateLookupPayload(null);
    setPlateLookupSuccess(null);
    setIncompleteFields([]);
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
              onCustomerSelect={(c) => setClientePrimarySellerId(c?.primary_seller_id ?? null)}
              onAddNew={() => setNovoClienteDrawerOpen(true)}
              refreshSignal={clienteRefreshSignal}
            />
          </CardContent>
        </Card>

        {/* Atribuição Comercial — visível apenas para admins/operadores */}
        {showCommercialSection && (
          <CommercialAttributionSection
            primarySellerId={clientePrimarySellerId}
            sellerProfileId={sellerProfileId}
            saleChannel={saleChannel}
            filterCanSellEcu
            canAssignSeller={canAssignSeller}
            onChange={(data) => {
              if (data.seller_profile_id !== undefined) setSellerProfileId(data.seller_profile_id);
              if (data.sale_channel !== undefined) setSaleChannel(data.sale_channel);
            }}
          />
        )}

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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Dados do Veículo</CardTitle>
            {dadosManuais && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1">
                <ShieldAlert className="h-3 w-3" />
                Dados manuais
              </Badge>
            )}
            {placaEncontrada && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Dados via API
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Linha 1: Categoria + Placa (só aparece para veículos emplacados) */}
            <div className={`grid gap-4 ${exigePlaca ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
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
              
              {exigePlaca && (
                <div className="space-y-2">
                  <Label>Placa *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        placeholder="ABC1234" 
                        value={placa}
                        onChange={handlePlacaChange}
                        className={`glass-input uppercase ${
                          placaEncontrada ? "border-success" : 
                          dadosManuais ? "border-warning" : ""
                        }`}
                        maxLength={7}
                        required 
                      />
                      {buscandoPlaca && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {placaEncontrada && !buscandoPlaca && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
                      )}
                      {dadosManuais && !buscandoPlaca && (
                        <ShieldAlert className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warning" />
                      )}
                    </div>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={buscarPlaca}
                      disabled={buscandoPlaca || placa.length < 7}
                      className="gap-2 shrink-0"
                    >
                      {buscandoPlaca ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Buscar
                    </Button>
                  </div>
                  {placaEncontrada && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Dados preenchidos automaticamente via consulta de placa
                    </p>
                  )}
                  {dadosManuais && (
                    <p className="text-xs text-warning flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Dados informados manualmente sob responsabilidade do franqueado
                    </p>
                  )}
                  {!placaEncontrada && !dadosManuais && !buscandoPlaca && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Digite a placa e clique em "Buscar" para preencher automaticamente
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Linha 2: Marca + Modelo (conforme imagem) */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label className="flex items-center gap-2">
                  Marca *
                  {camposBloqueadosPreConsulta && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Select 
                  value={marca} 
                  onValueChange={setMarca} 
                  disabled={!categoriaVeiculo || camposBloqueadosPosConsulta || camposBloqueadosPreConsulta || buscandoPlaca}
                >
                  <SelectTrigger className={`glass-input ${
                    placaEncontrada && marca ? "border-success/50" : 
                    dadosManuais && marca ? "border-warning/50" : ""
                  } ${camposBloqueadosPreConsulta ? "opacity-50" : ""}`}>
                    <SelectValue
                      placeholder={
                        camposBloqueadosPreConsulta ? "Busque a placa primeiro" :
                        categoriaVeiculo ? "Selecione a marca" : "Selecione a categoria primeiro"
                      }
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
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Modelo *
                  {camposBloqueadosPreConsulta && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input 
                  placeholder={camposBloqueadosPreConsulta ? "Busque a placa primeiro" : "Ex: FH 540"}
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className={`glass-input ${
                    placaEncontrada && modelo ? "border-success/50" : 
                    dadosManuais && modelo ? "border-warning/50" : ""
                  } ${camposBloqueadosPreConsulta ? "opacity-50" : ""}`}
                  disabled={camposBloqueadosPosConsulta || camposBloqueadosPreConsulta || buscandoPlaca}
                  required 
                />
              </div>
            </div>

            {/* Linha 3: Motor + Transmissão */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Motor / Cilindrada
                  {camposBloqueadosPreConsulta && !isFieldIncomplete("motor") && <Lock className="h-3 w-3 text-muted-foreground" />}
                  {isFieldIncomplete("motor") && (
                    <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Preencher
                    </Badge>
                  )}
                </Label>
                <Input 
                  placeholder={camposBloqueadosPreConsulta ? "Busque a placa primeiro" : "Ex: D13A 540"}
                  value={motor}
                  onChange={(e) => setMotor(e.target.value)}
                  className={`glass-input ${
                    placaEncontrada && motor && !isFieldIncomplete("motor") ? "border-success/50" : 
                    (dadosManuais || isFieldIncomplete("motor")) && motor ? "border-warning/50" :
                    isFieldIncomplete("motor") ? "border-warning" : ""
                  } ${camposBloqueadosPreConsulta ? "opacity-50" : ""}`}
                  disabled={(camposBloqueadosPosConsulta && !isFieldIncomplete("motor")) || camposBloqueadosPreConsulta || buscandoPlaca}
                />
                {isFieldIncomplete("motor") && !motor && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Campo não retornado pela API - preencha manualmente
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Transmissão
                  {camposBloqueadosPreConsulta && !isFieldIncomplete("transmissao") && <Lock className="h-3 w-3 text-muted-foreground" />}
                  {isFieldIncomplete("transmissao") && (
                    <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Preencher
                    </Badge>
                  )}
                </Label>
                <Select 
                  value={transmissao} 
                  onValueChange={setTransmissao}
                  disabled={(camposBloqueadosPosConsulta && !isFieldIncomplete("transmissao")) || camposBloqueadosPreConsulta || buscandoPlaca}
                >
                  <SelectTrigger className={`glass-input ${
                    isFieldIncomplete("transmissao") ? "border-warning" : ""
                  } ${camposBloqueadosPreConsulta ? "opacity-50" : ""}`}>
                    <SelectValue placeholder={camposBloqueadosPreConsulta ? "Busque a placa primeiro" : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent className="glass-card">
                    {transmissoes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isFieldIncomplete("transmissao") && !transmissao && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Campo não retornado pela API - preencha manualmente
                  </p>
                )}
              </div>
            </div>

            {/* Linha 4: Ano + Horas/Km */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Ano / Modelo *
                  {camposBloqueadosPreConsulta && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input 
                  placeholder={camposBloqueadosPreConsulta ? "Busque a placa primeiro" : "Ex: 2020/2021"}
                  value={anoModelo}
                  onChange={(e) => setAnoModelo(e.target.value)}
                  className={`glass-input ${
                    placaEncontrada && anoModelo ? "border-success/50" : 
                    dadosManuais && anoModelo ? "border-warning/50" : ""
                  } ${camposBloqueadosPreConsulta ? "opacity-50" : ""}`}
                  disabled={camposBloqueadosPosConsulta || camposBloqueadosPreConsulta || buscandoPlaca}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Horas / Km do veículo</Label>
                <Input 
                  placeholder="Ex: 15.000" 
                  value={horasKm}
                  onChange={(e) => setHorasKm(e.target.value)}
                  className="glass-input" 
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Campo sempre editável
                </p>
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

      {/* Modal de Responsabilidade - Placa não encontrada */}
      <Dialog open={modalResponsabilidadeOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Responsabilidade sobre os dados informados
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A placa informada não foi encontrada em nossa base de dados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-sm leading-relaxed font-medium">
                Declaro que os dados do veículo foram informados manualmente por mim e assumo total responsabilidade pela veracidade das informações, bem como pelos arquivos, serviços e garantias gerados a partir destes dados.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border/50">
              <Checkbox
                checked={aceitouTermoPlaca}
                onCheckedChange={(checked) => setAceitouTermoPlaca(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm font-medium">
                Li e aceito o termo de responsabilidade
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cancelarTermoResponsabilidade}>
              Cancelar
            </Button>
            <Button 
              variant="hero" 
              onClick={confirmarTermoResponsabilidade}
              disabled={!aceitouTermoPlaca}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmar e continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
