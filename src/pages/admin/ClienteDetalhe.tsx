import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Car,
  FileText,
  BarChart3,
  Loader2,
  Download,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { LGPDExportModal } from "@/components/admin/LGPDExportModal";

interface Customer {
  id: string;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address_line: string | null;
  address_city: string | null;
  address_state: string | null;
  active_city: string | null;
  created_at: string;
  unit?: {
    id: string;
    name: string;
  };
}

interface Vehicle {
  id: string;
  plate: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
  category: string | null;
  engine: string | null;
}

interface Service {
  id: string;
  service_type: string;
  protocol: string | null;
  status: string | null;
  amount_brl: number | null;
  description: string | null;
  created_at: string;
  vehicle?: {
    plate: string | null;
    model: string | null;
  };
}

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isFranchisor = userRole === "admin" || userRole === "suporte";

  useEffect(() => {
    if (id) loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    setIsLoading(true);
    try {
      // Load customer with unit
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select(`*, unit:units(id, name)`)
        .eq("id", id)
        .maybeSingle();

      if (customerError) throw customerError;
      if (!customerData) {
        toast.error("Cliente não encontrado");
        navigate("/admin/clientes");
        return;
      }
      setCustomer(customerData);

      // Load vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false });
      setVehicles(vehiclesData || []);

      // Load services with vehicle info
      const { data: servicesData } = await supabase
        .from("services")
        .select(`*, vehicle:vehicles(plate, model)`)
        .eq("customer_id", id)
        .order("created_at", { ascending: false });
      setServices(servicesData || []);
    } catch (error) {
      console.error("Error loading customer:", error);
      toast.error("Erro ao carregar cliente");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const totalSpent = services.reduce((acc, s) => acc + (s.amount_brl || 0), 0);
  const lastService = services[0]?.created_at;

  const handleExport = async () => {
    if (!customer) return;
    setIsExporting(true);
    try {
      // Log export
      await supabase.from("exports_log").insert({
        requested_by_user_id: user?.id,
        unit_id: customer.unit?.id || null,
        export_type: "customer_detail_csv",
        filters_used: { customer_id: id },
        accepted_privacy_terms: true,
        accepted_at: new Date().toISOString(),
      });

      // Generate CSV
      const headers = ["Tipo", "Protocolo", "Veículo", "Status", "Valor", "Data"];
      const rows = services.map((s) => [
        s.service_type,
        s.protocol || "",
        s.vehicle ? `${s.vehicle.model} - ${s.vehicle.plate}` : "",
        s.status || "",
        s.amount_brl ? `R$ ${s.amount_brl.toFixed(2)}` : "",
        new Date(s.created_at).toLocaleDateString("pt-BR"),
      ]);

      const csvContent = [
        `# Cliente: ${customer.full_name}`,
        `# CPF/CNPJ: ${customer.cpf || customer.cnpj || "-"}`,
        `# Unidade: ${customer.unit?.name || "-"}`,
        "",
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cliente_${customer.full_name.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Histórico exportado com sucesso");
      setShowExportModal(false);
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Concluído</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status || "-"}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.full_name}</h1>
            <p className="text-muted-foreground">
              {customer.cpf || customer.cnpj || "Sem documento"}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowExportModal(true)}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Histórico
        </Button>
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="veiculos" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Veículos
            <Badge variant="secondary" className="ml-1 text-xs">
              {vehicles.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="servicos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Serviços
            <Badge variant="secondary" className="ml-1 text-xs">
              {services.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="dados" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Serviços</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{services.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Gasto</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  R$ {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Veículos Cadastrados</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{vehicles.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Último Atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {lastService
                    ? new Date(lastService).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Services */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Serviços</CardTitle>
              <CardDescription>Histórico recente de atendimentos</CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum serviço registrado
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.slice(0, 5).map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          {new Date(service.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {service.service_type}
                        </TableCell>
                        <TableCell>
                          {service.vehicle
                            ? `${service.vehicle.model} - ${service.vehicle.plate}`
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(service.status)}</TableCell>
                        <TableCell className="text-right">
                          {service.amount_brl
                            ? `R$ ${service.amount_brl.toFixed(2)}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="veiculos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Veículos</CardTitle>
              <CardDescription>Veículos cadastrados para este cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum veículo cadastrado</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="border-2">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{vehicle.model || "Sem modelo"}</p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.brand || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Placa</span>
                            <span className="font-medium">{vehicle.plate || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ano</span>
                            <span>{vehicle.year || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Motor</span>
                            <span>{vehicle.engine || "-"}</span>
                          </div>
                          {vehicle.category && (
                            <div className="pt-2">
                              <Badge variant="outline">{vehicle.category}</Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Serviços</CardTitle>
              <CardDescription>Todos os serviços realizados</CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum serviço registrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          {new Date(service.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {service.protocol || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {service.service_type}
                        </TableCell>
                        <TableCell>
                          {service.vehicle
                            ? `${service.vehicle.model} - ${service.vehicle.plate}`
                            : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {service.description || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(service.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {service.amount_brl
                            ? `R$ ${service.amount_brl.toFixed(2)}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dados" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Cadastrais</CardTitle>
              <CardDescription>Informações do cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{customer.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {customer.cpf ? "CPF" : "CNPJ"}
                      </p>
                      <p className="font-medium">
                        {customer.cpf || customer.cnpj || "-"}
                      </p>
                    </div>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{customer.email}</p>
                      </div>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {customer.address_line && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <p className="font-medium">{customer.address_line}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.address_city}, {customer.address_state}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer.active_city && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cidade Ativa</p>
                        <p className="font-medium">{customer.active_city}</p>
                      </div>
                    </div>
                  )}
                  {isFranchisor && customer.unit && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Unidade</p>
                        <p className="font-medium">{customer.unit.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente desde</p>
                      <p className="font-medium">
                        {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LGPDExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onConfirm={handleExport}
        exportType="Histórico do Cliente (CSV)"
        isLoading={isExporting}
      />
    </div>
  );
}
