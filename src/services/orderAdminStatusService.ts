import { supabase } from "@/integrations/supabase/client";
import type { PaymentStatus, FulfillmentStatus } from "@/utils/orderAdminStatus";
import { logAuditEvent } from "@/services/auditService";

type UpdateOrderAdminStatusesParams = {
  orderId: string;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  changedBy?: string;
  internalNote?: string;
};

export async function updateOrderAdminStatuses({
  orderId,
  paymentStatus,
  fulfillmentStatus,
  changedBy,
  internalNote,
}: UpdateOrderAdminStatusesParams) {
  const { data: currentOrder, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, payment_status, fulfillment_status")
    .eq("id", orderId)
    .single();

  if (fetchError) throw fetchError;
  if (!currentOrder) throw new Error("Pedido não encontrado");

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const historyPayloads: { order_id: string; previous_status: string | null; new_status: string; changed_by: string | null; internal_note: string | null }[] = [];

  if (paymentStatus && paymentStatus !== currentOrder.payment_status) {
    updatePayload.payment_status = paymentStatus;

    historyPayloads.push({
      order_id: orderId,
      previous_status: currentOrder.payment_status,
      new_status: `pagamento:${paymentStatus}`,
      changed_by: changedBy || null,
      internal_note: internalNote || `Status de pagamento alterado para ${paymentStatus}`,
    });
  }

  if (fulfillmentStatus && fulfillmentStatus !== currentOrder.fulfillment_status) {
    updatePayload.fulfillment_status = fulfillmentStatus;
    updatePayload.status = fulfillmentStatus;

    historyPayloads.push({
      order_id: orderId,
      previous_status: currentOrder.fulfillment_status,
      new_status: fulfillmentStatus,
      changed_by: changedBy || null,
      internal_note: internalNote || null,
    });
  }

  if (Object.keys(updatePayload).length === 1) {
    return { success: true, updated: false };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (updateError) throw updateError;

  if (historyPayloads.length > 0) {
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert(historyPayloads);

    if (historyError) console.warn("History insert error:", historyError.message);

    // Audit each status change
    for (const h of historyPayloads) {
      logAuditEvent({
        action: h.new_status.startsWith("pagamento:") ? "order.payment_status_changed" : "order.status_changed",
        module: "pedidos",
        targetType: "order",
        targetId: orderId,
        details: { previous_status: h.previous_status, new_status: h.new_status },
      });
    }
  }

  return { success: true, updated: true };
}
