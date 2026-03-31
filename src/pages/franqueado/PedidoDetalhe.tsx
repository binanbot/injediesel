import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  QrCode,
  CreditCard,
  FileText,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_id: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  items_count: number;
  delivery_address: any;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pedido_realizado: { label: "Pedido Realizado", icon: Package, className: "status-pending" },
  em_separacao: { label: "Em Separação", icon: Clock, className: "status-processing" },
  enviado: { label: "Enviado", icon: Truck, className: "status-processing" },
  entregue: { label: "Entregue", icon: CheckCircle, className: "status-completed" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "status-cancelled" },
};

export default function PedidoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);
      
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!id,
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

  if (orderLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/franqueado/loja/pedidos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="glass-card p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Pedido não encontrado</h3>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pedido_realizado;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/franqueado/loja/pedidos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
          <p className="text-muted-foreground">
            Realizado em {formatDate(order.created_at)}
          </p>
        </div>
        <Badge className={cn("gap-1", status.className)}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items?.map((item) => (
                  <div key={item.id} className="flex gap-4 py-3 border-b border-border/30 last:border-0">
                    <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x {formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method */}
              {order.payment_method && PaymentIcon && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Forma de pagamento</p>
                  <p className="font-medium flex items-center gap-2">
                    <PaymentIcon className="h-4 w-4" />
                    {paymentLabels[order.payment_method] || order.payment_method}
                  </p>
                  {order.installments && order.installments > 1 && (
                    <p className="text-sm text-muted-foreground">
                      {order.installments}x de {formatPrice(order.total / order.installments)}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {/* Items Count */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Itens ({items?.length || 0})
                </span>
                <span>{formatPrice(order.total)}</span>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg text-primary">{formatPrice(order.total)}</span>
              </div>

              {/* Actions based on status */}
              {order.status === "pending" && (
                <div className="space-y-2 pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Aguardando pagamento
                  </p>
                  <Button className="w-full">
                    Ver instruções de pagamento
                  </Button>
                </div>
              )}

              {order.status === "paid" && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                  <CheckCircle className="h-6 w-6 text-success mx-auto mb-1" />
                  <p className="text-sm font-medium text-success">Pagamento confirmado</p>
                </div>
              )}

              {order.status === "shipped" && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                  <Truck className="h-6 w-6 text-warning mx-auto mb-1" />
                  <p className="text-sm font-medium text-warning">Pedido enviado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
