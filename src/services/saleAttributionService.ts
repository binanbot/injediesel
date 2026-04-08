import { supabase } from "@/integrations/supabase/client";
import { EXCLUDED_STATUS_FILTER, getWalletStatus, isThirdPartyAttribution } from "@/services/commercialEligibilityService";

export interface AttributionStats {
  totalOrders: number;
  totalFiles: number;
  totalServices: number;
  totalItems: number;
  selfAttributed: number;
  thirdPartyAttributed: number;
  walletMatch: number;
  walletMismatch: number;
  noWallet: number;
  byChannel: Record<string, number>;
  byType: Record<string, { count: number; revenue: number }>;
  byOperator: Record<string, { count: number; revenue: number; email?: string }>;
}

type ItemRow = {
  id: string;
  operator_user_id: string | null;
  seller_profile_id: string | null;
  customer_id: string | null;
  sale_channel: string | null;
  amount: number;
  type: "order" | "file" | "service";
};

/**
 * Fetches attribution breakdown for orders + files + services in a period.
 */
export async function getAttributionStats(opts: {
  startDate: string;
  endDate: string;
  companyId?: string;
}): Promise<AttributionStats> {
  const items: ItemRow[] = [];

  // 1. Orders
  const { data: orders = [] } = await supabase
    .from("orders")
    .select("id, operator_user_id, seller_profile_id, customer_id, sale_channel, total_amount")
    .gte("created_at", opts.startDate)
    .lte("created_at", opts.endDate)
    .not("status", "in", EXCLUDED_STATUS_FILTER);

  for (const o of orders as any[]) {
    items.push({
      id: o.id,
      operator_user_id: o.operator_user_id,
      seller_profile_id: o.seller_profile_id,
      customer_id: o.customer_id,
      sale_channel: o.sale_channel,
      amount: Number(o.total_amount || 0),
      type: "order",
    });
  }

  // 2. Received files (ECU)
  const { data: files = [] } = await supabase
    .from("received_files")
    .select("id, operator_user_id, seller_profile_id, customer_id, sale_channel, valor_brl")
    .gte("created_at", opts.startDate)
    .lte("created_at", opts.endDate);

  for (const f of files as any[]) {
    items.push({
      id: f.id,
      operator_user_id: f.operator_user_id,
      seller_profile_id: f.seller_profile_id,
      customer_id: f.customer_id,
      sale_channel: f.sale_channel,
      amount: Number(f.valor_brl || 0),
      type: "file",
    });
  }

  // 3. Services
  const { data: services = [] } = await supabase
    .from("services")
    .select("id, operator_user_id, seller_profile_id, customer_id, sale_channel, amount_brl")
    .gte("created_at", opts.startDate)
    .lte("created_at", opts.endDate);

  for (const s of services as any[]) {
    items.push({
      id: s.id,
      operator_user_id: s.operator_user_id,
      seller_profile_id: s.seller_profile_id,
      customer_id: s.customer_id,
      sale_channel: s.sale_channel,
      amount: Number(s.amount_brl || 0),
      type: "service",
    });
  }

  if (!items.length) {
    return {
      totalOrders: 0, totalFiles: 0, totalServices: 0, totalItems: 0,
      selfAttributed: 0, thirdPartyAttributed: 0,
      walletMatch: 0, walletMismatch: 0, noWallet: 0,
      byChannel: {}, byType: {}, byOperator: {},
    };
  }

  // Seller → user_id mapping
  const sellerIds = [...new Set(items.map((i) => i.seller_profile_id).filter(Boolean))] as string[];
  const sellerUserMap = new Map<string, string>();
  if (sellerIds.length) {
    const { data: sellers } = await supabase
      .from("seller_profiles")
      .select("id, employee_profiles!seller_profiles_employee_profile_id_fkey(user_id)")
      .in("id", sellerIds);
    for (const s of (sellers || []) as any[]) {
      if (s.employee_profiles?.user_id) {
        sellerUserMap.set(s.id, s.employee_profiles.user_id);
      }
    }
  }

  // Customer wallet mapping
  const customerIds = [...new Set(items.map((i) => i.customer_id).filter(Boolean))] as string[];
  const customerWalletMap = new Map<string, string | null>();
  if (customerIds.length) {
    const { data: customers } = await supabase
      .from("customers")
      .select("id, primary_seller_id")
      .in("id", customerIds);
    for (const c of (customers || []) as any[]) {
      customerWalletMap.set(c.id, c.primary_seller_id || null);
    }
  }

  let selfAttributed = 0;
  let thirdPartyAttributed = 0;
  let walletMatch = 0;
  let walletMismatch = 0;
  let noWallet = 0;
  const byChannel: Record<string, number> = {};
  const byType: Record<string, { count: number; revenue: number }> = {};
  const byOperator: Record<string, { count: number; revenue: number }> = {};

  for (const item of items) {
    const sellerUserId = item.seller_profile_id ? sellerUserMap.get(item.seller_profile_id) : null;
    const operatorId = item.operator_user_id;

    // Self vs third-party (using centralized logic)
    if (isThirdPartyAttribution(operatorId, sellerUserId ?? null)) {
      thirdPartyAttributed++;
    } else {
      selfAttributed++;
    }

    // Wallet analysis (using centralized logic)
    const primarySeller = item.customer_id ? customerWalletMap.get(item.customer_id) ?? null : null;
    const ws = getWalletStatus(item.seller_profile_id, primarySeller);
    if (ws === "in_wallet") walletMatch++;
    else if (ws === "out_of_wallet") walletMismatch++;
    else noWallet++;

    // By channel
    const ch = item.sale_channel || "loja";
    byChannel[ch] = (byChannel[ch] || 0) + 1;

    // By type
    if (!byType[item.type]) byType[item.type] = { count: 0, revenue: 0 };
    byType[item.type].count++;
    byType[item.type].revenue += item.amount;

    // By operator
    if (operatorId) {
      if (!byOperator[operatorId]) byOperator[operatorId] = { count: 0, revenue: 0 };
      byOperator[operatorId].count++;
      byOperator[operatorId].revenue += item.amount;
    }
  }

  return {
    totalOrders: (orders as any[]).length,
    totalFiles: (files as any[]).length,
    totalServices: (services as any[]).length,
    totalItems: items.length,
    selfAttributed,
    thirdPartyAttributed,
    walletMatch,
    walletMismatch,
    noWallet,
    byChannel,
    byType,
    byOperator,
  };
}
