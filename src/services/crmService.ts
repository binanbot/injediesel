/**
 * crmService.ts — CRM Gerencial/Comercial
 * Atividades, Oportunidades e Carteira Inteligente
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────

export const ACTIVITY_TYPES = [
  { value: "contato", label: "Contato" },
  { value: "followup", label: "Follow-up" },
  { value: "retorno", label: "Retorno pendente" },
  { value: "observacao", label: "Observação" },
  { value: "reativacao", label: "Reativação" },
  { value: "negociacao", label: "Negociação" },
  { value: "perda", label: "Perda / Oportunidade perdida" },
] as const;

export const ACTIVITY_STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "realizada", label: "Realizada" },
  { value: "atrasada", label: "Atrasada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

export const ACTIVITY_PRIORITIES = [
  { value: "baixa", label: "Baixa", color: "text-muted-foreground" },
  { value: "media", label: "Média", color: "text-blue-400" },
  { value: "alta", label: "Alta", color: "text-amber-400" },
  { value: "urgente", label: "Urgente", color: "text-destructive" },
] as const;

export const OPPORTUNITY_STAGES = [
  { value: "lead", label: "Lead" },
  { value: "em_contato", label: "Em contato" },
  { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Negociação" },
  { value: "fechado_ganho", label: "Fechado (ganho)" },
  { value: "fechado_perdido", label: "Fechado (perdido)" },
] as const;

export const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telefone", label: "Telefone" },
  { value: "balcao", label: "Balcão" },
  { value: "email", label: "E-mail" },
] as const;

export const WALLET_STATUSES = [
  { value: "ativa", label: "Ativa", color: "text-emerald-400" },
  { value: "inativa", label: "Inativa", color: "text-muted-foreground" },
  { value: "em_risco", label: "Em risco", color: "text-amber-400" },
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number]["value"];
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number]["value"];
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number]["value"];

export interface CrmActivity {
  id: string;
  company_id: string;
  customer_id: string;
  seller_profile_id: string | null;
  opportunity_id: string | null;
  activity_type: string;
  channel: string | null;
  summary: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  reminder_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: { full_name: string; phone: string | null } | null;
  seller_display_name?: string | null;
}

export interface CrmOpportunity {
  id: string;
  company_id: string;
  customer_id: string;
  seller_profile_id: string | null;
  title: string;
  stage: string;
  estimated_value: number;
  sale_channel: string | null;
  order_id: string | null;
  file_id: string | null;
  lost_reason: string | null;
  notes: string | null;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: { full_name: string } | null;
  seller_display_name?: string | null;
}

export interface WalletCustomer {
  id: string;
  full_name: string;
  phone: string | null;
  primary_seller_id: string | null;
  wallet_status: string;
  is_active: boolean;
  last_order_at: string | null;
  days_since_purchase: number | null;
}

// ─── Activities CRUD ─────────────────────────────────────────

export async function fetchActivities(companyId: string) {
  const { data, error } = await supabase
    .from("crm_activities")
    .select(`
      *,
      customers ( full_name, phone )
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data || []) as CrmActivity[];
}

export async function createActivity(
  activity: Omit<CrmActivity, "id" | "created_at" | "updated_at" | "customer" | "seller_display_name">
) {
  const { data, error } = await supabase
    .from("crm_activities")
    .insert(activity as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateActivity(id: string, updates: Partial<CrmActivity>) {
  const { customer, seller_display_name, ...clean } = updates as any;
  const { data, error } = await supabase
    .from("crm_activities")
    .update(clean)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteActivity(id: string) {
  const { error } = await supabase.from("crm_activities").delete().eq("id", id);
  if (error) throw error;
}

// ─── Opportunities CRUD ──────────────────────────────────────

export async function fetchOpportunities(companyId: string) {
  const { data, error } = await supabase
    .from("crm_opportunities")
    .select(`
      *,
      customers ( full_name )
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data || []) as CrmOpportunity[];
}

export async function createOpportunity(
  opp: Omit<CrmOpportunity, "id" | "created_at" | "updated_at" | "customer" | "seller_display_name">
) {
  const { data, error } = await supabase
    .from("crm_opportunities")
    .insert(opp as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOpportunity(id: string, updates: Partial<CrmOpportunity>) {
  const { customer, seller_display_name, ...clean } = updates as any;
  const { data, error } = await supabase
    .from("crm_opportunities")
    .update(clean)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Wallet Health ───────────────────────────────────────────

/** Classify all company customers into wallet status */
export async function fetchWalletHealth(companyId: string): Promise<WalletCustomer[]> {
  const { data: units } = await supabase
    .from("units")
    .select("id")
    .eq("company_id", companyId);

  const unitIds = (units || []).map((u) => u.id);
  if (unitIds.length === 0) return [];

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, phone, primary_seller_id, wallet_status, is_active")
    .in("unit_id", unitIds)
    .eq("is_active", true);

  if (!customers || customers.length === 0) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, created_at")
    .in("customer_id", customers.map((c) => c.id))
    .order("created_at", { ascending: false });

  const lastOrderMap = new Map<string, string>();
  for (const o of orders || []) {
    if (o.customer_id && !lastOrderMap.has(o.customer_id)) {
      lastOrderMap.set(o.customer_id, o.created_at);
    }
  }

  const now = Date.now();
  return customers.map((c) => {
    const lastOrder = lastOrderMap.get(c.id);
    const daysSince = lastOrder
      ? Math.floor((now - new Date(lastOrder).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Auto-classify
    let computedStatus = c.wallet_status || "ativa";
    if (daysSince === null) {
      computedStatus = "inativa";
    } else if (daysSince > 90) {
      computedStatus = "inativa";
    } else if (daysSince > 45) {
      computedStatus = "em_risco";
    } else {
      computedStatus = "ativa";
    }

    return {
      id: c.id,
      full_name: c.full_name,
      phone: c.phone,
      primary_seller_id: c.primary_seller_id,
      wallet_status: computedStatus,
      is_active: c.is_active,
      last_order_at: lastOrder || null,
      days_since_purchase: daysSince,
    };
  });
}

// ─── Analytical queries ──────────────────────────────────────

/** Customers without recent orders (last N days) */
export async function fetchCustomersWithoutRecentPurchase(companyId: string, days = 60) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data: units } = await supabase
    .from("units")
    .select("id")
    .eq("company_id", companyId);

  const unitIds = (units || []).map((u) => u.id);
  if (unitIds.length === 0) return [];

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, phone, primary_seller_id, is_active, updated_at")
    .in("unit_id", unitIds)
    .eq("is_active", true);

  if (!customers || customers.length === 0) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, created_at")
    .in("customer_id", customers.map((c) => c.id))
    .order("created_at", { ascending: false });

  const lastOrderMap = new Map<string, string>();
  for (const o of orders || []) {
    if (o.customer_id && !lastOrderMap.has(o.customer_id)) {
      lastOrderMap.set(o.customer_id, o.created_at);
    }
  }

  return customers.filter((c) => {
    const lastOrder = lastOrderMap.get(c.id);
    return !lastOrder || new Date(lastOrder) < cutoff;
  }).map((c) => ({
    ...c,
    last_order_at: lastOrderMap.get(c.id) || null,
  }));
}

