import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  paymentStatusMeta,
  fulfillmentStatusMeta,
  type PaymentStatus,
  type FulfillmentStatus,
} from "@/utils/orderAdminStatus";

type Props = {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
};

export function OrderStatusBadges({ paymentStatus, fulfillmentStatus }: Props) {
  const paymentMeta = paymentStatusMeta[paymentStatus] ?? paymentStatusMeta.pendente;
  const fulfillmentMeta = fulfillmentStatusMeta[fulfillmentStatus] ?? fulfillmentStatusMeta.pedido_realizado;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className={cn("text-xs text-white border-0", paymentMeta.color)}>
        {paymentMeta.label}
      </Badge>
      <Badge variant="outline" className={cn("text-xs text-white border-0", fulfillmentMeta.color)}>
        {fulfillmentMeta.label}
      </Badge>
    </div>
  );
}
