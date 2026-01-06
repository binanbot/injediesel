import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter, Download, Upload, Eye, MoreHorizontal, CheckCircle, RefreshCw, CalendarIcon, Clock, X } from "lucide-react";
import { calcularTempoDecorrido, getTempoClasses } from "@/utils/tempoDecorrido";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const arquivos = [
  { id: 1, unidade: "São Paulo - Centro", placa: "ABC-1234", marca: "Volvo", modelo: "FH 540", servico: "Stage 1", status: "pending", data: "28/12/2024 14:30" },
  { id: 2, unidade: "Rio de Janeiro", placa: "DEF-5678", marca: "Scania", modelo: "R 450", servico: "DPF Off", status: "processing", data: "28/12/2024 13:15" },
  { id: 3, unidade: "Belo Horizonte", placa: "GHI-9012", marca: "Mercedes", modelo: "Actros", servico: "EGR Off", status: "completed", data: "28/12/2024 11:00" },
  { id: 4, unidade: "Curitiba", placa: "JKL-3456", marca: "DAF", modelo: "XF 105", servico: "AdBlue Off", status: "pending", data: "28/12/2024 10:45" },
  { id: 5, unidade: "Porto Alegre", placa: "MNO-7890", marca: "MAN", modelo: "TGX", servico: "Stage 2", status: "cancelled", data: "27/12/2024 16:20" },
  { id: 6, unidade: "São Paulo - Centro", placa: "PQR-1234", marca: "Iveco", modelo: "Stralis", servico: "Speed Limiter", status: "completed", data: "27/12/2024 15:00" },
];

// Contagem por status para exibir nas tabs
const getStatusCounts = () => {
  const counts = { all: arquivos.length, pending: 0, processing: 0, completed: 0, cancelled: 0 };
  arquivos.forEach(a => {
    if (a.status in counts) counts[a.status as keyof typeof counts]++;
  });
  return counts;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <span className="status-badge status-completed">Concluído</span>;
    case "processing":
      return <span className="status-badge status-processing">Processando</span>;
    case "pending":
      return <span className="status-badge status-pending">Pendente</span>;
    case "cancelled":
      return <span className="status-badge status-cancelled">Cancelado</span>;
    default:
      return <span className="status-badge status-pending">{status}</span>;
  }
};

