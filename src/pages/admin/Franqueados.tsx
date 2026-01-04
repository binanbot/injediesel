import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Filter, Eye, Edit, Lock, Unlock, MoreHorizontal, Plus, Loader2, Upload, Calendar, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FranchiseeProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  cnpj: string | null;
  contract_type: string | null;
  contract_expiration_date: string | null;
  is_prepaid: boolean;
  created_at: string;
  cidade: string | null;
}

const getStatusFromDate = (expirationDate: string | null): string => {
  if (!expirationDate) return "Ativo";
  const expDate = new Date(expirationDate);
  const today = new Date();
  const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) return "Vencido";
  if (daysUntilExpiration <= 30) return "Vencendo";
  return "Ativo";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Ativo":
      return <span className="status-badge status-completed">{status}</span>;
    case "Vencendo":
      return <span className="status-badge status-processing">{status}</span>;
    case "Vencido":
      return <span className="status-badge status-cancelled">{status}</span>;
    default:
      return <span className="status-badge status-pending">{status}</span>;
  }
};

const getTipoBadge = (tipo: string | null) => {
  return tipo === "Full" ? (
    <Badge className="bg-primary/20 text-primary border-primary/30">Full</Badge>
  ) : (
    <Badge variant="outline">{tipo || "Leve"}</Badge>
  );
};

export default function AdminFranqueados() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("usuarios");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contractTypeFilter, setContractTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [cidadeFilter, setCidadeFilter] = useState("all");
  const [franqueados, setFranqueados] = useState<FranchiseeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFranqueados();
  }, []);

  const loadFranqueados = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles_franchisees")
        .select("*")
        .order("display_name", { ascending: true });

      if (error) throw error;
      setFranqueados(data || []);
    } catch (error) {
      console.error("Error loading franchisees:", error);
      toast.error("Erro ao carregar franqueados");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setContractTypeFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCidadeFilter("all");
  };

  const hasActiveFilters = search || statusFilter !== "all" || contractTypeFilter !== "all" || dateFrom || dateTo || cidadeFilter !== "all";

  // Extract unique cities for filter dropdown
  const uniqueCidades = [...new Set(franqueados.map(f => f.cidade).filter(Boolean))].sort((a, b) => 
    (a || "").localeCompare(b || "", "pt-BR")
  );

  const filteredFranqueados = franqueados
    .filter((f) => {
      const name = f.display_name || `${f.first_name || ""} ${f.last_name || ""}`;
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase());
      
      const status = getStatusFromDate(f.contract_expiration_date);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      
      const matchesContractType = contractTypeFilter === "all" || 
        (contractTypeFilter === "Full" && f.contract_type === "Full") ||
        (contractTypeFilter === "Leve" && (!f.contract_type || f.contract_type !== "Full"));

      const createdDate = new Date(f.created_at);
      const matchesDateFrom = !dateFrom || createdDate >= dateFrom;
      const matchesDateTo = !dateTo || createdDate <= new Date(dateTo.getTime() + 86400000);

      const matchesCidade = cidadeFilter === "all" || f.cidade === cidadeFilter;
      
      return matchesSearch && matchesStatus && matchesContractType && matchesDateFrom && matchesDateTo && matchesCidade;
    })
    .sort((a, b) => {
      const nameA = (a.display_name || `${a.first_name || ""} ${a.last_name || ""}`).toLowerCase();
      const nameB = (b.display_name || `${b.first_name || ""} ${b.last_name || ""}`).toLowerCase();
      return nameA.localeCompare(nameB, "pt-BR");
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Franqueados</h1>
          <p className="text-muted-foreground">
            {franqueados.length} unidades cadastradas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/importar">
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Link>
          </Button>
          <Button variant="hero">
            <Plus className="h-4 w-4" />
            Nova Unidade
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="usuarios">
            Usuários
            <Badge variant="secondary" className="ml-2 text-xs">
              {franqueados.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4 mt-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tipo de Franquia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="Full">Full</SelectItem>
                      <SelectItem value="Leve">Leve</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                      <MapPin className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as cidades</SelectItem>
                      {uniqueCidades.map((cidade) => (
                        <SelectItem key={cidade} value={cidade!}>{cidade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Vencendo">Vencendo</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Data de criação:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-36 justify-start">
                          <Calendar className="h-4 w-4 mr-2" />
                          {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-36 justify-start">
                          <Calendar className="h-4 w-4 mr-2" />
                          {dateTo ? format(dateTo, "dd/MM/yyyy") : "Até"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="pt-6">
              {filteredFranqueados.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {franqueados.length === 0 
                      ? "Nenhum franqueado cadastrado ainda"
                      : "Nenhum franqueado encontrado com os filtros aplicados"
                    }
                  </p>
                  {franqueados.length === 0 && (
                    <Button asChild>
                      <Link to="/admin/importar">
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Franqueados
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cidade</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipo</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Criado em</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFranqueados.map((franqueado) => {
                        const status = getStatusFromDate(franqueado.contract_expiration_date);
                        const name = franqueado.display_name || 
                          `${franqueado.first_name || ""} ${franqueado.last_name || ""}`.trim() ||
                          "Sem nome";
                        
                        return (
                          <tr 
                            key={franqueado.id} 
                            className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                            onClick={() => navigate(`/admin/franqueados/${franqueado.id}`)}
                          >
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{name}</p>
                                {franqueado.cnpj && (
                                  <p className="text-sm text-muted-foreground">{franqueado.cnpj}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {franqueado.email}
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {franqueado.cidade || "-"}
                            </td>
                            <td className="py-4 px-4">{getTipoBadge(franqueado.contract_type)}</td>
                            <td className="py-4 px-4">{getStatusBadge(status)}</td>
                            <td className="py-4 px-4 text-muted-foreground">
                              {franqueado.created_at 
                                ? new Date(franqueado.created_at).toLocaleDateString("pt-BR")
                                : "-"
                              }
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/admin/franqueados/${franqueado.id}`)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver detalhes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/admin/franqueados/${franqueado.id}`)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {status === "Vencido" ? (
                                      <DropdownMenuItem className="text-success">
                                        <Unlock className="h-4 w-4 mr-2" />
                                        Renovar Contrato
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filteredFranqueados.length > 0 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {filteredFranqueados.length} de {franqueados.length} unidades
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Gestão de contratos em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}