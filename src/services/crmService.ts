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

// ─── Analytical queries ──────────────────────────────────────

/** Customers without recent orders (last N days) */
export async function fetchCustomersWithoutRecentPurchase(companyId: string, days = 60) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Get company unit ids first
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

  // Get last order per customer
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

/** Opportunity funnel summary */
export function calcFunnelSummary(opportunities: CrmOpportunity[]) {
  const stages = OPPORTUNITY_STAGES.map((s) => {
    const items = opportunities.filter((o) => o.stage === s.value);
    const total = items.reduce((sum, o) => sum + Number(o.estimated_value), 0);
    return { stage: s.value, label: s.label, count: items.length, total };
  });
  return stages;
}
