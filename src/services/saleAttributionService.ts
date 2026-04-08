import { supabase } from "@/integrations/supabase/client";

export interface AttributionStats {
  totalOrders: number;
  selfAttributed: number;       // operator = seller
  thirdPartyAttributed: number; // operator ≠ seller
  walletMatch: number;          // seller = customer's primary_seller
  walletMismatch: number;       // seller ≠ customer's primary_seller
  noWallet: number;             // customer has no primary_seller
  byChannel: Record<string, number>;
  byOperator: Record<string, { count: number; revenue: number; email?: string }>;
}

/**
 * Fetches attribution breakdown for orders in a period.
 * Respects company scope via RLS.
 */
export async function getAttributionStats(opts: {
  startDate: string;
  endDate: string;
  companyId?: string;
}): Promise<AttributionStats> {
  // Fetch orders with operator, seller, customer primary_seller
  let q = supabase
    .from("orders")
    .select("id, operator_user_id, seller_profile_id, customer_id, sale_channel, total_amount")
    .gte("created_at", opts.startDate)
    .lte("created_at", opts.endDate)
    .not("status", "in", '("cancelado","reembolsado")');

  const { data: orders = [] } = await q;
  if (!orders?.length) {
    return {
      totalOrders: 0, selfAttributed: 0, thirdPartyAttributed: 0,
      walletMatch: 0, walletMismatch: 0, noWallet: 0,
      byChannel: {}, byOperator: {},
    };
  }

  // Get seller → user_id mapping
  const sellerIds = [...new Set((orders as any[]).map((o) => o.seller_profile_id).filter(Boolean))];
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

  // Get customer primary_seller_id for relevant customers
  const customerIds = [...new Set((orders as any[]).map((o) => o.customer_id).filter(Boolean))];
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
  const byOperator: Record<string, { count: number; revenue: number }> = {};

  for (const o of orders as any[]) {
    const sellerUserId = o.seller_profile_id ? sellerUserMap.get(o.seller_profile_id) : null;
    const operatorId = o.operator_user_id;

    // Self vs third-party
    if (operatorId && sellerUserId && operatorId === sellerUserId) {
      selfAttributed++;
    } else if (operatorId && sellerUserId) {
      thirdPartyAttributed++;
    } else {
      selfAttributed++; // no operator means old order or self
    }

    // Wallet analysis
    if (o.customer_id) {
      const primarySeller = customerWalletMap.get(o.customer_id);
      if (!primarySeller) {
        noWallet++;
      } else if (primarySeller === o.seller_profile_id) {
        walletMatch++;
      } else {
        walletMismatch++;
      }
    } else {
      noWallet++;
    }

    // By channel
    const ch = o.sale_channel || "loja";
    byChannel[ch] = (byChannel[ch] || 0) + 1;

    // By operator
    if (operatorId) {
      if (!byOperator[operatorId]) byOperator[operatorId] = { count: 0, revenue: 0 };
      byOperator[operatorId].count++;
      byOperator[operatorId].revenue += Number(o.total_amount || 0);
    }
  }

  return {
    totalOrders: (orders as any[]).length,
    selfAttributed,
    thirdPartyAttributed,
    walletMatch,
    walletMismatch,
    noWallet,
    byChannel,
    byOperator,
  };
}
