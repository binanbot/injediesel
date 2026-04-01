import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Package, Loader2, Building2, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getOrderStatus } from "@/utils/orderStatus";
import { getPaymentMethodLabel, type PaymentMethod } from "@/utils/whatsappOrder";
import { type PaymentStatus, type FulfillmentStatus } from "@/utils/orderAdminStatus";
import { AdminOrderStatusPanel } from "@/components/admin/AdminOrderStatusPanel";
import { OrderTimeline } from "@/components/admin/OrderTimeline";
import { OrderTimelineFromHistory } from "@/components/admin/OrderTimelineFromHistory";

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
  previous_status: string | null;
  new_status: string;
  internal_note: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  unit_id: string | null;
  franchise_profile_id: string;
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
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Unit {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

export default function CompraDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });

  const { data: unit } = useQuery({
    queryKey: ["unit", order?.unit_id],
    queryFn: async () => {
      if (!order?.unit_id) return null;
      const { data, error } = await supabase.from("units").select("*").eq("id", order.unit_id).single();
      if (error) throw error;
      return data as Unit;
    },
    enabled: !!order?.unit_id,
  });

  const { data: profile } = useQuery({
    queryKey: ["franchise-profile", order?.franchise_profile_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_franchisees")
        .select("display_name, email, cnpj, phone")
        .eq("id", order!.franchise_profile_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!order?.franchise_profile_id,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["admin-order-items", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!id,
  });

  const { data: statusHistory } = useQuery({
    queryKey: ["admin-order-history", id],
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

  const invalidateOrder = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin-order-history", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

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
        <Button variant="ghost" onClick={() => navigate("/admin/compras")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
        <div className="glass-card p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Pedido não encontrado</h3>
        </div>
      </div>
    );
  }

  const status = getOrderStatus(order.status);
  const StatusIcon = status.icon;
  const addr = order.delivery_address as Record<string, string> | null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/compras")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
          <p className="text-muted-foreground">Realizado em {fmtDate(order.created_at)}</p>
        </div>
        <Badge className={cn("gap-1 text-sm border", status.badgeClass)}>
          <StatusIcon className="h-4 w-4" />
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Franchisee info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" /> Franqueado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {unit && (
                <div>
                  <p className="font-medium">{unit.name}</p>
                  {unit.city && (
                    <p className="text-sm text-muted-foreground">
                      {unit.city}, {unit.state}
                    </p>
                  )}
                </div>
              )}
              {profile && (
                <div className="text-sm space-y-0.5 pt-1 border-t border-border/20">
                  {profile.display_name && <p>{profile.display_name}</p>}
                  <p className="text-muted-foreground">{profile.email}</p>
                  {profile.cnpj && <p className="text-muted-foreground">CNPJ: {profile.cnpj}</p>}
                  {profile.phone && <p className="text-muted-foreground">Tel: {profile.phone}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery address */}
          {addr && (
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
                <p>
                  {addr.street}
                  {addr.number ? `, ${addr.number}` : ""}
                </p>
                {addr.complement && <p>{addr.complement}</p>}
                <p>
                  {addr.district && `${addr.district} – `}
                  {addr.city}
                  {addr.state ? ` / ${addr.state}` : ""}
                </p>
                {addr.zip_code && <p>CEP: {addr.zip_code}</p>}
                {addr.phone && <p className="text-muted-foreground">Tel: {addr.phone}</p>}
                {addr.email && <p className="text-muted-foreground">E-mail: {addr.email}</p>}
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
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

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" /> Itens do pedido
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
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x {fmt(item.unit_price)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{fmt(item.line_total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Admin Status Panel */}
          <AdminOrderStatusPanel
            orderId={order.id}
            currentPaymentStatus={(order.payment_status || "pendente") as PaymentStatus}
            currentFulfillmentStatus={(order.fulfillment_status || "pedido_realizado") as FulfillmentStatus}
            changedBy={user?.id}
            onUpdated={invalidateOrder}
          />

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
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
            </CardContent>
          </Card>

          {/* Status history */}
          {statusHistory && statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" /> Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-4 border-l-2 border-border/30 space-y-4">
                  {statusHistory.map((h) => {
                    const histMeta = getHistoryStatusLabel(h.new_status);
                    const typeLabel = histMeta.type === "payment" ? "Pagamento" : "Logística";
                    return (
                      <div key={h.id} className="relative">
                        <div
                          className={cn(
                            "absolute -left-[calc(0.5rem+1px)] top-0.5 h-4 w-4 rounded-full",
                            histMeta.color
                          )}
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium">
                            <span className="text-xs text-muted-foreground mr-1">[{typeLabel}]</span>
                            {histMeta.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(h.created_at)}
                          </p>
                          {h.internal_note && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              {h.internal_note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
