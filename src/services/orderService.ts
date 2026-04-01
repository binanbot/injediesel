import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/stores/useCartStore";
import type { DeliveryAddress } from "@/components/franqueado/DeliveryAddressForm";
import { buildWhatsAppMessage, type PaymentMethod } from "@/utils/whatsappOrder";

const generateOrderNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const t = now.getTime().toString().slice(-6);
  return `PRX-${y}${m}${d}-${t}`;
};

export async function createOrderFromCart(
  franchiseProfileId: string,
  address: DeliveryAddress,
  items: CartItem[]
) {
  if (!items.length) {
    throw new Error("Carrinho vazio");
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = subtotal;
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const orderNumber = generateOrderNumber();

  // 1. Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      franchise_profile_id: franchiseProfileId,
      order_number: orderNumber,
      status: "pedido_realizado",
      payment_status: "pendente",
      fulfillment_status: "pedido_realizado",
      items_count: itemsCount,
      subtotal,
      shipping_amount: 0,
      discount_amount: 0,
      total_amount: totalAmount,
      delivery_address: address as any,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Create order items
  const orderItemsPayload = items.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    product_sku: item.sku || null,
    unit_price: item.price,
    quantity: item.quantity,
    line_total: item.price * item.quantity,
    product_snapshot: item as any,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) throw itemsError;

  // 3. Initial status history
  const { error: historyError } = await supabase
    .from("order_status_history")
    .insert({
      order_id: order.id,
      previous_status: null,
      new_status: "pedido_realizado",
      internal_note: "Pedido criado pelo franqueado via Loja Promax",
    });

  if (historyError) console.warn("Status history error:", historyError.message);

  // 4. Financial entries (franchisee cost + matrix revenue)
  const { error: financialError } = await supabase
    .from("financial_entries")
    .insert([
      {
        franchise_profile_id: franchiseProfileId,
        order_id: order.id,
        scope: "franqueado",
        entry_type: "custo",
        category: "pecas_acessorios",
        description: `Pedido ${orderNumber} - Loja Promax`,
        amount: totalAmount,
      },
      {
        franchise_profile_id: franchiseProfileId,
        order_id: order.id,
        scope: "matriz",
        entry_type: "receita",
        category: "pecas_acessorios",
        description: `Pedido ${orderNumber} - Loja Promax`,
        amount: totalAmount,
      },
    ]);

  if (financialError) console.warn("Financial entries error:", financialError.message);

  return order;
}

export function openOrderOnWhatsApp(
  address: DeliveryAddress,
  items: CartItem[],
  paymentMethod: PaymentMethod = "nao_definido",
  paymentNote?: string,
) {
  const phone = "5545998590384";
  const message = buildWhatsAppMessage(address, items, paymentMethod, paymentNote);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
}
