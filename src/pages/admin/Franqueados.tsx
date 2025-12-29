import { useState } from "react";
import { Search, Filter, Eye, Edit, Lock, Unlock, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";

const franqueados = [
  {
    id: 1,
    nome: "São Paulo - Centro",
    cnpj: "12.345.678/0001-90",
    tipo: "Full",
    status: "Ativo",
    contrato: "10/01/2025",
    areas: ["São Paulo", "Guarulhos", "Osasco"],
    arquivos: 45,
  },
  {
    id: 2,
    nome: "Rio de Janeiro",
    cnpj: "23.456.789/0001-01",
    tipo: "Full",
    status: "Ativo",
    contrato: "15/03/2025",
    areas: ["Rio de Janeiro", "Niterói"],
    arquivos: 38,
  },
  {
    id: 3,
    nome: "Belo Horizonte",
    cnpj: "34.567.890/0001-12",
    tipo: "Leve",
    status: "Ativo",
    contrato: "20/02/2025",
    areas: ["Belo Horizonte", "Contagem"],
    arquivos: 32,
  },
  {
    id: 4,
    nome: "Curitiba",
    cnpj: "45.678.901/0001-23",
    tipo: "Full",
    status: "Vencendo",
    contrato: "05/01/2025",
    areas: ["Curitiba", "São José dos Pinhais"],
    arquivos: 28,
  },
  {
    id: 5,
    nome: "Porto Alegre",
    cnpj: "56.789.012/0001-34",
    tipo: "Leve",
    status: "Bloqueado",
    contrato: "01/12/2024",
    areas: ["Porto Alegre"],
    arquivos: 24,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Ativo":
      return <span className="status-badge status-completed">{status}</span>;
    case "Vencendo":
      return <span className="status-badge status-processing">{status}</span>;
    case "Bloqueado":
      return <span className="status-badge status-cancelled">{status}</span>;
    default:
      return <span className="status-badge status-pending">{status}</span>;
  }
};

const getTipoBadge = (tipo: string) => {
  return tipo === "Full" ? (
    <Badge className="bg-primary/20 text-primary border-primary/30">Full</Badge>
  ) : (
    <Badge variant="outline">Leve</Badge>
  );
};

export default function AdminFranqueados() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredFranqueados = franqueados.filter((f) => {
    const matchesSearch = f.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Franqueados</h1>
          <p className="text-muted-foreground">Gerencie todas as unidades franqueadas.</p>
        </div>
        <Button variant="hero">
          <Plus className="h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
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
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Vencendo">Vencendo</SelectItem>
                <SelectItem value="Bloqueado">Bloqueado</SelectItem>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contrato</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Áreas</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Arquivos</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFranqueados.map((franqueado) => (
                  <tr key={franqueado.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{franqueado.nome}</p>
                        <p className="text-sm text-muted-foreground">{franqueado.cnpj}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getTipoBadge(franqueado.tipo)}</td>
                    <td className="py-4 px-4">{getStatusBadge(franqueado.status)}</td>
                    <td className="py-4 px-4 text-muted-foreground">{franqueado.contrato}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {franqueado.areas.slice(0, 2).map((area) => (
                          <Badge key={area} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {franqueado.areas.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{franqueado.areas.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{franqueado.arquivos}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
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
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {franqueado.status === "Bloqueado" ? (
                              <DropdownMenuItem className="text-success">
                                <Unlock className="h-4 w-4 mr-2" />
                                Desbloquear
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-destructive">
                                <Lock className="h-4 w-4 mr-2" />
                                Bloquear
                              </DropdownMenuItem>
                            )}
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
              Mostrando {filteredFranqueados.length} de {franqueados.length} unidades
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
