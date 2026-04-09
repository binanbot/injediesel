/**
 * operationalAlertsService.ts
 * Consolidates operational alerts from CRM, Financial, and Commercial layers.
 * Used in /admin dashboards, /master and /ceo for actionable intelligence.
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────

export type AlertSeverity = "danger" | "warning" | "info";
export type AlertCategory = "crm" | "financeiro" | "comercial" | "operacional";

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  count?: number;
  actionLabel?: string;
  actionRoute?: string;
}

// ─── CRM Alerts ──────────────────────────────────────────────

export async function generateCrmAlerts(companyId: string): Promise<OperationalAlert[]> {
  const alerts: OperationalAlert[] = [];

  // 1. Overdue follow-ups
  const { data: overdueActivities } = await supabase
    .from("crm_activities")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "pendente")
    .lt("scheduled_at", new Date().toISOString());

  const overdueCount = overdueActivities?.length || 0;
  if (overdueCount > 0) {
    alerts.push({
      id: "crm_overdue_followups",
      severity: overdueCount > 10 ? "danger" : "warning",
      category: "crm",
      title: `${overdueCount} follow-up(s) atrasado(s)`,
      description: "Atividades pendentes com data agendada no passado",
      count: overdueCount,
      actionLabel: "Ver atividades",
      actionRoute: "/admin/crm",
    });
  }

  // 2. At-risk customers (wallet_status = em_risco)
  const { data: units } = await supabase
    .from("units")
    .select("id")
    .eq("company_id", companyId);
  const unitIds = (units || []).map((u) => u.id);

  if (unitIds.length > 0) {
    const { data: atRiskCustomers } = await supabase
      .from("customers")
      .select("id")
      .in("unit_id", unitIds)
      .eq("is_active", true)
      .eq("wallet_status", "em_risco");

    const atRiskCount = atRiskCustomers?.length || 0;
    if (atRiskCount > 0) {
      alerts.push({
        id: "crm_at_risk_customers",
        severity: atRiskCount > 20 ? "danger" : "warning",
        category: "crm",
        title: `${atRiskCount} cliente(s) em risco de inatividade`,
        description: "Clientes sem compras entre 45 e 90 dias",
        count: atRiskCount,
        actionLabel: "Ver carteira",
        actionRoute: "/admin/crm",
      });
    }

    // 3. Customers without primary seller
    const { data: noSeller } = await supabase
      .from("customers")
      .select("id")
      .in("unit_id", unitIds)
      .eq("is_active", true)
      .is("primary_seller_id", null);

    const noSellerCount = noSeller?.length || 0;
    if (noSellerCount > 0) {
      alerts.push({
        id: "crm_no_seller",
        severity: noSellerCount > 10 ? "warning" : "info",
        category: "crm",
        title: `${noSellerCount} cliente(s) sem vendedor principal`,
        description: "Clientes ativos sem responsável comercial definido",
        count: noSellerCount,
        actionLabel: "Atribuir vendedores",
        actionRoute: "/admin/crm",
      });
    }

    // 4. Inactive customers
    const { data: inactiveCustomers } = await supabase
      .from("customers")
      .select("id")
      .in("unit_id", unitIds)
      .eq("is_active", true)
      .eq("wallet_status", "inativa");

    const inactiveCount = inactiveCustomers?.length || 0;
    if (inactiveCount > 0) {
      alerts.push({
        id: "crm_inactive_customers",
        severity: "info",
        category: "crm",
        title: `${inactiveCount} cliente(s) inativo(s)`,
        description: "Clientes sem compras há mais de 90 dias — candidatos a reativação",
        count: inactiveCount,
        actionLabel: "Planejar reativação",
        actionRoute: "/admin/crm",
      });
    }
  }

  return alerts;
}

// ─── Financial Alerts ────────────────────────────────────────

export async function generateFinancialAlerts(companyId: string): Promise<OperationalAlert[]> {
  const alerts: OperationalAlert[] = [];

  // 1. Drafts older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: oldDrafts } = await supabase
    .from("financial_entries")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "rascunho")
    .lt("created_at", sevenDaysAgo.toISOString());

  const draftCount = oldDrafts?.length || 0;
  if (draftCount > 0) {
    alerts.push({
      id: "fin_old_drafts",
      severity: draftCount > 5 ? "warning" : "info",
      category: "financeiro",
      title: `${draftCount} rascunho(s) pendente(s) há +7 dias`,
      description: "Lançamentos em rascunho que precisam ser revisados",
      count: draftCount,
      actionLabel: "Revisar rascunhos",
      actionRoute: "/admin/financeiro",
    });
  }

  // 2. Pending financial closing for current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Check if previous month is still open
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: prevClosing } = await supabase
    .from("financial_closing_periods")
    .select("status")
    .eq("company_id", companyId)
    .eq("reference_month", prevMonth)
    .maybeSingle();

  if (!prevClosing || prevClosing.status !== "fechado") {
    // Only alert if we're past day 5 of the month
    if (now.getDate() > 5) {
      alerts.push({
        id: "fin_pending_closing",
        severity: now.getDate() > 15 ? "danger" : "warning",
        category: "financeiro",
        title: "Fechamento do mês anterior pendente",
        description: `O mês ${prevDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} ainda não foi fechado`,
        actionLabel: "Fechar mês",
        actionRoute: "/admin/financeiro",
      });
    }
  }

  // 3. Entries awaiting approval
  const { data: pendingApproval } = await supabase
    .from("financial_entries")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "lancado")
    .eq("entry_type", "despesa");

  const approvalCount = pendingApproval?.length || 0;
  if (approvalCount > 10) {
    alerts.push({
      id: "fin_pending_approval",
      severity: "info",
      category: "financeiro",
      title: `${approvalCount} despesa(s) aguardando aprovação`,
      description: "Lançamentos com status 'lançado' que podem ser aprovados",
      count: approvalCount,
      actionLabel: "Aprovar despesas",
      actionRoute: "/admin/financeiro",
    });
  }

  return alerts;
}

// ─── Commercial Alerts ───────────────────────────────────────

export async function generateCommercialAlerts(companyId: string): Promise<OperationalAlert[]> {
  const alerts: OperationalAlert[] = [];

  // 1. High-priority overdue activities
  const { data: urgentOverdue } = await supabase
    .from("crm_activities")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "pendente")
    .in("priority", ["alta", "urgente"])
    .lt("scheduled_at", new Date().toISOString());

  const urgentCount = urgentOverdue?.length || 0;
  if (urgentCount > 0) {
    alerts.push({
      id: "com_urgent_overdue",
      severity: "danger",
      category: "comercial",
      title: `${urgentCount} atividade(s) urgente(s) atrasada(s)`,
      description: "Follow-ups de alta prioridade ou urgentes vencidos",
      count: urgentCount,
      actionLabel: "Resolver agora",
      actionRoute: "/admin/crm",
    });
  }

  // 2. Open opportunities nearing stale (no update in 15+ days)
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const { data: staleOpps } = await supabase
    .from("crm_opportunities")
    .select("id")
    .eq("company_id", companyId)
    .not("stage", "in", "(fechado_ganho,fechado_perdido)")
    .lt("updated_at", fifteenDaysAgo.toISOString());

  const staleCount = staleOpps?.length || 0;
  if (staleCount > 0) {
    alerts.push({
      id: "com_stale_opportunities",
      severity: "warning",
      category: "comercial",
      title: `${staleCount} oportunidade(s) parada(s) há +15 dias`,
      description: "Oportunidades abertas sem atualização recente",
      count: staleCount,
      actionLabel: "Revisar funil",
      actionRoute: "/admin/crm",
    });
  }

  return alerts;
}

// ─── Consolidated ────────────────────────────────────────────

export async function fetchAllOperationalAlerts(companyId: string): Promise<OperationalAlert[]> {
  const [crmAlerts, finAlerts, comAlerts] = await Promise.all([
    generateCrmAlerts(companyId),
    generateFinancialAlerts(companyId),
    generateCommercialAlerts(companyId),
  ]);

  // Sort by severity: danger first, then warning, then info
  const severityOrder: Record<AlertSeverity, number> = { danger: 0, warning: 1, info: 2 };
  return [...crmAlerts, ...finAlerts, ...comAlerts].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

// ─── Alert summary for dashboards ────────────────────────────

export function calcAlertSummary(alerts: OperationalAlert[]) {
  return {
    total: alerts.length,
    danger: alerts.filter((a) => a.severity === "danger").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
    byCategory: {
      crm: alerts.filter((a) => a.category === "crm").length,
      financeiro: alerts.filter((a) => a.category === "financeiro").length,
      comercial: alerts.filter((a) => a.category === "comercial").length,
      operacional: alerts.filter((a) => a.category === "operacional").length,
    },
  };
}
