import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/services/auditService";
import { validateSellerForAttribution, getWalletStatus, isThirdPartyAttribution } from "@/services/commercialEligibilityService";

export interface ManualSaleItem {
  product_id: string;
  product_name: string;
  product_sku: string | null;
  unit_price: number;
  quantity: number;
  discount_amount: number;
}

export interface ManualSalePayload {
  customer_id: string;
  seller_profile_id: string;
  sale_channel: "whatsapp" | "telefone" | "balcao";
  franchise_profile_id: string;
  unit_id?: string;
  company_id?: string;
  items: ManualSaleItem[];
  payment_method?: string;
  payment_note?: string;
  notes?: string;
  /** The customer's primary_seller_id, if any — used for audit */
  customer_primary_seller_id?: string | null;
}

const generateOrderNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const t = now.getTime().toString().slice(-6);
  return `MAN-${y}${m}${d}-${t}`;
};

export async function createManualSale(payload: ManualSalePayload) {
  if (!payload.items.length) throw new Error("Nenhum item adicionado");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Validate seller is eligible for commercial attribution
  if (payload.company_id) {
    const validation = await validateSellerForAttribution(payload.seller_profile_id, payload.company_id);
    if (!validation.valid) {
      throw new Error(`Vendedor inválido para atribuição: ${validation.reason}`);
    }
  }

  const subtotal = payload.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const totalDiscount = payload.items.reduce(
    (sum, item) => sum + item.discount_amount * item.quantity,
    0
  );
  const totalAmount = subtotal - totalDiscount;
  const itemsCount = payload.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderNumber = generateOrderNumber();

  // Determine sale_type from seller's mode
  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("seller_mode, max_discount_pct")
    .eq("id", payload.seller_profile_id)
    .single();

  const saleType = seller?.seller_mode === "ecu" ? "ecu" : seller?.seller_mode === "parts" ? "parts" : "mixed";

  // Validate discount against seller's max
  if (seller && subtotal > 0) {
    const discountPct = (totalDiscount / subtotal) * 100;
    if (discountPct > Number(seller.max_discount_pct || 0)) {
      throw new Error(
        `Desconto de ${discountPct.toFixed(1)}% excede o máximo permitido de ${seller.max_discount_pct}%`
      );
    }
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      franchise_profile_id: payload.franchise_profile_id,
      order_number: orderNumber,
      status: "pedido_realizado",
      payment_status: "pendente",
      fulfillment_status: "pedido_realizado",
      items_count: itemsCount,
      subtotal,
      shipping_amount: 0,
      discount_amount: totalDiscount,
      total_amount: totalAmount,
      payment_method: payload.payment_method || null,
      payment_note: payload.payment_note || null,
      seller_profile_id: payload.seller_profile_id,
      sale_type: saleType,
      sale_channel: payload.sale_channel,
      customer_id: payload.customer_id,
      operator_user_id: user.id,
      unit_id: payload.unit_id || null,
      notes: payload.notes || null,
    } as any)
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItemsPayload = payload.items.map((item) => ({
    order_id: (order as any).id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_sku: item.product_sku || null,
    unit_price: item.unit_price,
    quantity: item.quantity,
    line_total: (item.unit_price - item.discount_amount) * item.quantity,
    product_snapshot: item as any,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) throw itemsError;

  // Status history
  await supabase.from("order_status_history").insert({
    order_id: (order as any).id,
    previous_status: null,
    new_status: "pedido_realizado",
    internal_note: "Venda manual assistida",
    changed_by: user.id,
  });

  // Financial entries
  await supabase.from("financial_entries").insert([
    {
      franchise_profile_id: payload.franchise_profile_id,
      order_id: (order as any).id,
      scope: "franqueado",
      entry_type: "custo",
      category: "pecas_acessorios",
      description: `Venda manual ${orderNumber}`,
      amount: totalAmount,
    },
    {
      franchise_profile_id: payload.franchise_profile_id,
      order_id: (order as any).id,
      scope: "matriz",
      entry_type: "receita",
      category: "pecas_acessorios",
      description: `Venda manual ${orderNumber}`,
      amount: totalAmount,
    },
  ]);

  const isOutOfWallet = getWalletStatus(payload.seller_profile_id, payload.customer_primary_seller_id ?? null) === "out_of_wallet";

  // Check if operator is different from seller (third-party attribution)
  const sellerUserId = seller ? (await supabase
    .from("seller_profiles")
    .select("employee_profiles!seller_profiles_employee_profile_id_fkey(user_id)")
    .eq("id", payload.seller_profile_id)
    .single()
  ).data : null;
  const isThirdParty = isThirdPartyAttribution(
    user.id,
    (sellerUserId as any)?.employee_profiles?.user_id ?? null
  );

  // Audit
  await logAuditEvent({
    action: "order.manual_sale_created",
    module: "vendas",
    companyId: payload.company_id,
    targetType: "order",
    targetId: (order as any).id,
    details: {
      order_number: orderNumber,
      operator_user_id: user.id,
      seller_profile_id: payload.seller_profile_id,
      customer_id: payload.customer_id,
      sale_channel: payload.sale_channel,
      total_amount: totalAmount,
      items_count: itemsCount,
      is_third_party_attribution: isThirdParty,
      is_out_of_wallet: isOutOfWallet,
      customer_primary_seller_id: payload.customer_primary_seller_id || null,
    },
  });

  return order;
}
