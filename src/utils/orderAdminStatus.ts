export const PAYMENT_STATUSES = {
  PENDENTE: "pendente",
  AGUARDANDO_COMPROVANTE: "aguardando_comprovante",
  APROVADO: "aprovado",
  RECUSADO: "recusado",
  ESTORNADO: "estornado",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const paymentStatusMeta: Record<PaymentStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-600" },
  aguardando_comprovante: { label: "Aguardando Comprovante", color: "bg-amber-500" },
  aprovado: { label: "Aprovado", color: "bg-green-600" },
  recusado: { label: "Recusado", color: "bg-red-600" },
  estornado: { label: "Estornado", color: "bg-zinc-600" },
};

export const FULFILLMENT_STATUSES = {
  PEDIDO_REALIZADO: "pedido_realizado",
  EM_SEPARACAO: "em_separacao",
  EM_PREPARACAO: "em_preparacao",
  ENVIADO: "enviado",
  EM_TRANSITO: "em_transito",
  ENTREGUE: "entregue",
  CANCELADO: "cancelado",
} as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[keyof typeof FULFILLMENT_STATUSES];

export const fulfillmentStatusMeta: Record<FulfillmentStatus, { label: string; color: string }> = {
  pedido_realizado: { label: "Pedido Realizado", color: "bg-blue-600" },
  em_separacao: { label: "Em Separação", color: "bg-orange-600" },
  em_preparacao: { label: "Em Preparação", color: "bg-orange-500" },
  enviado: { label: "Enviado", color: "bg-sky-600" },
  em_transito: { label: "Em Trânsito", color: "bg-cyan-600" },
  entregue: { label: "Entregue", color: "bg-green-700" },
  cancelado: { label: "Cancelado", color: "bg-red-700" },
};

/** Check if a new_status string from history is a payment status change */
export function isPaymentHistoryEntry(newStatus: string): boolean {
  return newStatus.startsWith("pagamento:");
}

/** Extract label for a history entry, handling both payment and fulfillment */
export function getHistoryStatusLabel(newStatus: string): { label: string; type: "payment" | "fulfillment"; color: string } {
  if (newStatus.startsWith("pagamento:")) {
    const key = newStatus.replace("pagamento:", "") as PaymentStatus;
    const meta = paymentStatusMeta[key];
    return { label: meta?.label ?? key, type: "payment", color: meta?.color ?? "bg-muted" };
  }
  const meta = fulfillmentStatusMeta[newStatus as FulfillmentStatus];
  return { label: meta?.label ?? newStatus, type: "fulfillment", color: meta?.color ?? "bg-muted" };
}
