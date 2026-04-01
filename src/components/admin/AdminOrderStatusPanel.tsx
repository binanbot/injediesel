import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  paymentStatusMeta,
  fulfillmentStatusMeta,
  type PaymentStatus,
  type FulfillmentStatus,
} from "@/utils/orderAdminStatus";
import { updateOrderAdminStatuses } from "@/services/orderAdminStatusService";
import { OrderStatusBadges } from "./OrderStatusBadges";

type Props = {
  orderId: string;
  currentPaymentStatus: PaymentStatus;
  currentFulfillmentStatus: FulfillmentStatus;
  changedBy?: string;
  onUpdated?: () => Promise<void> | void;
};

export function AdminOrderStatusPanel({
  orderId,
  currentPaymentStatus,
  currentFulfillmentStatus,
  changedBy,
  onUpdated,
}: Props) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(currentPaymentStatus);
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>(currentFulfillmentStatus);
  const [internalNote, setInternalNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await updateOrderAdminStatuses({
        orderId,
        paymentStatus,
        fulfillmentStatus,
        changedBy,
        internalNote,
      });

      if (result.updated) {
        toast.success("Status do pedido atualizado com sucesso.");
        setInternalNote("");
        await onUpdated?.();
      } else {
        toast.info("Nenhuma alteração foi feita.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status do pedido.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Controle administrativo do pedido</CardTitle>
        <CardDescription>Atualize pagamento e logística de forma independente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <OrderStatusBadges paymentStatus={paymentStatus} fulfillmentStatus={fulfillmentStatus} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status do pagamento</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(paymentStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status da logística</Label>
            <Select value={fulfillmentStatus} onValueChange={(v) => setFulfillmentStatus(v as FulfillmentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(fulfillmentStatusMeta).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Observação interna</Label>
          <Textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Ex: comprovante recebido no WhatsApp e separado para envio"
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
