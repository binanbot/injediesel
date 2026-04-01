import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, ToggleLeft, ToggleRight, Phone, Mail, MapPin, Car, FileText, Loader2, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  plate: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
}

export default function ClienteDetalhe() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [filesCount, setFilesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [customerRes, vehiclesRes, servicesRes, filesRes] = await Promise.all([
        supabase.from("customers").select("*").eq("id", id!).single(),
        supabase.from("vehicles").select("*").eq("customer_id", id!),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("customer_id", id!),
        supabase.from("received_files").select("id", { count: "exact", head: true }).eq("customer_id", id!),
      ]);

      if (customerRes.error) throw customerRes.error;
      setCustomer(customerRes.data);
      setVehicles(vehiclesRes.data || []);
      setServicesCount(servicesRes.count || 0);
      setFilesCount(filesRes.count || 0);
    } catch {
      toast.error("Erro ao carregar cliente");
      navigate("/franqueado/clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const hasBindings = vehicles.length > 0 || servicesCount > 0 || filesCount > 0;

  const toggleActive = async () => {
    const newStatus = !customer.is_active;
    const { error } = await supabase.from("customers").update({ is_active: newStatus }).eq("id", id!);
    if (error) { toast.error("Erro ao alterar status"); return; }
    setCustomer({ ...customer, is_active: newStatus });
    toast.success(newStatus ? "Cliente reativado" : "Cliente inativado");
  };

  const handleDelete = async () => {
    if (hasBindings) { toast.error("Cliente possui vínculos e não pode ser excluído"); return; }
    const { error } = await supabase.from("customers").delete().eq("id", id!);
    if (error) { toast.error("Erro ao excluir cliente"); return; }
    toast.success("Cliente excluído");
    navigate("/franqueado/clientes");
  };

  if (isLoading || !customer) {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/franqueado/clientes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{customer.full_name}</h1>
              <Badge variant={customer.is_active ? "default" : "secondary"}>
                {customer.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{customer.cpf || customer.cnpj || "Sem documento"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/franqueado/clientes/${id}/editar`)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Button variant={customer.is_active ? "secondary" : "success"} onClick={toggleActive}>
            {customer.is_active ? <><ToggleLeft className="h-4 w-4" /> Inativar</> : <><ToggleRight className="h-4 w-4" /> Reativar</>}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={hasBindings}>
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. O cliente será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {hasBindings && (
        <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
          Este cliente possui {vehicles.length} veículo(s), {servicesCount} serviço(s) e {filesCount} arquivo(s). Para excluí-lo, remova os vínculos primeiro.
        </div>
      )}

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Contato</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {customer.email && <InfoRow icon={Mail} label="E-mail" value={customer.email} />}
            {customer.phone && <InfoRow icon={Phone} label="Telefone" value={customer.phone} />}
            {customer.whatsapp && <InfoRow icon={MessageCircle} label="WhatsApp" value={customer.whatsapp} />}
            {!customer.email && !customer.phone && !customer.whatsapp && (
              <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {customer.address_line && <InfoRow icon={MapPin} label="Endereço" value={customer.address_line} />}
            {(customer.address_city || customer.address_state) && (
              <InfoRow icon={MapPin} label="Cidade/UF" value={`${customer.address_city || "—"}/${customer.address_state || "—"}`} />
            )}
            {customer.zip_code && <InfoRow icon={MapPin} label="CEP" value={customer.zip_code} />}
            {!customer.address_line && !customer.address_city && (
              <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {customer.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Car className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{vehicles.length}</p>
            <p className="text-xs text-muted-foreground">Veículos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{filesCount}</p>
            <p className="text-xs text-muted-foreground">Arquivos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{servicesCount}</p>
            <p className="text-xs text-muted-foreground">Serviços</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles */}
      {vehicles.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Veículos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-medium">{v.plate || "—"}</TableCell>
                    <TableCell>{v.brand || "—"}</TableCell>
                    <TableCell>{v.model || "—"}</TableCell>
                    <TableCell>{v.year || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
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
