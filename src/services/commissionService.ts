import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/services/auditService";
import { SERVICES_ELIGIBLE, EXCLUDED_STATUS_FILTER } from "@/services/commercialEligibilityService";

export type CommissionClosingRow = {
  id: string;
  seller_profile_id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  orders_revenue: number;
  files_revenue: number;
  services_revenue: number;
  total_revenue: number;
  orders_count: number;
  files_count: number;
  services_count: number;
  commission_type: string;
  commission_value: number;
  estimated_commission: number;
  realized_commission: number;
  status: string;
  period_status: string;
  approved_by: string | null;
  approved_at: string | null;
  paid_by: string | null;
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
    period_status: row.period_status || "aberto",
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
  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("id, commission_type, commission_value, commission_enabled")
    .eq("id", sellerId)
    .single();

  if (!seller) throw new Error("Vendedor não encontrado");

  // Skip commission generation for sellers without commission enabled
  if ((seller as any).commission_enabled === false) {
    throw new Error("Vendedor não tem comissão habilitada. Não é possível gerar fechamento.");
  }

  // Aggregate orders (always eligible)
  const { data: orders = [] } = await supabase
    .from("orders")
    .select("total_amount, items_count")
    .eq("seller_profile_id", sellerId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd)
    .not("status", "in", EXCLUDED_STATUS_FILTER);

  // Aggregate files (always eligible)
  const { data: files = [] } = await supabase
    .from("received_files")
    .select("valor_brl")
    .eq("seller_profile_id", sellerId)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  // Aggregate services (gated by SERVICES_ELIGIBLE flag)
  let svcRows: any[] = [];
  if (SERVICES_ELIGIBLE) {
    const { data } = await supabase
      .from("services")
      .select("amount_brl")
      .eq("seller_profile_id", sellerId)
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);
    svcRows = data || [];
  }

  const ordersRevenue = (orders as any[]).reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const ordersCount = (orders as any[]).length;
  const filesRevenue = (files as any[]).reduce((s, f) => s + Number(f.valor_brl || 0), 0);
  const filesCount = (files as any[]).length;
  const servicesRevenue = svcRows.reduce((s: number, sv: any) => s + Number(sv.amount_brl || 0), 0);
  const servicesCount = svcRows.length;
  const totalRevenue = ordersRevenue + filesRevenue + servicesRevenue;
  const totalCount = ordersCount + filesCount + servicesCount;

  let realized = 0;
  const commEnabled = (seller as any).commission_enabled !== false;
  if (commEnabled) {
    if (seller.commission_type === "percentage") {
      realized = totalRevenue * (Number(seller.commission_value || 0) / 100);
    } else {
      realized = totalCount * Number(seller.commission_value || 0);
    }
  }

  const { error } = await supabase.from("commission_closings").upsert(
    {
      seller_profile_id: sellerId,
      company_id: companyId,
      period_start: periodStart,
      period_end: periodEnd,
      orders_revenue: ordersRevenue,
      files_revenue: filesRevenue,
      services_revenue: servicesRevenue,
      total_revenue: totalRevenue,
      orders_count: ordersCount,
      files_count: filesCount,
      services_count: servicesCount,
      commission_type: seller.commission_type,
      commission_value: Number(seller.commission_value || 0),
      estimated_commission: realized,
      realized_commission: realized,
      status: "apurada",
      period_status: "em_apuracao",
    } as any,
    { onConflict: "seller_profile_id,period_start,period_end" }
  );

  if (error) throw error;
}

export async function updateClosingStatus(
  id: string,
  newStatus: "aprovada" | "paga",
  companyId?: string,
  notes?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  // Check if closing is locked
  const { data: closing } = await supabase
    .from("commission_closings")
    .select("status, period_status")
    .eq("id", id)
    .single();

  if (closing && (closing as any).period_status === "pago" && newStatus !== "paga") {
    throw new Error("Período já pago. Reabra o período antes de alterar.");
  }

  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === "aprovada") {
    updates.approved_by = user?.id;
    updates.approved_at = new Date().toISOString();
    updates.period_status = "fechado";
  } else if (newStatus === "paga") {
    updates.paid_by = user?.id;
    updates.paid_at = new Date().toISOString();
    updates.period_status = "pago";
  }

  if (notes !== undefined) updates.notes = notes;

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
    details: { new_status: newStatus, notes },
  });
}

export async function reopenClosing(id: string, companyId?: string): Promise<void> {
  const { error } = await supabase
    .from("commission_closings")
    .update({ period_status: "em_apuracao", status: "apurada", approved_by: null, approved_at: null, paid_by: null, paid_at: null } as any)
    .eq("id", id);

  if (error) throw error;

  await logAuditEvent({
    action: "sales_target.updated",
    module: "comercial",
    companyId,
    targetType: "commission_closing",
    targetId: id,
    details: { action: "reopened" },
  });
}

export async function updateClosingNotes(id: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from("commission_closings")
    .update({ notes } as any)
    .eq("id", id);
  if (error) throw error;
}

/** Summary stats for the commissions view */
export function getCommissionSummary(closings: CommissionClosingRow[]) {
  let totalEstimated = 0;
  let totalRealized = 0;
  let totalPaid = 0;
  let totalApproved = 0;
  let totalPending = 0;

  for (const c of closings) {
    totalEstimated += c.estimated_commission;
    totalRealized += c.realized_commission;
    if (c.status === "paga") totalPaid += c.realized_commission;
    else if (c.status === "aprovada") totalApproved += c.realized_commission;
    else totalPending += c.realized_commission;
  }

  return {
    totalEstimated,
    totalRealized,
    totalPaid,
    totalApproved,
    totalPending,
    divergence: totalEstimated - totalRealized,
    count: closings.length,
  };
}
