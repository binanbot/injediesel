import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Truck, CheckCircle, Loader2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getPaymentMethodLabel, type PaymentMethod } from "@/utils/whatsappOrder";
import { OrderStatusBadges } from "@/components/admin/OrderStatusBadges";
import { OrderTimeline } from "@/components/admin/OrderTimeline";
import { OrderTimelineFromHistory } from "@/components/admin/OrderTimelineFromHistory";
import type { PaymentStatus, FulfillmentStatus } from "@/utils/orderAdminStatus";

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface StatusHistory {
  id: string;
  new_status: string;
  internal_note: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  items_count: number;
  delivery_address: any;
  payment_method: string | null;
  payment_note: string | null;
  created_at: string;
}

export default function PedidoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!id,
  });

  const { data: statusHistory } = useQuery({
    queryKey: ["order-history", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as StatusHistory[];
    },
    enabled: !!id,
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: string) =>
    format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

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
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
        <div className="glass-card p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Pedido não encontrado</h3>
        </div>
      </div>
    );
  }

  const addr = order.delivery_address as Record<string, string> | null;
  const paymentStatus = (order.payment_status || "pendente") as PaymentStatus;
  const fulfillmentStatus = (order.fulfillment_status || "pedido_realizado") as FulfillmentStatus;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/franqueado/loja/pedidos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
          <p className="text-muted-foreground">Realizado em {fmtDate(order.created_at)}</p>
        </div>
        <OrderStatusBadges paymentStatus={paymentStatus} fulfillmentStatus={fulfillmentStatus} />
      </div>

      {/* Timeline visual */}
      <OrderTimeline paymentStatus={paymentStatus} fulfillmentStatus={fulfillmentStatus} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />Itens do pedido
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
                      <p className="font-medium line-clamp-1">{item.product_name}</p>
                      {item.product_sku && (
                        <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{item.quantity}x {fmt(item.unit_price)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{fmt(item.line_total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery address */}
          {addr && addr.street && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" /> Endereço de entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {addr.recipient_name && <p className="font-medium">{addr.recipient_name}</p>}
                {addr.company_name && <p>{addr.company_name}</p>}
                {addr.cnpj && <p className="text-muted-foreground">CNPJ: {addr.cnpj}</p>}
                <p>{addr.street}{addr.number ? `, ${addr.number}` : ""}</p>
                {addr.complement && <p>{addr.complement}</p>}
                <p>
                  {addr.district && `${addr.district} – `}
                  {addr.city}{addr.state ? ` / ${addr.state}` : ""}
                </p>
                {addr.zip_code && <p>CEP: {addr.zip_code}</p>}
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                💳 Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">
                  {order.payment_method ? getPaymentMethodLabel(order.payment_method as PaymentMethod) : "Não informado"}
                </span>
              </div>
              {order.payment_note && (
                <div>
                  <span className="text-muted-foreground">Observação: </span>
                  <span>{order.payment_note}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({order.items_count} {order.items_count === 1 ? "item" : "itens"})
                </span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              {order.shipping_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{fmt(order.shipping_amount)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="text-emerald-500">-{fmt(order.discount_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg text-primary">{fmt(order.total_amount)}</span>
              </div>

              {(order.fulfillment_status === "enviado" || order.fulfillment_status === "em_transito") && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                  <Truck className="h-6 w-6 text-warning mx-auto mb-1" />
                  <p className="text-sm font-medium text-warning">Pedido a caminho</p>
                </div>
              )}
              {order.fulfillment_status === "entregue" && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                  <CheckCircle className="h-6 w-6 text-success mx-auto mb-1" />
                  <p className="text-sm font-medium text-success">Pedido entregue</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {statusHistory && statusHistory.length > 0 && (
            <OrderTimelineFromHistory history={statusHistory} />
          )}
        </div>
      </div>
    </div>
  );
}
