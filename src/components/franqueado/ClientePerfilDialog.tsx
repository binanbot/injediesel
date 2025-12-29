import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Download,
  FileText,
  Car,
} from "lucide-react";
import { Cliente, servicosClientesMock, ServicoCliente } from "@/data/clientes-mock";

interface ClientePerfilDialogProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadge(status: ServicoCliente["status"]) {
  const variants: Record<ServicoCliente["status"], { class: string; label: string }> = {
    pendente: { class: "status-pending", label: "Pendente" },
    processando: { class: "status-processing", label: "Processando" },
    concluido: { class: "status-completed", label: "Concluído" },
    cancelado: { class: "status-cancelled", label: "Cancelado" },
  };
  const variant = variants[status];
  return <span className={`status-badge ${variant.class}`}>{variant.label}</span>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function ClientePerfilDialog({ cliente, open, onOpenChange }: ClientePerfilDialogProps) {
  const servicos = useMemo(() => {
    if (!cliente) return [];
    return servicosClientesMock
      .filter((s) => s.clienteId === cliente.id)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [cliente]);

  const totalFaturamento = useMemo(() => {
    return servicos.reduce((acc, s) => acc + s.valor, 0);
  }, [servicos]);

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span>{cliente.nome}</span>
              <p className="text-sm font-normal text-muted-foreground">
                Detalhes do cliente e histórico de serviços
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {/* Dados do Cliente */}
          <div className="glass-subtle rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Cliente
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.telefone}</span>
              </div>
              {cliente.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{cliente.email}</span>
                </div>
              )}
              {cliente.cidade && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{cliente.cidade}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.unidadeNome}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Cliente desde {formatDate(cliente.dataCadastro)}</span>
              </div>
            </div>

            {/* Resumo */}
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">{servicos.length}</p>
                <p className="text-xs text-muted-foreground">Serviços realizados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-success/10">
                <p className="text-2xl font-bold text-success">{formatCurrency(totalFaturamento)}</p>
                <p className="text-xs text-muted-foreground">Faturamento total</p>
              </div>
            </div>
          </div>

          {/* Histórico de Serviços */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Histórico de Serviços
            </h3>

            {servicos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum serviço registrado</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30">
                      <TableHead>Data</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicos.map((servico) => (
                      <TableRow key={servico.id}>
                        <TableCell className="text-sm">
                          {formatDate(servico.data)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{servico.marca} {servico.modelo}</p>
                            <p className="text-xs text-muted-foreground">
                              {servico.placa || servico.categoriaVeiculo}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{servico.servico}</p>
                            <p className="text-xs text-muted-foreground">{servico.categoriaServico}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(servico.valor)}
                        </TableCell>
                        <TableCell>{getStatusBadge(servico.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {servico.arquivoOriginal && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Download Original">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {servico.arquivoModificado && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Download Modificado">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver Relatório">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