/** Customers without a primary seller */
export async function fetchCustomersWithoutSeller(companyId: string) {
  const { data: units } = await supabase
    .from("units")
    .select("id")
    .eq("company_id", companyId);

  const unitIds = (units || []).map((u) => u.id);
  if (unitIds.length === 0) return [];

  const { data } = await supabase
    .from("customers")
    .select("id, full_name, phone, is_active")
    .in("unit_id", unitIds)
    .eq("is_active", true)
    .is("primary_seller_id", null);

  return data || [];
}

/** Overdue follow-ups */
export async function fetchOverdueActivities(companyId: string) {
  const { data, error } = await supabase
    .from("crm_activities")
    .select(`*, customers ( full_name, phone )`)
    .eq("company_id", companyId)
    .eq("status", "pendente")
    .lt("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data || []) as CrmActivity[];
}

/** Seller productivity: activities count + completed count by seller */
export async function fetchSellerProductivity(companyId: string) {
  const { data: activities } = await supabase
    .from("crm_activities")
    .select("seller_profile_id, status")
    .eq("company_id", companyId);

  if (!activities) return [];

  const map = new Map<string, { total: number; completed: number; overdue: number }>();
  for (const a of activities) {
    if (!a.seller_profile_id) continue;
    const entry = map.get(a.seller_profile_id) || { total: 0, completed: 0, overdue: 0 };
    entry.total++;
    if (a.status === "realizada") entry.completed++;
    if (a.status === "atrasada") entry.overdue++;
    map.set(a.seller_profile_id, entry);
  }

  return Array.from(map.entries()).map(([seller_profile_id, stats]) => ({
    seller_profile_id,
    ...stats,
    completion_rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
  }));
}

/** Opportunity funnel summary */
export function calcFunnelSummary(opportunities: CrmOpportunity[]) {
  const stages = OPPORTUNITY_STAGES.map((s) => {
    const items = opportunities.filter((o) => o.stage === s.value);
    const total = items.reduce((sum, o) => sum + Number(o.estimated_value), 0);
    return { stage: s.value, label: s.label, count: items.length, total };
  });
  return stages;
}

// ─── Helpers ─────────────────────────────────────────────────

export function getPriorityLabel(value: string): string {
  return ACTIVITY_PRIORITIES.find((p) => p.value === value)?.label || value;
}

export function getPriorityColor(value: string): string {
  return ACTIVITY_PRIORITIES.find((p) => p.value === value)?.color || "text-muted-foreground";
}

export function getWalletStatusLabel(value: string): string {
  return WALLET_STATUSES.find((s) => s.value === value)?.label || value;
}

export function getWalletStatusColor(value: string): string {
  return WALLET_STATUSES.find((s) => s.value === value)?.color || "text-muted-foreground";
}