export default function AdminArquivos() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [dataInicioInput, setDataInicioInput] = useState("");
  const [dataFimInput, setDataFimInput] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState<string>("");
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; arquivo: typeof arquivos[0] | null }>({
    open: false,
    arquivo: null,
  });

  // Gera lista de anos (últimos 10 anos)
  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  // Função para parsear data no formato DD/MM/YYYY
  const parseDateInput = (value: string): Date | undefined => {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [, dia, mes, ano] = match;
      const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return undefined;
  };

  // Função para formatar input de data enquanto digita
  const formatDateInput = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  // Handlers para input manual de data
  const handleDataInicioInputChange = (value: string) => {
    const formatted = formatDateInput(value);
    setDataInicioInput(formatted);
    if (formatted.length === 10) {
      const parsed = parseDateInput(formatted);
      if (parsed) setDataInicio(parsed);
    }
  };

  const handleDataFimInputChange = (value: string) => {
    const formatted = formatDateInput(value);
    setDataFimInput(formatted);
    if (formatted.length === 10) {
      const parsed = parseDateInput(formatted);
      if (parsed) setDataFim(parsed);
    }
  };

  // Sincroniza input com calendário
  useEffect(() => {
    if (dataInicio) {
      setDataInicioInput(format(dataInicio, "dd/MM/yyyy"));
    } else {
      setDataInicioInput("");
    }
  }, [dataInicio]);

  useEffect(() => {
    if (dataFim) {
      setDataFimInput(format(dataFim, "dd/MM/yyyy"));
    } else {
      setDataFimInput("");
    }
  }, [dataFim]);

  // Quando o ano é selecionado, define o range do ano inteiro
  useEffect(() => {
    if (anoSelecionado) {
      const ano = parseInt(anoSelecionado);
      setDataInicio(new Date(ano, 0, 1));
      setDataFim(new Date(ano, 11, 31));
    }
  }, [anoSelecionado]);

  // Lê o status da URL ou usa "all" como padrão
  const statusFilter = searchParams.get("status") || "all";

  // Função para atualizar o filtro de status (sincroniza com URL)
  const setStatusFilter = (status: string) => {
    if (status === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
  };

  // Função para converter string de data DD/MM/YYYY HH:mm para Date
  const parseData = (dataStr: string) => {
    const [dataPart] = dataStr.split(" ");
    const [dia, mes, ano] = dataPart.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
  };

  const filteredArquivos = arquivos.filter((a) => {
    const matchesSearch =
      a.placa.toLowerCase().includes(search.toLowerCase()) ||
      a.unidade.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    
    // Filtro por data
    const arquivoData = parseData(a.data);
    const matchesDataInicio = !dataInicio || arquivoData >= dataInicio;
    const matchesDataFim = !dataFim || arquivoData <= dataFim;
    
    return matchesSearch && matchesStatus && matchesDataInicio && matchesDataFim;
  });

  const handleStatusChange = (newStatus: string) => {
    toast({
      title: "Status atualizado",
      description: `O arquivo foi marcado como ${newStatus}.`,
    });
    setStatusDialog({ open: false, arquivo: null });
  };

  const statusCounts = getStatusCounts();

  // Verifica se há filtros ativos
  const hasActiveFilters = statusFilter !== "all" || search !== "" || dataInicio || dataFim || anoSelecionado !== "";

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearch("");
    setDataInicio(undefined);
    setDataFim(undefined);
    setAnoSelecionado("");
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-6">
      {/* Header com título e botão limpar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Arquivos Recebidos</h1>
          <p className="text-muted-foreground">Gerencie os arquivos enviados pelos franqueados.</p>
        </div>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllFilters}
            className="gap-2 self-start sm:self-auto"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
          >
            Todos
            <span className="ml-1.5 text-xs opacity-70">({statusCounts.all})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground rounded-full px-4"
          >
            Pendentes
            <span className="ml-1.5 text-xs opacity-70">({statusCounts.pending})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="processing" 
            className="data-[state=active]:bg-info data-[state=active]:text-info-foreground rounded-full px-4"
          >
            Processando
            <span className="ml-1.5 text-xs opacity-70">({statusCounts.processing})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="data-[state=active]:bg-success data-[state=active]:text-success-foreground rounded-full px-4"
          >
            Concluídos
            <span className="ml-1.5 text-xs opacity-70">({statusCounts.completed})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled" 
            className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground rounded-full px-4"
          >
            Cancelados
            <span className="ml-1.5 text-xs opacity-70">({statusCounts.cancelled})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa ou unidade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filtros de data */}
            <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
              {/* Seletor de Ano */}
              <div className="flex-1 sm:max-w-[150px]">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Selecione o Ano</label>
                <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((ano) => (
                      <SelectItem key={ano} value={ano}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data Início com input manual */}
              <div className="flex-1 sm:max-w-[200px]">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        placeholder="dd/mm/aaaa"
                        value={dataInicioInput}
                        onChange={(e) => handleDataInicioInputChange(e.target.value)}
                        className="pr-10"
                        maxLength={10}
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Data Fim com input manual */}
              <div className="flex-1 sm:max-w-[200px]">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        placeholder="dd/mm/aaaa"
                        value={dataFimInput}
                        onChange={(e) => handleDataFimInputChange(e.target.value)}
                        className="pr-10"
                        maxLength={10}
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataFim}
                      onSelect={setDataFim}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {(dataInicio || dataFim || anoSelecionado) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setDataInicio(undefined);
                    setDataFim(undefined);
                    setAnoSelecionado("");
                  }}
                >
                  Limpar datas
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Unidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Placa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Veículo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Serviço</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Data</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredArquivos.map((arquivo) => {
                  const tempo = calcularTempoDecorrido(arquivo.data);
                  return (
                  <tr key={arquivo.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                    <td className="py-4 px-4 font-medium">{arquivo.unidade}</td>
                    <td className="py-4 px-4 text-muted-foreground">{arquivo.placa}</td>
                    <td className="py-4 px-4 text-muted-foreground hidden md:table-cell">
                      {arquivo.marca} {arquivo.modelo}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{arquivo.servico}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        {getStatusBadge(arquivo.status)}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${getTempoClasses(tempo.level)}`}>
                          <Clock className="h-3 w-3" />
                          {tempo.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground hidden sm:table-cell">{arquivo.data}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ações rápidas visíveis no hover (desktop) */}
                        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => navigate(`/admin/arquivos/${arquivo.id}`)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {arquivo.status === "pending" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-success hover:text-success"
                              onClick={() => handleStatusChange("Concluído")}
                              title="Marcar como concluído"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Menu para ações secundárias (sempre visível) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Mobile: mostrar ações principais no menu */}
                            <DropdownMenuItem 
                              className="sm:hidden"
                              onClick={() => navigate(`/admin/arquivos/${arquivo.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem className="sm:hidden">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {arquivo.status === "pending" && (
                              <DropdownMenuItem 
                                className="sm:hidden text-success"
                                onClick={() => handleStatusChange("Concluído")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar como concluído
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="sm:hidden" />
                            
                            {/* Ações secundárias */}
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download original
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusDialog({ open: true, arquivo })}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Alterar status
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Upload className="h-4 w-4 mr-2" />
                              Enviar arquivo processado
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredArquivos.length} de {arquivos.length} arquivos
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ open, arquivo: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status</DialogTitle>
            <DialogDescription>
              Selecione o novo status para o arquivo {statusDialog.arquivo?.placa}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" onClick={() => handleStatusChange("Processando")}>
              Processando
            </Button>
            <Button variant="outline" onClick={() => handleStatusChange("Concluído")}>
              Concluído
            </Button>
            <Button variant="outline" onClick={() => handleStatusChange("Recall Original")}>
              Recall Original
            </Button>
            <Button variant="outline" onClick={() => handleStatusChange("Arquivo complexo 48h")}>
              Arquivo complexo 48h
            </Button>
            <Button variant="outline" onClick={() => handleStatusChange("Contate o financeiro")}>
              Contate o financeiro
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => handleStatusChange("Cancelado")}>
              Cancelado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
