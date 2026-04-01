import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  Users,
  Loader2,
  Eye,
  Plus,
  X,
  Building2,
  MapPin,
  ToggleLeft,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { LGPDExportModal } from "@/components/admin/LGPDExportModal";
import { NovoClienteDrawer } from "@/components/admin/NovoClienteDrawer";

interface Customer {
  id: string;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  active_city: string | null;
  address_city: string | null;
  address_state: string | null;
  is_active: boolean;
  type: string;
  unit_id: string;
  created_at: string;
  unit?: {
    name: string;
  };
  last_service_date?: string | null;
  total_services?: number;
}

interface Unit {
  id: string;
  name: string;
}

export default function Clientes() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNovoClienteDrawer, setShowNovoClienteDrawer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search para evitar re-renders excessivos
  const debouncedSearch = useDebounce(search, 300);

  const isFranchisor = userRole === "admin" || userRole === "suporte";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load units if franchisor
      if (isFranchisor) {
        const { data: unitsData } = await supabase
          .from("units")
          .select("id, name")
          .order("name");
        setUnits(unitsData || []);
      }

      // Load customers with unit info and service stats in ONE query (fix N+1)
      // Using a subquery approach to avoid N+1 queries
      const { data: customersData, error } = await supabase
        .from("customers")
        .select(`
          *,
          unit:units(name)
        `)
        .order("full_name");

      if (error) throw error;

      // Get all services in a single query instead of N queries
      const customerIds = (customersData || []).map(c => c.id);
      
      let serviceStats: Record<string, { count: number; lastDate: string | null }> = {};
      
      if (customerIds.length > 0) {
        const { data: servicesData } = await supabase
          .from("services")
          .select("customer_id, created_at")
          .in("customer_id", customerIds)
          .order("created_at", { ascending: false });

        // Aggregate service stats in memory
        (servicesData || []).forEach(service => {
          if (!serviceStats[service.customer_id]) {
            serviceStats[service.customer_id] = {
              count: 0,
              lastDate: service.created_at // First one is the most recent due to ordering
            };
          }
          serviceStats[service.customer_id].count++;
        });
      }

      // Merge service stats into customers
      const customersWithServices = (customersData || []).map(customer => ({
        ...customer,
        last_service_date: serviceStats[customer.id]?.lastDate || null,
        total_services: serviceStats[customer.id]?.count || 0,
      }));

      setCustomers(customersWithServices);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique cities and states for filters
  const uniqueCities = useMemo(() => {
    const cities = customers.map((c) => c.active_city).filter(Boolean);
    return [...new Set(cities)].sort();
  }, [customers]);

  const uniqueStates = useMemo(() => {
    const states = customers.map((c) => c.address_state).filter(Boolean);
    return [...new Set(states)].sort();
  }, [customers]);

  // Use debounced search for filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        !debouncedSearch ||
        c.full_name.toLowerCase().includes(searchLower) ||
        c.cpf?.includes(debouncedSearch) ||
        c.cnpj?.includes(debouncedSearch) ||
        c.phone?.includes(debouncedSearch) ||
        c.email?.toLowerCase().includes(searchLower);

      const matchesUnit = unitFilter === "all" || c.unit_id === unitFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
      const matchesCity = cityFilter === "all" || (c.active_city === cityFilter || c.address_city === cityFilter);
      const matchesState = stateFilter === "all" || c.address_state === stateFilter;

      return matchesSearch && matchesUnit && matchesStatus && matchesCity && matchesState;
    });
  }, [customers, debouncedSearch, unitFilter, statusFilter, cityFilter, stateFilter]);

  const clearFilters = () => {
    setSearch("");
    setUnitFilter("all");
    setStatusFilter("all");
    setCityFilter("all");
    setStateFilter("all");
  };

  const hasActiveFilters =
    search || unitFilter !== "all" || statusFilter !== "all" || cityFilter !== "all" || stateFilter !== "all";

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Log export to exports_log
      await supabase.from("exports_log").insert({
        requested_by_user_id: user?.id,
        unit_id: unitFilter !== "all" ? unitFilter : null,
        export_type: "customers_csv",
        filters_used: {
          search,
          unit: unitFilter,
          city: cityFilter,
          state: stateFilter,
        },
        accepted_privacy_terms: true,
        accepted_at: new Date().toISOString(),
      });

      // Generate CSV
      const headers = [
        "Nome",
        "CPF",
        "CNPJ",
        "Email",
        "Telefone",
        "Cidade Ativa",
        "Estado",
        "Unidade",
        "Total Serviços",
        "Último Serviço",
      ];

      const rows = filteredCustomers.map((c) => [
        c.full_name,
        c.cpf || "",
        c.cnpj || "",
        c.email || "",
        c.phone || "",
        c.active_city || "",
        c.address_state || "",
        c.unit?.name || "",
        c.total_services || 0,
        c.last_service_date
          ? new Date(c.last_service_date).toLocaleDateString("pt-BR")
          : "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Exportação realizada com sucesso");
      setShowExportModal(false);
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setIsExporting(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            {customers.length} cliente{customers.length !== 1 ? "s" : ""} cadastrado
            {customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="hero" onClick={() => setShowNovoClienteDrawer(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Buscar por nome, CPF, CNPJ, telefone ou email..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="pl-10"
                 />
              </div>

              {isFranchisor && (
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city!}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueStates.map((state) => (
                    <SelectItem key={state} value={state!}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Busca: {search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSearch("")}
                    />
                  </Badge>
                )}
                {unitFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Unidade: {units.find((u) => u.id === unitFilter)?.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setUnitFilter("all")}
                    />
                  </Badge>
                )}
                {cityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Cidade: {cityFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCityFilter("all")}
                    />
                  </Badge>
                )}
                {stateFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Estado: {stateFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setStateFilter("all")}
                    />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar todos
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Clientes
          </CardTitle>
          <CardDescription>
            {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? "s" : ""}{" "}
            encontrado{filteredCustomers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {customers.length === 0
                  ? "Nenhum cliente cadastrado ainda"
                  : "Nenhum cliente encontrado com os filtros aplicados"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Cidade/Estado</TableHead>
                  {isFranchisor && <TableHead>Unidade</TableHead>}
                  <TableHead>Serviços</TableHead>
                  <TableHead>Último Serviço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/clientes/${customer.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.full_name}</p>
                        {customer.email && (
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.cpf || customer.cnpj || "-"}
                    </TableCell>
                    <TableCell>
                      {customer.active_city && customer.address_state ? (
                        <span>
                          {customer.active_city}/{customer.address_state}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {isFranchisor && (
                      <TableCell>
                        <Badge variant="outline">{customer.unit?.name || "-"}</Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary">{customer.total_services}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.last_service_date
                        ? new Date(customer.last_service_date).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/clientes/${customer.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver histórico
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LGPDExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onConfirm={handleExport}
        exportType="Lista de Clientes (CSV)"
        isLoading={isExporting}
      />

      <NovoClienteDrawer
        open={showNovoClienteDrawer}
        onOpenChange={setShowNovoClienteDrawer}
        onSuccess={loadData}
      />
    </div>
  );
}
