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

export const ORDER_STATUSES = [
  "pedido_realizado",
  "pagamento_pendente",
  "pagamento_aprovado",
  "em_separacao",
  "em_preparacao",
  "enviado",
  "em_transito",
  "entregue",
  "cancelado",
  "reembolsado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderStatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;        // tailwind text color token
  bgColor: string;      // tailwind bg color token
  badgeClass: string;    // combined badge styling
  order: number;         // visual/sort order
}

export const orderStatusMap: Record<OrderStatus, OrderStatusConfig> = {
  pedido_realizado: {
    label: "Pedido Realizado",
    icon: Package,
    color: "text-sky-400",
    bgColor: "bg-sky-500/15",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    order: 0,
  },
  pagamento_pendente: {
    label: "Pagamento Pendente",
    icon: CreditCard,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    order: 1,
  },
  pagamento_aprovado: {
    label: "Pagamento Aprovado",
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    order: 2,
  },
  em_separacao: {
    label: "Em Separação",
    icon: BoxIcon,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15",
    badgeClass: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    order: 3,
  },
  em_preparacao: {
    label: "Em Preparação",
    icon: Clock,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    order: 4,
  },
  enviado: {
    label: "Enviado",
    icon: Truck,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    order: 5,
  },
  em_transito: {
    label: "Em Trânsito",
    icon: Truck,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    order: 6,
  },
  entregue: {
    label: "Entregue",
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    order: 7,
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/15",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
    order: 8,
  },
  reembolsado: {
    label: "Reembolsado",
    icon: RotateCcw,
    color: "text-slate-400",
    bgColor: "bg-slate-500/15",
    badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    order: 9,
  },
};

/** Safe getter – returns pedido_realizado config as fallback */
export function getOrderStatus(status: string): OrderStatusConfig {
  return orderStatusMap[status as OrderStatus] ?? orderStatusMap.pedido_realizado;
}

/** Ordered list for Select / filter dropdowns */
export const orderStatusList = ORDER_STATUSES.map((key) => ({
  value: key,
  ...orderStatusMap[key],
}));
