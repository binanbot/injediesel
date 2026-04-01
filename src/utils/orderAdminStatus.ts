export const PAYMENT_STATUSES = {
  PENDENTE: "pendente",
  APROVADO: "aprovado",
  RECUSADO: "recusado",
  ESTORNADO: "estornado",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const paymentStatusMeta: Record<PaymentStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-600" },
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
  REEMBOLSADO: "reembolsado",
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
  reembolsado: { label: "Reembolsado", color: "bg-zinc-600" },
};
