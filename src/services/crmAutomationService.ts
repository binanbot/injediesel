/**
 * crmAutomationService.ts
 * Generates automatic task suggestions and configurable CRM rules per company.
 */

import { supabase } from "@/integrations/supabase/client";

// ─── CRM Config (per-company, stored in companies.settings.crm_config) ───

export interface CrmConfig {
  days_at_risk: number;
  days_inactive: number;
  default_followup_days: number;
  stale_opportunity_days: number;
}

const CRM_CONFIG_DEFAULTS: CrmConfig = {
  days_at_risk: 45,
  days_inactive: 90,
  default_followup_days: 7,
  stale_opportunity_days: 15,
};

export function getCrmConfig(settings: Record<string, any> | null | undefined): CrmConfig {
  const raw = settings?.crm_config || {};
  return {
    days_at_risk: Number(raw.days_at_risk) || CRM_CONFIG_DEFAULTS.days_at_risk,
    days_inactive: Number(raw.days_inactive) || CRM_CONFIG_DEFAULTS.days_inactive,
    default_followup_days: Number(raw.default_followup_days) || CRM_CONFIG_DEFAULTS.default_followup_days,
    stale_opportunity_days: Number(raw.stale_opportunity_days) || CRM_CONFIG_DEFAULTS.stale_opportunity_days,
  };
}

// ─── Task Suggestion Types ───────────────────────────────────

export type SuggestionType =
  | "at_risk_no_contact"
  | "inactive_no_reactivation"
  | "stale_opportunity"
  | "overdue_followup_no_action"
  | "customer_no_seller";

export interface TaskSuggestion {
  type: SuggestionType;
  customer_id: string | null;
  customer_name: string;
  seller_profile_id: string | null;
  opportunity_id?: string | null;
  reason: string;
  priority: "alta" | "media" | "urgente";
  suggested_action: string;
  days?: number;
}

// ─── Generate Suggestions ────────────────────────────────────

