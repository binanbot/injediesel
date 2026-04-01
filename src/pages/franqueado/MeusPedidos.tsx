import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Loader2,
  ShoppingBag,
  Search,
  Filter,
  Package,
  MapPin,
  Clock,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getOrderStatus, orderStatusList } from "@/utils/orderStatus";

/* ── Types ── */
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
  status: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  items_count: number;
  delivery_address: any;
  created_at: string;
  order_items: OrderItem[];
  order_status_history: StatusHistory[];
}

/* ── Helpers ── */
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function MeusPedidos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  /* ── Profile ID ── */
  const { data: profileId } = useQuery({
    queryKey: ["my-profile-id", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_franchisees")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data.id;
    },
    enabled: !!user?.id,
  });

  /* ── Orders ── */
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*),
          order_status_history (*)
        `)
        .eq("franchise_profile_id", profileId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!profileId,
  });

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (
        debouncedSearch &&
        !o.order_number.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [orders, statusFilter, debouncedSearch]);

  /* ── Filter handlers ── */
  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    const p = new URLSearchParams(searchParams);
    if (v === "all") p.delete("status");
    else p.set("status", v);
    setSearchParams(p, { replace: true });
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSearchParams({}, { replace: true });
  };

  const hasFilters = search || statusFilter !== "all";

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Compras</h1>
          <p className="text-muted-foreground">
            {orders?.length ?? 0} pedido{orders?.length !== 1 ? "s" : ""} realizado
            {orders?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => navigate("/franqueado/loja")}>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Ir para a loja
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número do pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {orderStatusList.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
            <X className="h-4 w-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">
            {hasFilters ? "Nenhum pedido encontrado" : "Nenhum pedido realizado"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasFilters
              ? "Tente alterar os filtros de busca"
              : "Você ainda não realizou nenhum pedido"}
          </p>
          {!hasFilters && (
            <Button onClick={() => navigate("/franqueado/loja")}>
              Fazer primeiro pedido
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const status = getOrderStatus(order.status);
            const StatusIcon = status.icon;

            return (
              <div
                key={order.id}
                className="glass-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center">
                      <StatusIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Pedido #{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {fmtDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold">{fmt(order.total_amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items_count}{" "}
                        {order.items_count === 1 ? "item" : "itens"}
                      </p>
                    </div>

                    <Badge className={cn("gap-1 border", status.badgeClass)}>
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

      {/* Detail Sheet */}
      <OrderDetailSheet
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Order Detail Sheet (Drawer)
   ═══════════════════════════════════════════════ */

function OrderDetailSheet({
  order,
  open,
  onClose,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!order) return null;

  const status = getOrderStatus(order.status);
  const StatusIcon = status.icon;
  const addr = order.delivery_address as Record<string, string> | null;

  const sortedHistory = [...(order.order_status_history || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            Pedido #{order.order_number}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Badge className={cn("gap-1 border", status.badgeClass)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
            <span className="text-muted-foreground">{fmtDate(order.created_at)}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-8">
          {/* Itens */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" /> Itens do pedido
            </h3>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start gap-3 py-2 border-b border-border/20 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.product_name}</p>
                    {item.product_sku && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.product_sku}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity}x {fmt(item.unit_price)}
                    </p>
                  </div>
                  <span className="font-semibold text-sm shrink-0">
                    {fmt(item.line_total)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-3" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              {order.shipping_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{fmt(order.shipping_amount)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="text-green-500">-{fmt(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span className="text-primary">{fmt(order.total_amount)}</span>
              </div>
            </div>
          </section>

          {/* Endereço */}
          {addr && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Endereço de entrega
              </h3>
              <div className="glass-card p-3 text-sm space-y-1">
                {addr.recipient_name && (
                  <p className="font-medium">{addr.recipient_name}</p>
                )}
                {addr.company_name && <p>{addr.company_name}</p>}
                {addr.cnpj && (
                  <p className="text-muted-foreground">CNPJ: {addr.cnpj}</p>
                )}
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
              </div>
            </section>
          )}

          {/* Histórico de Status */}
          {sortedHistory.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Histórico de status
              </h3>
              <div className="relative pl-4 border-l-2 border-border/30 space-y-4">
                {sortedHistory.map((h) => {
                  const sMeta = getOrderStatus(h.new_status);
                  const SIcon = sMeta.icon;
                  return (
                    <div key={h.id} className="relative">
                      <div
                        className={cn(
                          "absolute -left-[calc(0.5rem+1px)] top-0.5 h-4 w-4 rounded-full flex items-center justify-center",
                          sMeta.color
                        )}
                      >
                        <SIcon className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{sMeta.label}</p>
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
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
