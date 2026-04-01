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
import type { PaymentStatus, FulfillmentStatus } from "@/utils/orderAdminStatus";

type StepState = "completed" | "current" | "waiting" | "interrupted";

interface TimelineStep {
  key: string;
  label: string;
  icon: LucideIcon;
  state: StepState;
  type: "payment" | "fulfillment";
}

const paymentSteps: { key: PaymentStatus; label: string; icon: LucideIcon }[] = [
  { key: "pendente", label: "Pendente", icon: Clock },
  { key: "aguardando_comprovante", label: "Aguardando Comprovante", icon: FileCheck },
  { key: "aprovado", label: "Aprovado", icon: CheckCircle2 },
];

const paymentInterrupted: Record<string, { label: string; icon: LucideIcon }> = {
  recusado: { label: "Recusado", icon: XCircle },
  estornado: { label: "Estornado", icon: RotateCcw },
};

const fulfillmentSteps: { key: FulfillmentStatus; label: string; icon: LucideIcon }[] = [
  { key: "pedido_realizado", label: "Pedido Realizado", icon: Package },
  { key: "em_separacao", label: "Em Separação", icon: PackageSearch },
  { key: "em_preparacao", label: "Em Preparação", icon: Wrench },
  { key: "enviado", label: "Enviado", icon: Truck },
  { key: "em_transito", label: "Em Trânsito", icon: Route },
  { key: "entregue", label: "Entregue", icon: PackageCheck },
];

const fulfillmentInterrupted: Record<string, { label: string; icon: LucideIcon }> = {
  cancelado: { label: "Cancelado", icon: Ban },
};

function resolveSteps(
  steps: { key: string; label: string; icon: LucideIcon }[],
  interrupted: Record<string, { label: string; icon: LucideIcon }>,
  currentStatus: string,
  type: "payment" | "fulfillment"
): TimelineStep[] {
  if (interrupted[currentStatus]) {
    const meta = interrupted[currentStatus];
    const result: TimelineStep[] = steps.map((s) => ({
      ...s,
      state: "completed" as StepState,
      type,
    }));
    result.push({ key: currentStatus, label: meta.label, icon: meta.icon, state: "interrupted", type });
    return result;
  }

  const idx = steps.findIndex((s) => s.key === currentStatus);
  return steps.map((s, i) => ({
    ...s,
    type,
    state: i < idx ? "completed" : i === idx ? "current" : "waiting",
  }));
}

const stateStyles: Record<StepState, { dot: string; line: string; text: string }> = {
  completed: {
    dot: "bg-emerald-500 text-white",
    line: "bg-emerald-500",
    text: "text-emerald-400",
  },
  current: {
    dot: "bg-primary text-primary-foreground ring-4 ring-primary/30",
    line: "bg-muted/40",
    text: "text-foreground font-semibold",
  },
  waiting: {
    dot: "bg-muted/40 text-muted-foreground",
    line: "bg-muted/40",
    text: "text-muted-foreground",
  },
  interrupted: {
    dot: "bg-destructive text-white",
    line: "bg-destructive/40",
    text: "text-destructive font-semibold",
  },
};

function TimelineRow({ steps, title }: { steps: TimelineStep[]; title: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
      <div className="flex items-start gap-0">
        {steps.map((step, i) => {
          const styles = stateStyles[step.state];
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all", styles.dot)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={cn("text-[10px] text-center leading-tight max-w-[72px]", styles.text)}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-0.5 flex-1 mt-[18px] rounded-full", styles.line)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
};

export function OrderTimeline({ paymentStatus, fulfillmentStatus }: Props) {
  const pSteps = resolveSteps(paymentSteps, paymentInterrupted, paymentStatus, "payment");
  const fSteps = resolveSteps(fulfillmentSteps, fulfillmentInterrupted, fulfillmentStatus, "fulfillment");

  return (
    <div className="glass-card grain rounded-xl p-5 space-y-6">
      <TimelineRow steps={pSteps} title="💳 Pagamento" />
      <TimelineRow steps={fSteps} title="📦 Logística" />
    </div>
  );
}
