import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "permission_profile.created"
  | "permission_profile.updated"
  | "permission_profile.cloned"
  | "employee.created"
  | "employee.updated"
  | "employee.deactivated"
  | "seller.activated"
  | "seller.deactivated"
  | "seller.commission_changed"
  | "seller.mode_changed"
  | "seller.commercial_access_changed"
  | "permission_override.set"
  | "permission_override.removed"
  | "ticket.status_changed"
  | "order.status_changed"
  | "order.payment_status_changed"
  | "discount_policy.violated"
  | "sales_target.created"
  | "sales_target.updated"
  | "export.executed";

export type AuditModule =
  | "permissoes"
  | "colaboradores"
  | "vendedores"
  | "suporte"
  | "comercial"
  | "metas"
  | "pedidos"
  | "exportacoes";

export interface AuditLogEntry {
  id: string;
  company_id: string | null;
  user_id: string;
  user_email: string | null;
  action: string;
  module: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

/**
 * Log an audit event. Fire-and-forget — does not throw on failure.
 */
export async function logAuditEvent(params: {
  action: AuditAction;
  module: AuditModule;
  companyId?: string | null;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_logs").insert([{
      user_id: user.id,
      user_email: user.email || null,
      company_id: params.companyId || null,
      action: params.action,
      module: params.module,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      details: (params.details || {}) as Record<string, unknown>,
    }] as any);
  } catch (err) {
    console.warn("[audit] Failed to log event:", err);
  }
}

export type AuditFilters = {
  companyId?: string;
  module?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

/**
 * Fetch audit logs with optional filters.
 */
export async function getAuditLogs(filters: AuditFilters = {}): Promise<{
  data: AuditLogEntry[];
  count: number;
}> {
  let q = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.companyId) q = q.eq("company_id", filters.companyId);
  if (filters.module) q = q.eq("module", filters.module);
  if (filters.action) q = q.eq("action", filters.action);
  if (filters.userId) q = q.eq("user_id", filters.userId);
  if (filters.startDate) q = q.gte("created_at", filters.startDate);
  if (filters.endDate) q = q.lte("created_at", filters.endDate);

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    data: (data || []) as AuditLogEntry[],
    count: count || 0,
  };
}
