import { useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LGPDExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  exportType: string;
  isLoading?: boolean;
}

export function LGPDExportModal({
  open,
  onOpenChange,
  onConfirm,
  exportType,
  isLoading,
}: LGPDExportModalProps) {
  const [accepted, setAccepted] = useState(false);

  const handleConfirm = () => {
    if (accepted) {
      onConfirm();
      setAccepted(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAccepted(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Responsabilidade de Proteção de Dados (LGPD)</DialogTitle>
          </div>
          <DialogDescription>
            Antes de exportar, você deve aceitar o termo de responsabilidade.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Atenção: Dados Pessoais Sensíveis
                  </p>
                  <p className="text-amber-700 dark:text-amber-400">
                    Esta exportação pode conter dados pessoais protegidos pela Lei Geral de 
                    Proteção de Dados (LGPD - Lei nº 13.709/2018).
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Declaro que a exportação e o uso dos dados do cliente serão realizados 
                sob minha total responsabilidade, garantindo:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Proteção adequada dos dados exportados</li>
                <li>Armazenamento seguro conforme políticas de segurança</li>
                <li>Compartilhamento apenas com pessoas autorizadas</li>
                <li>Cumprimento integral da LGPD</li>
              </ul>
              <p>
                Assumo total responsabilidade por qualquer exposição indevida ou uso 
                inadequado dos dados exportados.
              </p>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Tipo de exportação: <span className="font-medium">{exportType}</span>
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
          <Checkbox
            id="lgpd-accept"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <Label
            htmlFor="lgpd-accept"
            className="text-sm font-medium leading-relaxed cursor-pointer"
          >
            Li e aceito o termo de responsabilidade. Estou ciente das minhas obrigações 
            quanto à proteção dos dados pessoais contidos nesta exportação.
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!accepted || isLoading}>
            {isLoading ? "Exportando..." : "Confirmar e Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
