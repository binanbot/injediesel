import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  User,
  Car,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Gauge,
  Settings,
  Tag,
  AlertTriangle,
} from "lucide-react";

export interface ArquivoDetalhado {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano?: string;
  cambio?: string;
  combustivel?: string;
  horasKm?: string;
  servico: string;
  status: string;
  data: string;
  categoria?: string;
  valor?: string;
  cliente?: {
    nome: string;
    telefone: string;
    email: string;
    cidade?: string;
    servicosAnteriores?: number;
  };
  observacoes?: string;
}

interface ArquivoDetalheDialogProps {
  arquivo: ArquivoDetalhado | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-success/20 text-success border-success/30">Concluído</Badge>;
    case "processing":
      return <Badge className="bg-warning/20 text-warning border-warning/30">Processando</Badge>;
    case "cancelled":
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Cancelado</Badge>;
    default:
      return <Badge className="bg-muted/20 text-muted-foreground border-muted/30">Pendente</Badge>;
  }
};

export function ArquivoDetalheDialog({ arquivo, open, onOpenChange }: ArquivoDetalheDialogProps) {
  const navigate = useNavigate();

  if (!arquivo) return null;

  const handleSolicitarCorrecao = () => {
    // Fecha o dialog e navega para a página de detalhes do arquivo
    onOpenChange(false);
    navigate(`/franqueado/arquivos/${arquivo.id}`);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col glass-card border-border/30 p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes do Arquivo
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-5 py-4">
            {/* Status e Data */}
            <div className="flex items-center justify-between">
              {getStatusBadge(arquivo.status)}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {arquivo.data}
              </span>
            </div>

            {/* Informações do Veículo */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Veículo
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Placa</p>
                  <p className="font-medium text-foreground">{arquivo.placa}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Marca/Modelo</p>
                  <p className="font-medium text-foreground">{arquivo.marca} {arquivo.modelo}</p>
                </div>
                {arquivo.ano && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Ano</p>
                    <p className="font-medium text-foreground">{arquivo.ano}</p>
                  </div>
                )}
                {arquivo.cambio && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Câmbio</p>
                    <p className="font-medium text-foreground">{arquivo.cambio}</p>
                  </div>
                )}
                {arquivo.combustivel && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Combustível</p>
                    <p className="font-medium text-foreground">{arquivo.combustivel}</p>
                  </div>
                )}
                {arquivo.horasKm && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Gauge className="h-3 w-3" /> Horas/Km
                    </p>
                    <p className="font-medium text-foreground">{arquivo.horasKm}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Serviço */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Serviço
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Descrição</p>
                  <p className="font-medium text-foreground">{arquivo.servico}</p>
                </div>
                {arquivo.categoria && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Categoria
                    </p>
                    <p className="font-medium text-foreground">{arquivo.categoria}</p>
                  </div>
                )}
                {arquivo.valor && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium text-primary">{arquivo.valor}</p>
                  </div>
                )}
              </div>
              {arquivo.observacoes && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Observações</p>
                  <p className="text-sm text-foreground bg-secondary/30 p-2 rounded-lg">{arquivo.observacoes}</p>
                </div>
              )}
            </div>

            {/* Cliente */}
            {arquivo.cliente && (
              <>
                <Separator className="bg-border/30" />
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Nome</p>
                      <p className="font-medium text-foreground">{arquivo.cliente.nome}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Telefone
                      </p>
                      <p className="font-medium text-foreground">{arquivo.cliente.telefone}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </p>
                      <p className="font-medium text-foreground">{arquivo.cliente.email}</p>
                    </div>
                    {arquivo.cliente.cidade && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Cidade
                        </p>
                        <p className="font-medium text-foreground">{arquivo.cliente.cidade}</p>
                      </div>
                    )}
                    {arquivo.cliente.servicosAnteriores !== undefined && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Serviços Anteriores</p>
                        <p className="font-medium text-foreground">{arquivo.cliente.servicosAnteriores}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border/30 flex-shrink-0">
          <div className="flex gap-3 w-full justify-end">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
            <Button variant="default" className="gap-2" asChild>
              <a href="#">
                <Download className="h-4 w-4" />
                Download
              </a>
            </Button>
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={handleSolicitarCorrecao}
            >
              <AlertTriangle className="h-4 w-4" />
              Solicitar Correção
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
