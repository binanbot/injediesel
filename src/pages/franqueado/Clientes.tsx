import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Users, Search, Plus, Eye, Phone, Mail, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  cnpj: string | null;
  address_city: string | null;
  address_state: string | null;
  is_active: boolean;
  created_at: string | null;
  vehicles_count?: number;
  services_count?: number;
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
    loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          *,
          vehicles:vehicles(count),
          services:services(count)
        `)
        .order("full_name", { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((c: any) => ({
        ...c,
        is_active: c.is_active ?? true,
        vehicles_count: c.vehicles?.[0]?.count || 0,
        services_count: c.services?.[0]?.count || 0,
      }));
      setCustomers(mapped);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = customers
    .filter((c) => {
      if (statusFilter === "ativos") return c.is_active;
      if (statusFilter === "inativos") return !c.is_active;
      return true;
    })
    .filter((c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.cpf?.includes(search) ||
      c.cnpj?.includes(search)
    );

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <ToggleRight className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{counts.ativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Clientes cadastrados na sua unidade</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
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
                {customers.length === 0
                  ? "Nenhum cliente cadastrado"
                  : "Nenhum cliente encontrado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/franqueado/clientes/${c.id}`)}>
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {c.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" /> {c.email}
                            </div>
                          )}
                          {c.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" /> {c.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.cpf || c.cnpj || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {c.address_city && c.address_state ? `${c.address_city}/${c.address_state}` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.is_active ? "default" : "secondary"}>
                          {c.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/franqueado/clientes/${c.id}`); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
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
