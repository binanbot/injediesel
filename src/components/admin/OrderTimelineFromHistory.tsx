import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CreditCard,
  Clock,
  FileCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Package,
  PackageSearch,
  Wrench,
  Truck,
  Route,
  PackageCheck,
  Ban,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getHistoryStatusLabel } from "@/utils/orderAdminStatus";

interface HistoryEntry {
  id: string;
  new_status: string;
  internal_note: string | null;
  created_at: string;
}

const iconMap: Record<string, LucideIcon> = {
  pendente: Clock,
  aguardando_comprovante: FileCheck,
  aprovado: CheckCircle2,
  recusado: XCircle,
  estornado: RotateCcw,
  pedido_realizado: Package,
  em_separacao: PackageSearch,
  em_preparacao: Wrench,
  enviado: Truck,
  em_transito: Route,
  entregue: PackageCheck,
  cancelado: Ban,
};

function getStatusKey(newStatus: string): string {
  return newStatus.startsWith("pagamento:") ? newStatus.replace("pagamento:", "") : newStatus;
}

const typeColors = {
  payment: "border-amber-500/60 bg-amber-500/10",
  fulfillment: "border-primary/60 bg-primary/10",
};

const dotColors = {
  payment: "bg-amber-500",
  fulfillment: "bg-primary",
};

type Props = {
  history: HistoryEntry[];
};

export function OrderTimelineFromHistory({ history }: Props) {
  if (!history.length) return null;

  return (
    <div className="glass-card grain rounded-xl p-5 space-y-2">
      <p className="text-sm font-semibold text-foreground mb-3">Histórico detalhado</p>
      <div className="relative pl-5 border-l-2 border-border/30 space-y-5">
        {history.map((h) => {
          const meta = getHistoryStatusLabel(h.new_status);
          const key = getStatusKey(h.new_status);
          const Icon = iconMap[key] ?? Clock;
          const typeLabel = meta.type === "payment" ? "Pagamento" : "Logística";

          return (
            <div key={h.id} className="relative">
              {/* dot */}
              <div
                className={cn(
                  "absolute -left-[calc(0.625rem+1px)] top-0.5 h-5 w-5 rounded-full flex items-center justify-center",
                  dotColors[meta.type]
                )}
              >
                <Icon className="h-3 w-3 text-white" />
              </div>

              <div className="ml-3 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                      typeColors[meta.type]
                    )}
                  >
                    {typeLabel}
                  </span>
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {h.internal_note && (
                  <p className="text-xs text-muted-foreground italic mt-0.5">
                    {h.internal_note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
