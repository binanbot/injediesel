import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/services/auditService";

export type CommissionClosingRow = {
  id: string;
  seller_profile_id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  orders_revenue: number;
  files_revenue: number;
  total_revenue: number;
  orders_count: number;
  files_count: number;
  commission_type: string;
  commission_value: number;
  estimated_commission: number;
  realized_commission: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  seller_name?: string;
  company_name?: string;
};

type DateRange = { startDate: string; endDate: string };

export async function getCommissionClosings(
  opts: DateRange & { companyId?: string; sellerId?: string; status?: string }
): Promise<CommissionClosingRow[]> {
  let q = supabase
    .from("commission_closings")
    .select("*")
    .order("period_start", { ascending: false });

  if (opts.companyId) q = q.eq("company_id", opts.companyId);
  if (opts.sellerId) q = q.eq("seller_profile_id", opts.sellerId);
  if (opts.status) q = q.eq("status", opts.status);
  q = q.lte("period_start", opts.endDate).gte("period_end", opts.startDate);

  const { data, error } = await q;
  if (error) throw error;

  if (!data?.length) return [];

  // Enrich with seller names
  const sellerIds = [...new Set((data as any[]).map((d) => d.seller_profile_id))];
  const { data: sellers } = await supabase
    .from("seller_profiles")
    .select("id, employee_profiles!seller_profiles_employee_profile_id_fkey(display_name, companies:company_id(name))")
    .in("id", sellerIds);

  const nameMap = new Map<string, { seller: string; company: string }>();
  for (const s of (sellers || []) as any[]) {
    nameMap.set(s.id, {
      seller: s.employee_profiles?.display_name || "Sem nome",
      company: s.employee_profiles?.companies?.name || "",
    });
  }

  return (data as any[]).map((row) => ({
    ...row,
    seller_name: nameMap.get(row.seller_profile_id)?.seller || "Sem nome",
    company_name: nameMap.get(row.seller_profile_id)?.company || "",
  }));
}

export async function generateClosing(
  sellerId: string,
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<void> {
  // Fetch seller config
  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("id, commission_type, commission_value")
    .eq("id", sellerId)
    .single();

  if (!seller) throw new Error("Vendedor não encontrado");

  // Aggregate orders
  const { data: orders = [] } = await supabase
    .from("orders")
    .select("total_amount, items_count")
    .eq("seller_profile_id", sellerId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd)
    .not("status", "in", '("cancelado","reembolsado")');

  // Aggregate files
  const { data: files = [] } = await supabase
    .from("received_files")
    .select("valor_brl")
    .eq("seller_profile_id", sellerId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  const ordersRevenue = (orders as any[]).reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const ordersCount = (orders as any[]).length;
  const filesRevenue = (files as any[]).reduce((s, f) => s + Number(f.valor_brl || 0), 0);
  const filesCount = (files as any[]).length;
  const totalRevenue = ordersRevenue + filesRevenue;
  const totalCount = ordersCount + filesCount;

  let realized = 0;
  if (seller.commission_type === "percentage") {
    realized = totalRevenue * (Number(seller.commission_value || 0) / 100);
  } else {
    realized = totalCount * Number(seller.commission_value || 0);
  }

  const { error } = await supabase.from("commission_closings").upsert(
    {
      seller_profile_id: sellerId,
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      orders_revenue: ordersRevenue,
      files_revenue: filesRevenue,
      total_revenue: totalRevenue,
      orders_count: ordersCount,
      files_count: filesCount,
      commission_type: seller.commission_type,
      commission_value: Number(seller.commission_value || 0),
      estimated_commission: realized,
      realized_commission: realized,
      status: "apurada",
    } as any,
    { onConflict: "seller_profile_id,period_start,period_end" }
  );

  if (error) throw error;
}

export async function updateClosingStatus(
  id: string,
  newStatus: "aprovada" | "paga",
  companyId?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === "aprovada") {
    updates.approved_by = user?.id;
    updates.approved_at = new Date().toISOString();
  } else if (newStatus === "paga") {
    updates.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("commission_closings")
    .update(updates as any)
    .eq("id", id);

  if (error) throw error;

  await logAuditEvent({
    action: "sales_target.updated",
    module: "comercial",
    companyId,
    targetType: "commission_closing",
    targetId: id,
    details: { new_status: newStatus },
  });
}
