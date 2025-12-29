import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Search, Filter, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const filteredArquivos = arquivos.filter(arquivo => {
    const matchesSearch = 
      arquivo.placa.toLowerCase().includes(search.toLowerCase()) ||
      arquivo.marca.toLowerCase().includes(search.toLowerCase()) ||
      arquivo.modelo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || arquivo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Arquivos</h1>
        <p className="text-muted-foreground">Gerencie todos os seus arquivos enviados.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="recall">Recall Original</SelectItem>
                <SelectItem value="complex">Arquivo complexo</SelectItem>
                <SelectItem value="financial">Contate financeiro</SelectItem>
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
                  <tr 
                    key={arquivo.id} 
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/franqueado/arquivos/${arquivo.id}`)}
                  >
                    <td className="py-4 px-4 font-medium">{arquivo.placa}</td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {arquivo.marca} {arquivo.modelo}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{arquivo.servico}</td>
                    <td className="py-4 px-4">{getStatusBadge(arquivo.status)}</td>
                    <td className="py-4 px-4 text-muted-foreground">{arquivo.data}</td>
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {arquivo.status === "completed" ? (
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" disabled>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/franqueado/arquivos/${arquivo.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download original
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