export async function generateTaskSuggestions(
  companyId: string,
  config: CrmConfig
): Promise<TaskSuggestion[]> {
  const suggestions: TaskSuggestion[] = [];

  // Get company units
  const { data: units } = await supabase
    .from("units")
    .select("id")
    .eq("company_id", companyId);
  const unitIds = (units || []).map((u) => u.id);
  if (unitIds.length === 0) return suggestions;

  // Load data in parallel
  const [customersRes, activitiesRes, opportunitiesRes, ordersRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, primary_seller_id, wallet_status, is_active")
      .in("unit_id", unitIds)
      .eq("is_active", true),
    supabase
      .from("crm_activities")
      .select("id, customer_id, seller_profile_id, status, scheduled_at, activity_type, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("crm_opportunities")
      .select("id, customer_id, seller_profile_id, stage, title, updated_at")
      .eq("company_id", companyId)
      .not("stage", "in", "(fechado_ganho,fechado_perdido)"),
    supabase
      .from("orders")
      .select("customer_id, created_at")
      .in(
        "customer_id",
        [] // will filter after
      )
      .order("created_at", { ascending: false }),
  ]);

  const customers = customersRes.data || [];
  const activities = activitiesRes.data || [];
  const opportunities = opportunitiesRes.data || [];

  // Build activity maps
  const lastContactMap = new Map<string, string>();
  const lastReactivationMap = new Map<string, string>();
  const overdueWithoutAction = new Map<string, { id: string; scheduled_at: string; seller_profile_id: string | null }>();

  for (const a of activities) {
    if (a.customer_id && !lastContactMap.has(a.customer_id)) {
      lastContactMap.set(a.customer_id, a.created_at);
    }
    if (a.customer_id && a.activity_type === "reativacao" && !lastReactivationMap.has(a.customer_id)) {
      lastReactivationMap.set(a.customer_id, a.created_at);
    }
    // Overdue follow-ups without recent action (pending + past scheduled)
    if (
      a.status === "pendente" &&
      a.scheduled_at &&
      a.scheduled_at < new Date().toISOString() &&
      a.customer_id &&
      !overdueWithoutAction.has(a.customer_id)
    ) {
      overdueWithoutAction.set(a.customer_id, {
        id: a.id,
        scheduled_at: a.scheduled_at,
        seller_profile_id: a.seller_profile_id,
      });
    }
  }

  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;

  // 1. At-risk customers without recent contact (7 days)
  const atRiskCustomers = customers.filter((c) => c.wallet_status === "em_risco");
  for (const c of atRiskCustomers) {
    const lastContact = lastContactMap.get(c.id);
    const daysSinceContact = lastContact
      ? Math.floor((now - new Date(lastContact).getTime()) / dayMs)
      : 999;
    if (daysSinceContact >= 7) {
      suggestions.push({
        type: "at_risk_no_contact",
        customer_id: c.id,
        customer_name: c.full_name,
        seller_profile_id: c.primary_seller_id,
        reason: `Cliente em risco sem contato há ${daysSinceContact}d`,
        priority: daysSinceContact > 14 ? "urgente" : "alta",
        suggested_action: "Registrar contato comercial",
        days: daysSinceContact,
      });
    }
  }

  // 2. Inactive customers without reactivation attempt
  const inactiveCustomers = customers.filter((c) => c.wallet_status === "inativa");
  for (const c of inactiveCustomers) {
    const lastReact = lastReactivationMap.get(c.id);
    if (!lastReact) {
      suggestions.push({
        type: "inactive_no_reactivation",
        customer_id: c.id,
        customer_name: c.full_name,
        seller_profile_id: c.primary_seller_id,
        reason: "Cliente inativo sem tentativa de reativação",
        priority: "media",
        suggested_action: "Iniciar reativação",
      });
    }
  }

  // 3. Stale opportunities
  for (const opp of opportunities) {
    const daysSinceUpdate = Math.floor(
      (now - new Date(opp.updated_at).getTime()) / dayMs
    );
    if (daysSinceUpdate >= config.stale_opportunity_days) {
      const customer = customers.find((c) => c.id === opp.customer_id);
      suggestions.push({
        type: "stale_opportunity",
        customer_id: opp.customer_id,
        customer_name: customer?.full_name || "Cliente",
        seller_profile_id: opp.seller_profile_id,
        opportunity_id: opp.id,
        reason: `Oportunidade "${opp.title}" parada há ${daysSinceUpdate}d`,
        priority: daysSinceUpdate > 30 ? "urgente" : "alta",
        suggested_action: "Atualizar oportunidade",
        days: daysSinceUpdate,
      });
    }
  }

  // 4. Overdue follow-ups without action for 3+ days
  for (const [customerId, info] of overdueWithoutAction) {
    const daysSinceOverdue = Math.floor(
      (now - new Date(info.scheduled_at).getTime()) / dayMs
    );
    if (daysSinceOverdue >= 3) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        suggestions.push({
          type: "overdue_followup_no_action",
          customer_id: customerId,
          customer_name: customer.full_name,
          seller_profile_id: info.seller_profile_id,
          reason: `Follow-up vencido há ${daysSinceOverdue}d sem ação`,
          priority: daysSinceOverdue > 7 ? "urgente" : "alta",
          suggested_action: "Concluir ou reagendar follow-up",
          days: daysSinceOverdue,
        });
      }
    }
  }

  // 5. Customers without primary seller
  const noSeller = customers.filter((c) => !c.primary_seller_id);
  for (const c of noSeller.slice(0, 20)) {
    suggestions.push({
      type: "customer_no_seller",
      customer_id: c.id,
      customer_name: c.full_name,
      seller_profile_id: null,
      reason: "Cliente sem vendedor principal atribuído",
      priority: "media",
      suggested_action: "Atribuir vendedor",
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { urgente: 0, alta: 1, media: 2 };
  suggestions.sort(
    (a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
  );

  return suggestions;
}

// ─── Suggestion labels ───────────────────────────────────────

export const SUGGESTION_TYPE_LABELS: Record<SuggestionType, string> = {
  at_risk_no_contact: "Cliente em risco",
  inactive_no_reactivation: "Reativação pendente",
  stale_opportunity: "Oportunidade parada",
  overdue_followup_no_action: "Follow-up vencido",
  customer_no_seller: "Sem vendedor",
};

export const SUGGESTION_TYPE_ICONS: Record<SuggestionType, string> = {
  at_risk_no_contact: "alert-triangle",
  inactive_no_reactivation: "refresh-cw",
  stale_opportunity: "target",
  overdue_followup_no_action: "clock",
  customer_no_seller: "user-x",
};
