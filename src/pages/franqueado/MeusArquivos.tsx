import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Search, Filter, Eye, MoreHorizontal, CalendarIcon, Clock, X, Lock } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useContractStatus } from "@/hooks/useContractStatus";
import { toast } from "@/hooks/use-toast";

const arquivos = [
  { id: 1, placa: "ABC-1234", marca: "Volvo", modelo: "FH 540", servico: "Stage 1", status: "completed", data: "28/12/2024" },
  { id: 2, placa: "DEF-5678", marca: "Scania", modelo: "R 450", servico: "DPF Off", status: "processing", data: "28/12/2024" },
  { id: 3, placa: "GHI-9012", marca: "Mercedes", modelo: "Actros", servico: "EGR Off", status: "completed", data: "27/12/2024" },
  { id: 4, placa: "JKL-3456", marca: "DAF", modelo: "XF 105", servico: "AdBlue Off", status: "cancelled", data: "27/12/2024" },
  { id: 5, placa: "MNO-7890", marca: "MAN", modelo: "TGX", servico: "Stage 2", status: "recall", data: "26/12/2024" },
  { id: 6, placa: "PQR-1234", marca: "Iveco", modelo: "Stralis", servico: "Speed Limiter", status: "complex", data: "26/12/2024" },
  { id: 7, placa: "STU-5678", marca: "Volvo", modelo: "FM 460", servico: "Hot Start", status: "financial", data: "25/12/2024" },
  { id: 8, placa: "VWX-9012", marca: "Scania", modelo: "P 360", servico: "DTC Off", status: "completed", data: "25/12/2024" },
];

// Contagem por status para exibir nas tabs
const getStatusCounts = () => {
  const counts = { all: arquivos.length, processing: 0, completed: 0, other: 0 };
  arquivos.forEach(a => {
    if (a.status === "processing") counts.processing++;
    else if (a.status === "completed") counts.completed++;
    else counts.other++;
  });
  return counts;
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

export default function MeusArquivos() {
  const navigate = useNavigate();
  const contractStatus = useContractStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  const handleDownloadClick = (e: React.MouseEvent) => {
    if (contractStatus.isExpired) {
      e.preventDefault();
      e.stopPropagation();
      toast({
        title: "Download bloqueado",
        description: "Seu contrato está vencido. Renove para fazer download dos arquivos.",
        variant: "destructive",
      });
    }
  };

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

  // Função para converter string de data DD/MM/YYYY para Date
  const parseData = (dataStr: string) => {
    const [dia, mes, ano] = dataStr.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
  };

  // Filtro especial para "other" (todos exceto processing e completed)
  const filteredArquivos = arquivos.filter(arquivo => {
    const matchesSearch = 
      arquivo.placa.toLowerCase().includes(search.toLowerCase()) ||
      arquivo.marca.toLowerCase().includes(search.toLowerCase()) ||
      arquivo.modelo.toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "other") {
      matchesStatus = !["processing", "completed"].includes(arquivo.status);
    } else {
      matchesStatus = arquivo.status === statusFilter;
    }
    
    // Filtro por data
    const arquivoData = parseData(arquivo.data);
    const matchesDataInicio = !dataInicio || arquivoData >= dataInicio;
    const matchesDataFim = !dataFim || arquivoData <= dataFim;
    
    return matchesSearch && matchesStatus && matchesDataInicio && matchesDataFim;
  });

  const statusCounts = getStatusCounts();

  // Verifica se há filtros ativos
  const hasActiveFilters = statusFilter !== "all" || search !== "" || dataInicio || dataFim;

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearch("");
    setDataInicio(undefined);
    setDataFim(undefined);
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-6">
      {/* Header com título e botão limpar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Arquivos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus arquivos enviados.</p>
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
            value="other" 
            className="data-[state=active]:bg-muted data-[state=active]:text-muted-foreground rounded-full px-4"
          >
            Outros
            <span className="ml-1.5 text-xs opacity-70">({statusCounts.other})</span>
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
                  placeholder="Buscar por placa, marca ou modelo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filtros de data */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 sm:max-w-[200px]">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
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
              
              <div className="flex-1 sm:max-w-[200px]">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
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
              
              {(dataInicio || dataFim) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setDataInicio(undefined);
                    setDataFim(undefined);
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Placa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Veículo</th>
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
                  <tr 
                    key={arquivo.id} 
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/franqueado/arquivos/${arquivo.id}`)}
                  >
                    <td className="py-4 px-4 font-medium">{arquivo.placa}</td>
                    <td className="py-4 px-4 text-muted-foreground">
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
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Ações rápidas visíveis no hover (desktop) */}
                        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => navigate(`/franqueado/arquivos/${arquivo.id}`)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {arquivo.status === "completed" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-8 w-8 ${contractStatus.isExpired ? "text-muted-foreground" : "text-success hover:text-success"}`}
                              title={contractStatus.isExpired ? "Contrato vencido" : "Download"}
                              onClick={handleDownloadClick}
                              disabled={contractStatus.isExpired}
                            >
                              {contractStatus.isExpired ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
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
                              onClick={() => navigate(`/franqueado/arquivos/${arquivo.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            {arquivo.status === "completed" && (
                              <DropdownMenuItem 
                                className="sm:hidden" 
                                onClick={handleDownloadClick}
                                disabled={contractStatus.isExpired}
                              >
                                {contractStatus.isExpired ? <Lock className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                                {contractStatus.isExpired ? "Bloqueado" : "Download"}
                              </DropdownMenuItem>
                            )}
                            {/* Ações secundárias */}
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download original
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

          {filteredArquivos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum arquivo encontrado.</p>
            </div>
          )}

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
    </div>
  );
}
