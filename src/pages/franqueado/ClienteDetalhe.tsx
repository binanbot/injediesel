import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, ToggleLeft, ToggleRight, Phone, Mail,
  MapPin, Car, FileText, Loader2, MessageCircle, Plus, Wrench, Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Vehicle {
  id: string;
  plate: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
  engine: string | null;
  category: string | null;
  created_at: string | null;
}

interface ReceivedFile {
  id: string;
  placa: string;
  servico: string;
  status: string;
  created_at: string;
  marca: string | null;
  modelo: string | null;
}

interface Service {
  id: string;
  service_type: string;
  status: string | null;
  amount_brl: number | null;
  description: string | null;
  created_at: string | null;
  protocol: string | null;
}

export default function ClienteDetalhe() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [files, setFiles] = useState<ReceivedFile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [customerRes, vehiclesRes, filesRes, servicesRes] = await Promise.all([
        supabase.from("customers").select("*").eq("id", id!).single(),
        supabase.from("vehicles").select("*").eq("customer_id", id!).order("created_at", { ascending: false }),
        supabase.from("received_files").select("id, placa, servico, status, created_at, marca, modelo").eq("customer_id", id!).order("created_at", { ascending: false }),
        supabase.from("services").select("*").eq("customer_id", id!).order("created_at", { ascending: false }),
      ]);

      if (customerRes.error) throw customerRes.error;
      setCustomer(customerRes.data);
      setVehicles(vehiclesRes.data || []);
      setFiles(filesRes.data || []);
      setServices(servicesRes.data || []);
    } catch {
      toast.error("Cliente não encontrado ou sem permissão");
      navigate("/franqueado/clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const hasBindings = vehicles.length > 0 || services.length > 0 || files.length > 0;

  const toggleActive = async () => {
    const newStatus = !(customer.is_active ?? true);
    const { error } = await supabase.from("customers").update({ is_active: newStatus } as any).eq("id", id!);
    if (error) { toast.error("Erro ao alterar status"); return; }
    setCustomer({ ...customer, is_active: newStatus });
    toast.success(newStatus ? "Cliente reativado" : "Cliente inativado");
  };

  const handleDelete = async () => {
    const { data, error } = await supabase.rpc("safe_delete_customer", {
      _customer_id: id!,
    });

    if (error) {
      toast.error("Erro ao excluir cliente");
      return;
    }

    const result = data as any;
    if (!result.success) {
      const parts: string[] = [];
      if (result.vehicles > 0) parts.push(`${result.vehicles} veículo(s)`);
      if (result.files > 0) parts.push(`${result.files} arquivo(s)`);
      if (result.services > 0) parts.push(`${result.services} serviço(s)`);
      toast.error(
        parts.length > 0
          ? `Não é possível excluir: possui ${parts.join(", ")}. Inative o cliente.`
          : result.reason
      );
      return;
    }

    toast.success("Cliente excluído permanentemente");
    navigate("/franqueado/clientes");
  };

  if (isLoading || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isActive = customer.is_active ?? true;
  const d = customer as any;

  const fullAddress = [
    d.address_line,
    d.address_number && `nº ${d.address_number}`,
    d.address_complement,
  ].filter(Boolean).join(", ");

  const cityState = [d.address_city, d.address_state].filter(Boolean).join("/");

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: "Pendente", variant: "outline" },
      processing: { label: "Processando", variant: "default" },
      completed: { label: "Concluído", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    return map[s] || { label: s, variant: "outline" as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/franqueado/clientes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{customer.full_name}</h1>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Ativo" : "Inativo"}
              </Badge>
              {d.type && (
                <Badge variant="outline">{d.type === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{customer.cpf || customer.cnpj || "Sem documento"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate(`/franqueado/clientes/${id}/editar`)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Button variant={isActive ? "secondary" : "success"} onClick={toggleActive}>
            {isActive ? <><ToggleLeft className="h-4 w-4" /> Inativar</> : <><ToggleRight className="h-4 w-4" /> Reativar</>}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir cliente permanentemente?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>Esta ação é irreversível. O cliente será removido permanentemente do sistema.</p>
                    {hasBindings && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm space-y-1">
                        <p className="font-medium text-destructive">Exclusão bloqueada — vínculos encontrados:</p>
                        {vehicles.length > 0 && <p>• {vehicles.length} veículo(s) cadastrado(s)</p>}
                        {files.length > 0 && <p>• {files.length} arquivo(s) enviado(s)</p>}
                        {services.length > 0 && <p>• {services.length} serviço(s) registrado(s)</p>}
                        <p className="text-muted-foreground mt-2">Prefira inativar o cliente para preservar o histórico.</p>
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={hasBindings}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {hasBindings && !isActive && (
        <div className="text-sm text-muted-foreground bg-muted/30 border border-border/30 px-4 py-2.5 rounded-xl flex items-center gap-2">
          <ToggleLeft className="h-4 w-4 shrink-0" />
          Cliente inativado. Possui {vehicles.length} veículo(s), {files.length} arquivo(s) e {services.length} serviço(s) — o histórico permanece acessível.
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <Car className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{vehicles.length}</p>
            <p className="text-xs text-muted-foreground">Veículos</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{files.length}</p>
            <p className="text-xs text-muted-foreground">Arquivos</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <Wrench className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{services.length}</p>
            <p className="text-xs text-muted-foreground">Serviços</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="veiculos">Veículos ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos ({files.length})</TabsTrigger>
          <TabsTrigger value="servicos">Serviços ({services.length})</TabsTrigger>
        </TabsList>

        {/* ── Dados ── */}
        <TabsContent value="dados" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Contato</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {customer.email && <InfoRow icon={Mail} label="E-mail" value={customer.email} />}
                {customer.phone && <InfoRow icon={Phone} label="Telefone" value={customer.phone} />}
                {d.whatsapp && <InfoRow icon={MessageCircle} label="WhatsApp" value={d.whatsapp} />}
                {!customer.email && !customer.phone && !d.whatsapp && (
                  <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {fullAddress && <InfoRow icon={MapPin} label="Logradouro" value={fullAddress} />}
                {d.address_district && <InfoRow icon={MapPin} label="Bairro" value={d.address_district} />}
                {cityState && <InfoRow icon={MapPin} label="Cidade/UF" value={cityState} />}
                {d.zip_code && <InfoRow icon={MapPin} label="CEP" value={d.zip_code} />}
                {!fullAddress && !cityState && (
                  <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {d.notes && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{d.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={Calendar} label="Cadastrado em" value={
                customer.created_at ? format(new Date(customer.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"
              } />
              {customer.updated_at && (
                <InfoRow icon={Calendar} label="Última atualização" value={
                  format(new Date(customer.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                } />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Veículos ── */}
        <TabsContent value="veiculos" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="hero" size="sm" onClick={() => navigate(`/franqueado/clientes/${id}/veiculos/novo`)}>
              <Plus className="h-4 w-4" /> Adicionar Veículo
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum veículo cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Motor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono font-medium">{v.plate || "—"}</TableCell>
                        <TableCell>{v.brand || "—"}</TableCell>
                        <TableCell>{v.model || "—"}</TableCell>
                        <TableCell>{v.year || "—"}</TableCell>
                        <TableCell>{v.engine || "—"}</TableCell>
                        <TableCell>{v.category || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/franqueado/clientes/${id}/veiculos/${v.id}/editar`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Arquivos ── */}
        <TabsContent value="arquivos" className="space-y-4">
          {files.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum arquivo enviado para este cliente</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((f) => {
                      const s = statusLabel(f.status);
                      return (
                        <TableRow
                          key={f.id}
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => navigate(`/franqueado/arquivos/${f.id}`)}
                        >
                          <TableCell className="font-mono font-medium">{f.placa}</TableCell>
                          <TableCell>{[f.marca, f.modelo].filter(Boolean).join(" ") || "—"}</TableCell>
                          <TableCell>{f.servico}</TableCell>
                          <TableCell>
                            <Badge variant={s.variant}>{s.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(f.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Serviços ── */}
        <TabsContent value="servicos" className="space-y-4">
          {services.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum serviço registrado para este cliente</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s) => {
                      const st = statusLabel(s.status || "pending");
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-sm">{s.protocol || "—"}</TableCell>
                          <TableCell>{s.service_type}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{s.description || "—"}</TableCell>
                          <TableCell>
                            {s.amount_brl != null
                              ? `R$ ${s.amount_brl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : "—"
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.created_at
                              ? format(new Date(s.created_at), "dd/MM/yyyy", { locale: ptBR })
                              : "—"
                            }
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
