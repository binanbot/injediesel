import { supabase } from "@/integrations/supabase/client";
import type { OrderStatus } from "@/utils/orderStatus";
import { logAuditEvent } from "@/services/auditService";

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  changedBy?: string,
  internalNote?: string
) {
  const { data: currentOrder, error: fetchError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: newStatus,
      fulfillment_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) throw updateError;

  const { error: historyError } = await supabase
    .from("order_status_history")
    .insert({
      order_id: orderId,
      previous_status: currentOrder.status,
      new_status: newStatus,
      changed_by: changedBy || null,
      internal_note: internalNote || null,
    });

  if (historyError) throw historyError;

  logAuditEvent({
    action: "order.status_changed",
    module: "pedidos",
    targetType: "order",
    targetId: orderId,
    details: { previous_status: currentOrder.status, new_status: newStatus },
  });
}
