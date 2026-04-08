import { supabase } from "@/integrations/supabase/client";

export type SellerRankingRow = {
  seller_profile_id: string;
  seller_name: string;
  seller_mode: string;
  company_id: string;
  company_name: string;
  orders_count: number;
  orders_revenue: number;
  files_count: number;
  files_revenue: number;
  total_revenue: number;
  total_items: number;
  avg_ticket: number;
  commission_type: string;
  commission_value: number;
  estimated_commission: number;
  max_discount_pct: number;
  target_value: number | null;
  target_progress: number | null;
  // Commercial access flags
  sales_channel_mode: string;
  can_sell_services: boolean;
  commission_enabled: boolean;
  target_enabled: boolean;
};

export type SalesTargetRow = {
  id: string;
  seller_profile_id: string | null;
  company_id: string | null;
  sale_type: string;
  metric_key: string;
  target_value: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
  seller_name?: string;
};

type DateRange = { startDate: string; endDate: string };

/**
 * Fetch seller rankings with aggregated performance data.
 * Works across companies (for master/ceo) or scoped to one company (admin).
 */
export async function getSellerRanking(
  opts: DateRange & { companyId?: string; saleType?: string; commissionEnabled?: boolean; targetEnabled?: boolean; channelMode?: string; canSellServices?: boolean }
): Promise<SellerRankingRow[]> {
  // 1. Fetch active sellers with their profiles
  let sellerQuery = supabase
    .from("seller_profiles")
    .select(`
      id,
      seller_mode,
      commission_type,
      commission_value,
      max_discount_pct,
      sales_channel_mode,
      can_sell_services,
      commission_enabled,
      target_enabled,
      employee_profiles!seller_profiles_employee_profile_id_fkey (
        display_name,
        company_id,
        companies:company_id ( name )
      )
    `)
    .eq("is_active", true);

  const { data: sellers, error: sellersErr } = await sellerQuery;
  if (sellersErr) throw sellersErr;
  if (!sellers?.length) return [];

  // Filter by company and commercial access flags
  let filteredSellers = opts.companyId
    ? sellers.filter((s: any) => s.employee_profiles?.company_id === opts.companyId)
    : sellers;

  if (opts.commissionEnabled !== undefined) {
    filteredSellers = filteredSellers.filter((s: any) => (s.commission_enabled ?? true) === opts.commissionEnabled);
  }
  if (opts.targetEnabled !== undefined) {
    filteredSellers = filteredSellers.filter((s: any) => (s.target_enabled ?? true) === opts.targetEnabled);
  }
  if (opts.channelMode && opts.channelMode !== "all") {
    filteredSellers = filteredSellers.filter((s: any) => (s.sales_channel_mode || "both") === opts.channelMode);
  }
  if (opts.canSellServices !== undefined) {
    filteredSellers = filteredSellers.filter((s: any) => (s.can_sell_services ?? true) === opts.canSellServices);
  }

  if (!filteredSellers.length) return [];

  const sellerIds = filteredSellers.map((s: any) => s.id);

  // 2. Aggregate orders by seller
  let ordersQuery = supabase
    .from("orders")
    .select("seller_profile_id, total_amount, items_count, sale_type")
    .in("seller_profile_id", sellerIds)
    .gte("created_at", opts.startDate)
    .lte("created_at", opts.endDate)
    .not("status", "in", '("cancelado","reembolsado")');

  if (opts.saleType && opts.saleType !== "total") {
    ordersQuery = ordersQuery.eq("sale_type", opts.saleType);
  }

  const { data: orders = [] } = await ordersQuery;

  // 3. Aggregate received_files (ECU) by seller
  let filesQuery = supabase
    .from("received_files")
    .select("seller_profile_id, valor_brl")
    .in("seller_profile_id", sellerIds)
    .gte("created_at", opts.startDate)
    .lte("created_at", opts.endDate);

  const { data: files = [] } = await filesQuery;

  // 4. Fetch active targets for period
  const { data: targets = [] } = await supabase
    .from("sales_targets")
    .select("seller_profile_id, target_value, metric_key, sale_type")
    .in("seller_profile_id", sellerIds)
    .eq("is_active", true)
    .lte("period_start", opts.endDate)
    .gte("period_end", opts.startDate);

  // 5. Build ranking
  const ordersBySeller = new Map<string, { count: number; revenue: number; items: number }>();
  for (const o of orders as any[]) {
    if (!o.seller_profile_id) continue;
    const cur = ordersBySeller.get(o.seller_profile_id) || { count: 0, revenue: 0, items: 0 };
    cur.count += 1;
    cur.revenue += Number(o.total_amount || 0);
    cur.items += Number(o.items_count || 0);
    ordersBySeller.set(o.seller_profile_id, cur);
  }

  const filesBySeller = new Map<string, { count: number; revenue: number }>();
  for (const f of files as any[]) {
    if (!f.seller_profile_id) continue;
    const cur = filesBySeller.get(f.seller_profile_id) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(f.valor_brl || 0);
    filesBySeller.set(f.seller_profile_id, cur);
  }

  const targetBySeller = new Map<string, number>();
  for (const t of targets as any[]) {
    if (!t.seller_profile_id) continue;
    if (t.metric_key === "revenue") {
      targetBySeller.set(
        t.seller_profile_id,
        (targetBySeller.get(t.seller_profile_id) || 0) + Number(t.target_value || 0)
      );
    }
  }

  const rows: SellerRankingRow[] = filteredSellers.map((s: any) => {
    const ep = s.employee_profiles;
    const oData = ordersBySeller.get(s.id) || { count: 0, revenue: 0, items: 0 };
    const fData = filesBySeller.get(s.id) || { count: 0, revenue: 0 };
    const totalRevenue = oData.revenue + fData.revenue;
    const totalCount = oData.count + fData.count;
    const target = targetBySeller.get(s.id) ?? null;

    let estComm = 0;
    if (s.commission_type === "percentage") {
      estComm = totalRevenue * (Number(s.commission_value || 0) / 100);
    } else {
      estComm = totalCount * Number(s.commission_value || 0);
    }

    return {
      seller_profile_id: s.id,
      seller_name: ep?.display_name || "Sem nome",
      seller_mode: s.seller_mode,
      company_id: ep?.company_id || "",
      company_name: ep?.companies?.name || "",
      orders_count: oData.count,
      orders_revenue: oData.revenue,
      files_count: fData.count,
      files_revenue: fData.revenue,
      total_revenue: totalRevenue,
      total_items: oData.items,
      avg_ticket: totalCount > 0 ? totalRevenue / totalCount : 0,
      commission_type: s.commission_type,
      commission_value: Number(s.commission_value || 0),
      max_discount_pct: Number(s.max_discount_pct || 0),
      estimated_commission: estComm,
      target_value: target,
      target_progress: target && target > 0 ? (totalRevenue / target) * 100 : null,
      sales_channel_mode: s.sales_channel_mode || "both",
      can_sell_services: s.can_sell_services ?? true,
      commission_enabled: s.commission_enabled ?? true,
      target_enabled: s.target_enabled ?? true,
    };
  });

  rows.sort((a, b) => b.total_revenue - a.total_revenue);
  return rows;
}

/**
 * Fetch sales targets for management UI.
 */
export async function getSalesTargets(
  opts: DateRange & { companyId?: string }
): Promise<SalesTargetRow[]> {
  let q = supabase
    .from("sales_targets")
    .select("*")
    .eq("is_active", true)
    .lte("period_start", opts.endDate)
    .gte("period_end", opts.startDate)
    .order("period_start", { ascending: false });

  if (opts.companyId) {
    q = q.eq("company_id", opts.companyId);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as SalesTargetRow[];
}

/**
 * Upsert a sales target.
 */
export async function upsertSalesTarget(target: Omit<SalesTargetRow, "id" | "seller_name"> & { id?: string }) {
  const payload = {
    seller_profile_id: target.seller_profile_id,
    company_id: target.company_id,
    sale_type: target.sale_type,
    metric_key: target.metric_key,
    target_value: target.target_value,
    period_start: target.period_start,
    period_end: target.period_end,
    is_active: target.is_active,
  };

  if (target.id) {
    const { error } = await supabase
      .from("sales_targets")
      .update(payload)
      .eq("id", target.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("sales_targets")
      .insert(payload);
    if (error) throw error;
  }
}
