import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/stores/useCartStore";
import type { DeliveryAddress } from "@/components/franqueado/DeliveryAddressForm";

interface CreateOrderParams {
  items: CartItem[];
  delivery: DeliveryAddress;
  franchiseProfileId: string;
  unitId: string | null;
}

const generateOrderNumber = () => {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PX-${y}${m}${d}-${rand}`;
};

export async function createOrderFromCart({
  items,
  delivery,
  franchiseProfileId,
  unitId,
}: CreateOrderParams) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemsCount = items.reduce((s, i) => s + i.quantity, 0);
  const orderNumber = generateOrderNumber();

  // 1. Create order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      franchise_profile_id: franchiseProfileId,
      unit_id: unitId,
      order_number: orderNumber,
      status: "pedido_realizado",
      payment_status: "pendente",
      fulfillment_status: "pedido_realizado",
      items_count: itemsCount,
      subtotal,
      total_amount: subtotal,
      delivery_address: delivery as any,
    })
    .select("id, order_number")
    .single();

  if (orderErr || !order) throw new Error(orderErr?.message ?? "Erro ao criar pedido");

  // 2. Create order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    product_sku: item.sku ?? null,
    unit_price: item.price,
    quantity: item.quantity,
    line_total: item.price * item.quantity,
    product_snapshot: { image: item.image, sku: item.sku } as any,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
  if (itemsErr) throw new Error(itemsErr.message);

  // 3. Initial status history
  const { error: histErr } = await supabase.from("order_status_history").insert({
    order_id: order.id,
    previous_status: null,
    new_status: "pedido_realizado",
  });
  if (histErr) console.warn("Status history error:", histErr.message);

  // 4. Financial entries (franchisee cost + matrix revenue)
  const financialBase = {
    order_id: order.id,
    franchise_profile_id: franchiseProfileId,
    category: "pecas_acessorios",
    amount: subtotal,
    description: `Pedido ${orderNumber}`,
  };

  const { error: finErr } = await supabase.from("financial_entries").insert([
    { ...financialBase, scope: "franqueado", entry_type: "custo" },
    { ...financialBase, scope: "matriz", entry_type: "receita" },
  ]);
  if (finErr) console.warn("Financial entries error:", finErr.message);

  return order;
}
