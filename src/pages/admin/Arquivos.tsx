import { useState } from "react";
import { Search, Filter, Download, Upload, Eye, MoreHorizontal, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const arquivos = [
  { id: 1, unidade: "São Paulo - Centro", placa: "ABC-1234", marca: "Volvo", modelo: "FH 540", servico: "Stage 1", status: "pending", data: "28/12/2024 14:30" },
  { id: 2, unidade: "Rio de Janeiro", placa: "DEF-5678", marca: "Scania", modelo: "R 450", servico: "DPF Off", status: "processing", data: "28/12/2024 13:15" },
  { id: 3, unidade: "Belo Horizonte", placa: "GHI-9012", marca: "Mercedes", modelo: "Actros", servico: "EGR Off", status: "completed", data: "28/12/2024 11:00" },
  { id: 4, unidade: "Curitiba", placa: "JKL-3456", marca: "DAF", modelo: "XF 105", servico: "AdBlue Off", status: "pending", data: "28/12/2024 10:45" },
  { id: 5, unidade: "Porto Alegre", placa: "MNO-7890", marca: "MAN", modelo: "TGX", servico: "Stage 2", status: "cancelled", data: "27/12/2024 16:20" },
  { id: 6, unidade: "São Paulo - Centro", placa: "PQR-1234", marca: "Iveco", modelo: "Stralis", servico: "Speed Limiter", status: "completed", data: "27/12/2024 15:00" },
];

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; arquivo: typeof arquivos[0] | null }>({
    open: false,
    arquivo: null,
  });

  const filteredArquivos = arquivos.filter((a) => {
    const matchesSearch =
      a.placa.toLowerCase().includes(search.toLowerCase()) ||
      a.unidade.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (newStatus: string) => {
    toast({
      title: "Status atualizado",
      description: `O arquivo foi marcado como ${newStatus}.`,
    });
    setStatusDialog({ open: false, arquivo: null });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Arquivos Recebidos</h1>
        <p className="text-muted-foreground">Gerencie os arquivos enviados pelos franqueados.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Veículo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Serviço</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredArquivos.map((arquivo) => (
                  <tr key={arquivo.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4 font-medium">{arquivo.unidade}</td>
                    <td className="py-4 px-4 text-muted-foreground">{arquivo.placa}</td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {arquivo.marca} {arquivo.modelo}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{arquivo.servico}</td>
                    <td className="py-4 px-4">{getStatusBadge(arquivo.status)}</td>
                    <td className="py-4 px-4 text-muted-foreground">{arquivo.data}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
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
                            <DropdownMenuItem className="text-success">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como concluído
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
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
