/**
 * crmSlaService.ts
 * Calculates commercial SLA metrics: response time, follow-up rates, productivity.
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────

export interface SellerSlaMetrics {
  seller_profile_id: string;
  total_activities: number;
  completed_on_time: number;
  completed_late: number;
  still_pending: number;
  overdue: number;
  on_time_rate: number; // percentage
  avg_completion_hours: number | null;
}

export interface CommercialSla {
  avg_first_contact_hours: number | null;
  avg_return_hours: number | null;
  global_on_time_rate: number;
  total_completed: number;
  total_overdue: number;
  total_pending: number;
  by_seller: SellerSlaMetrics[];
}

// ─── Calculate SLA ───────────────────────────────────────────

export async function calcCommercialSla(companyId: string): Promise<CommercialSla> {
  // Load activities
  const { data: activities } = await supabase
    .from("crm_activities")
    .select("id, seller_profile_id, status, activity_type, scheduled_at, completed_at, due_date, created_at, customer_id")
    .eq("company_id", companyId);

  const acts = activities || [];

  // Load customers creation dates for first-contact calc
  const { data: units } = await supabase
    .from("units")
    .select("id")
    .eq("company_id", companyId);
  const unitIds = (units || []).map((u) => u.id);

  let customerCreationMap = new Map<string, string>();
  if (unitIds.length > 0) {
    const { data: customers } = await supabase
      .from("customers")
      .select("id, created_at")
      .in("unit_id", unitIds);
    for (const c of customers || []) {
      if (c.created_at) customerCreationMap.set(c.id, c.created_at);
    }
  }

  // 1. Average time to first contact
  const firstContactByCustomer = new Map<string, string>();
  const sortedActs = [...acts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  for (const a of sortedActs) {
    if (a.customer_id && !firstContactByCustomer.has(a.customer_id)) {
      firstContactByCustomer.set(a.customer_id, a.created_at);
    }
  }

  const firstContactDelays: number[] = [];
  for (const [customerId, firstActivityAt] of firstContactByCustomer) {
    const customerCreatedAt = customerCreationMap.get(customerId);
    if (customerCreatedAt) {
      const hours =
        (new Date(firstActivityAt).getTime() - new Date(customerCreatedAt).getTime()) /
        (1000 * 60 * 60);
      if (hours >= 0 && hours < 720) {
        // ignore > 30 days as outlier
        firstContactDelays.push(hours);
      }
    }
  }
  const avgFirstContact =
    firstContactDelays.length > 0
      ? firstContactDelays.reduce((s, h) => s + h, 0) / firstContactDelays.length
      : null;

  // 2. Average return time (activity_type = retorno, completed)
  const returnActs = acts.filter(
    (a) => a.activity_type === "retorno" && a.completed_at && a.scheduled_at
  );
  const returnDelays = returnActs.map((a) => {
    const scheduled = new Date(a.scheduled_at!).getTime();
    const completed = new Date(a.completed_at!).getTime();
    return (completed - scheduled) / (1000 * 60 * 60);
  });
  const avgReturn =
    returnDelays.length > 0
      ? returnDelays.reduce((s, h) => s + h, 0) / returnDelays.length
      : null;

  // 3. On-time rate and per-seller metrics
  const now = new Date().toISOString();
  const sellerMap = new Map<
    string,
    { total: number; onTime: number; late: number; pending: number; overdue: number; completionHours: number[] }
  >();

  let globalCompleted = 0;
  let globalOnTime = 0;
  let globalOverdue = 0;
  let globalPending = 0;

  for (const a of acts) {
    const sellerId = a.seller_profile_id || "__unassigned__";
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, { total: 0, onTime: 0, late: 0, pending: 0, overdue: 0, completionHours: [] });
    }
    const entry = sellerMap.get(sellerId)!;
    entry.total++;

    if (a.status === "realizada") {
      globalCompleted++;
      const deadline = a.due_date || a.scheduled_at;
      if (deadline && a.completed_at) {
        if (a.completed_at <= deadline) {
          entry.onTime++;
          globalOnTime++;
        } else {
          entry.late++;
        }
        const hours =
          (new Date(a.completed_at).getTime() - new Date(a.created_at).getTime()) /
          (1000 * 60 * 60);
        entry.completionHours.push(hours);
      } else {
        entry.onTime++;
        globalOnTime++;
      }
    } else if (a.status === "pendente") {
      const deadline = a.due_date || a.scheduled_at;
      if (deadline && deadline < now) {
        entry.overdue++;
        globalOverdue++;
      } else {
        entry.pending++;
        globalPending++;
      }
    } else if (a.status === "atrasada") {
      entry.overdue++;
      globalOverdue++;
    }
  }

  const bySeller: SellerSlaMetrics[] = [];
  for (const [sellerId, stats] of sellerMap) {
    if (sellerId === "__unassigned__") continue;
    const completedTotal = stats.onTime + stats.late;
    bySeller.push({
      seller_profile_id: sellerId,
      total_activities: stats.total,
      completed_on_time: stats.onTime,
      completed_late: stats.late,
      still_pending: stats.pending,
      overdue: stats.overdue,
      on_time_rate: completedTotal > 0 ? (stats.onTime / completedTotal) * 100 : 0,
      avg_completion_hours:
        stats.completionHours.length > 0
          ? stats.completionHours.reduce((s, h) => s + h, 0) / stats.completionHours.length
          : null,
    });
  }

  bySeller.sort((a, b) => b.on_time_rate - a.on_time_rate);

  return {
    avg_first_contact_hours: avgFirstContact,
    avg_return_hours: avgReturn,
    global_on_time_rate:
      globalCompleted > 0 ? (globalOnTime / globalCompleted) * 100 : 0,
    total_completed: globalCompleted,
    total_overdue: globalOverdue,
    total_pending: globalPending,
    by_seller: bySeller,
  };
}
