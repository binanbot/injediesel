import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users, Search, Plus, Eye, Pencil, Phone, Car,
  ToggleLeft, ToggleRight, Loader2, Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  cpf: string | null;
  cnpj: string | null;
  address_city: string | null;
  address_state: string | null;
  is_active: boolean;
  created_at: string | null;
  vehicles_count: number;
}

export default function Clientes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const statusFilter = searchParams.get("status") || "todos";

  useEffect(() => {
    if (user) loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(`*, vehicles:vehicles(count)`)
        .order("full_name", { ascending: true });

      if (error) throw error;

      setCustomers(
        (data || []).map((c: any) => ({
          ...c,
          is_active: c.is_active ?? true,
          vehicles_count: c.vehicles?.[0]?.count || 0,
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !customer.is_active;
    const { error } = await supabase
      .from("customers")
      .update({ is_active: newStatus } as any)
      .eq("id", customer.id);
    if (error) {
      toast.error("Erro ao alterar status");
      return;
    }
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, is_active: newStatus } : c))
    );
    toast.success(newStatus ? "Cliente reativado" : "Cliente inativado");
  };

  const filtered = customers
    .filter((c) => {
      if (statusFilter === "ativos") return c.is_active;
      if (statusFilter === "inativos") return !c.is_active;
      return true;
    })
    .filter((c) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(s) ||
        c.phone?.includes(search) ||
        c.cpf?.includes(search) ||
        c.cnpj?.includes(search)
      );
    });

  const counts = {
    todos: customers.length,
    ativos: customers.filter((c) => c.is_active).length,
    inativos: customers.filter((c) => !c.is_active).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os clientes da sua unidade</p>
        </div>
        <Button variant="hero" onClick={() => navigate("/franqueado/clientes/novo")}>
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{counts.todos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <ToggleRight className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{counts.ativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <ToggleLeft className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold">{counts.inativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Clientes cadastrados na sua unidade</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nome, CPF, CNPJ, telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setSearchParams(v === "todos" ? {} : { status: v })}
            className="mt-2"
          >
            <TabsList>
              <TabsTrigger value="todos">Todos ({counts.todos})</TabsTrigger>
              <TabsTrigger value="ativos">Ativos ({counts.ativos})</TabsTrigger>
              <TabsTrigger value="inativos">Inativos ({counts.inativos})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {customers.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
              </p>
              {customers.length === 0 && (
                <Button variant="outline" className="mt-4" onClick={() => navigate("/franqueado/clientes/novo")}>
                  <Plus className="h-4 w-4" /> Cadastrar primeiro cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Car className="h-3.5 w-3.5" /> Veículos
                      </div>
                    </TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => navigate(`/franqueado/clientes/${c.id}`)}
                    >
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {c.cpf || c.cnpj || "—"}
                      </TableCell>
                      <TableCell>
                        {c.phone ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.address_city && c.address_state
                          ? `${c.address_city}/${c.address_state}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{c.vehicles_count}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {c.created_at
                            ? format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.is_active ? "default" : "secondary"}>
                          {c.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">•••</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/franqueado/clientes/${c.id}`); }}>
                              <Eye className="h-4 w-4 mr-2" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/franqueado/clientes/${c.id}/editar`); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => toggleActive(c, e)}>
                              {c.is_active
                                ? <><ToggleLeft className="h-4 w-4 mr-2" /> Inativar</>
                                : <><ToggleRight className="h-4 w-4 mr-2" /> Reativar</>
                              }
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
