import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  ChevronRight,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  items_count: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pendente", icon: Clock, className: "status-pending" },
  paid: { label: "Pago", icon: CheckCircle, className: "status-completed" },
  canceled: { label: "Cancelado", icon: XCircle, className: "status-cancelled" },
  shipped: { label: "Enviado", icon: Truck, className: "status-processing" },
};

const paymentMethodLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
};

export default function MeusPedidos() {
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe seus pedidos realizados
          </p>
        </div>
        <Button onClick={() => navigate("/franqueado/loja")}>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Ir para a loja
        </Button>
      </div>

      {/* Orders List */}
      {!orders || orders.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Nenhum pedido encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Você ainda não realizou nenhum pedido
          </p>
          <Button onClick={() => navigate("/franqueado/loja")}>
            Fazer primeiro pedido
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={order.id}
                className="glass-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/franqueado/loja/pedidos/${order.id}`)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      {order.payment_method && (
                        <p className="text-sm text-muted-foreground">
                          {paymentMethodLabels[order.payment_method] || order.payment_method}
                          {order.installments && order.installments > 1 && ` (${order.installments}x)`}
                        </p>
                      )}
                    </div>

                    <Badge className={cn("gap-1", status.className)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>

                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
