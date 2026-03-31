import {
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  BoxIcon,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

export const ORDER_STATUS = {
  PEDIDO_REALIZADO: 'pedido_realizado',
  PAGAMENTO_PENDENTE: 'pagamento_pendente',
  PAGAMENTO_APROVADO: 'pagamento_aprovado',
  EM_SEPARACAO: 'em_separacao',
  EM_PREPARACAO: 'em_preparacao',
  ENVIADO: 'enviado',
  EM_TRANSITO: 'em_transito',
  ENTREGUE: 'entregue',
  CANCELADO: 'cancelado',
  REEMBOLSADO: 'reembolsado',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export interface OrderStatusMeta {
  label: string;
  color: string;
  step: number;
  icon: LucideIcon;
  badgeClass: string;
}

export const orderStatusMeta: Record<OrderStatus, OrderStatusMeta> = {
  pedido_realizado: {
    label: "Pedido Realizado",
    color: "bg-blue-600",
    step: 1,
    icon: Package,
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  pagamento_pendente: {
    label: "Pagamento Pendente",
    color: "bg-yellow-600",
    step: 2,
    icon: CreditCard,
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  pagamento_aprovado: {
    label: "Pagamento Aprovado",
    color: "bg-emerald-600",
    step: 3,
    icon: CheckCircle,
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  em_separacao: {
    label: "Em Separação",
    color: "bg-orange-600",
    step: 4,
    icon: BoxIcon,
    badgeClass: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  },
  em_preparacao: {
    label: "Em Preparação",
    color: "bg-orange-500",
    step: 5,
    icon: Clock,
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  enviado: {
    label: "Enviado",
    color: "bg-sky-600",
    step: 6,
    icon: Truck,
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  em_transito: {
    label: "Em Trânsito",
    color: "bg-cyan-600",
    step: 7,
    icon: Truck,
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  },
  entregue: {
    label: "Entregue",
    color: "bg-green-700",
    step: 8,
    icon: CheckCircle,
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-700",
    step: 9,
    icon: XCircle,
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  reembolsado: {
    label: "Reembolsado",
    color: "bg-zinc-600",
    step: 10,
    icon: RotateCcw,
    badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  },
};

/** Safe getter – returns pedido_realizado config as fallback */
export function getOrderStatus(status: string): OrderStatusMeta {
  return orderStatusMeta[status as OrderStatus] ?? orderStatusMeta.pedido_realizado;
}

/** Ordered list for Select / filter dropdowns */
export const orderStatusList = (Object.keys(orderStatusMeta) as OrderStatus[])
  .sort((a, b) => orderStatusMeta[a].step - orderStatusMeta[b].step)
  .map((key) => ({ value: key, ...orderStatusMeta[key] }));
