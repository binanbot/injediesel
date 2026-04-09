/**
 * profitabilityService.ts
 * Aggregates commercial revenue, employee costs, operational costs,
 * and financial entries to produce profitability metrics.
 */

import { supabase } from "@/integrations/supabase/client";
import { EXCLUDED_ORDER_STATUSES } from "@/services/commercialEligibilityService";

// ─── Types ───────────────────────────────────────────────────

export interface SellerProfitability {
  seller_profile_id: string;
  employee_profile_id: string;
  display_name: string;
  department_name: string | null;
  revenue_orders: number;
  revenue_files: number;
  revenue_total: number;
  commission_paid: number;
  cost_fixed: number;
  cost_variable: number;
  cost_total: number;
  margin: number;
  roi: number; // (revenue / cost) * 100
}

export interface DepartmentProfitability {
  department_id: string | null;
  department_name: string;
  employee_count: number;
  revenue_total: number;
  cost_total: number;
  margin: number;
}

export interface CompanyProfitability {
  company_id: string;
  company_name: string;
  revenue_orders: number;
  revenue_files: number;
  revenue_extra: number; // financial_entries receita
  revenue_total: number;
  cost_personnel: number;
  cost_operational: number;
  cost_financial: number; // financial_entries despesa
  cost_total: number;
  margin: number;
  margin_pct: number;
  efficiency: number; // revenue per R$ of cost
}

// ─── Seller profitability ────────────────────────────────────

export async function fetchSellerProfitability(companyId: string): Promise<SellerProfitability[]> {
  // 1. Get sellers with employee info
  const { data: sellers } = await supabase
    .from("seller_profiles")
    .select(`
      id, employee_profile_id, is_active,
      employee_profiles!seller_profiles_employee_profile_id_fkey (
        id, display_name, company_id, is_active,
        departments ( name )
      )
    `)
    .eq("is_active", true);

  const companySellers = (sellers || []).filter((s: any) => {
    const ep = s.employee_profiles;
    return ep && ep.company_id === companyId && ep.is_active;
  });

  if (companySellers.length === 0) return [];

  const sellerIds = companySellers.map((s: any) => s.id);
  const employeeIds = companySellers.map((s: any) => s.employee_profile_id);

  // 2. Revenue from orders
  const { data: orders } = await supabase
    .from("orders")
    .select("seller_profile_id, total_amount, status")
    .in("seller_profile_id", sellerIds);

  const orderRevBySeller = new Map<string, number>();
  for (const o of orders || []) {
    if (EXCLUDED_ORDER_STATUSES.includes(o.status as any)) continue;
    const cur = orderRevBySeller.get(o.seller_profile_id!) || 0;
    orderRevBySeller.set(o.seller_profile_id!, cur + Number(o.total_amount));
  }

  // 3. Revenue from files
  const { data: files } = await supabase
    .from("received_files")
    .select("seller_profile_id, valor_brl")
    .in("seller_profile_id", sellerIds);

  const fileRevBySeller = new Map<string, number>();
  for (const f of files || []) {
    if (!f.seller_profile_id || !f.valor_brl) continue;
    const cur = fileRevBySeller.get(f.seller_profile_id) || 0;
    fileRevBySeller.set(f.seller_profile_id, cur + Number(f.valor_brl));
  }

  // 4. Commission paid
  const { data: closings } = await supabase
    .from("commission_closings")
    .select("seller_profile_id, realized_commission, status")
    .in("seller_profile_id", sellerIds)
    .eq("status", "paga");

  const commBySeller = new Map<string, number>();
  for (const c of closings || []) {
    const cur = commBySeller.get(c.seller_profile_id) || 0;
    commBySeller.set(c.seller_profile_id, cur + Number(c.realized_commission));
  }

  // 5. Employee costs
  const { data: costs } = await supabase
    .from("employee_costs")
    .select("employee_profile_id, amount_brl, is_recurring")
    .in("employee_profile_id", employeeIds);

  const costFixedByEmp = new Map<string, number>();
  const costVarByEmp = new Map<string, number>();
  for (const c of costs || []) {
    const map = c.is_recurring ? costFixedByEmp : costVarByEmp;
    const cur = map.get(c.employee_profile_id) || 0;
    map.set(c.employee_profile_id, cur + Number(c.amount_brl));
  }

  // 6. Build result
  return companySellers.map((s: any) => {
    const ep = s.employee_profiles;
    const revOrders = orderRevBySeller.get(s.id) || 0;
    const revFiles = fileRevBySeller.get(s.id) || 0;
    const revTotal = revOrders + revFiles;
    const commission = commBySeller.get(s.id) || 0;
    const costFixed = costFixedByEmp.get(s.employee_profile_id) || 0;
    const costVar = costVarByEmp.get(s.employee_profile_id) || 0;
    const costTotal = costFixed + costVar + commission;
    const margin = revTotal - costTotal;
    const roi = costTotal > 0 ? (revTotal / costTotal) * 100 : 0;

    return {
      seller_profile_id: s.id,
      employee_profile_id: s.employee_profile_id,
      display_name: ep?.display_name || "Sem nome",
      department_name: ep?.departments?.name || null,
      revenue_orders: revOrders,
      revenue_files: revFiles,
      revenue_total: revTotal,
      commission_paid: commission,
      cost_fixed: costFixed,
      cost_variable: costVar,
      cost_total: costTotal,
      margin,
      roi,
    };
  }).sort((a, b) => b.margin - a.margin);
}

// ─── Department profitability ────────────────────────────────

export function calcDepartmentProfitability(sellers: SellerProfitability[]): DepartmentProfitability[] {
  const deptMap = new Map<string, { name: string; sellers: SellerProfitability[] }>();

  for (const s of sellers) {
    const key = s.department_name || "Sem departamento";
    if (!deptMap.has(key)) deptMap.set(key, { name: key, sellers: [] });
    deptMap.get(key)!.sellers.push(s);
  }

  return Array.from(deptMap.entries()).map(([_, v]) => ({
    department_id: null,
    department_name: v.name,
    employee_count: v.sellers.length,
    revenue_total: v.sellers.reduce((s, x) => s + x.revenue_total, 0),
    cost_total: v.sellers.reduce((s, x) => s + x.cost_total, 0),
    margin: v.sellers.reduce((s, x) => s + x.margin, 0),
  })).sort((a, b) => b.margin - a.margin);
}

// ─── Company profitability ───────────────────────────────────

export async function fetchCompanyProfitability(): Promise<CompanyProfitability[]> {
  // 1. Companies
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("is_active", true);

  if (!companies || companies.length === 0) return [];

  const results: CompanyProfitability[] = [];

  for (const company of companies) {
    // Units for this company
    const { data: units } = await supabase
      .from("units")
      .select("id")
      .eq("company_id", company.id);
    const unitIds = (units || []).map((u) => u.id);

    // Revenue: orders
    let revOrders = 0;
    if (unitIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, status")
        .in("unit_id", unitIds);
      for (const o of orders || []) {
        if (!EXCLUDED_ORDER_STATUSES.includes(o.status as any)) {
          revOrders += Number(o.total_amount);
        }
      }
    }

    // Revenue: files
    let revFiles = 0;
    if (unitIds.length > 0) {
      const { data: files } = await supabase
        .from("received_files")
        .select("valor_brl")
        .in("unit_id", unitIds);
      for (const f of files || []) {
        revFiles += Number(f.valor_brl || 0);
      }
    }

    // Financial entries
    const { data: finEntries } = await supabase
      .from("financial_entries")
      .select("entry_type, amount")
      .eq("company_id", company.id);

    let revExtra = 0;
    let costFinancial = 0;
    for (const e of finEntries || []) {
      if (e.entry_type === "receita") revExtra += Number(e.amount);
      else if (e.entry_type === "despesa") costFinancial += Number(e.amount);
    }

    // Employee costs
    const { data: empCosts } = await supabase
      .from("employee_costs")
      .select("amount_brl")
      .eq("company_id", company.id);
    const costPersonnel = (empCosts || []).reduce((s, c) => s + Number(c.amount_brl), 0);

    // Operational costs
    const { data: opCosts } = await supabase
      .from("operational_costs")
      .select("amount_brl")
      .eq("company_id", company.id);
    const costOp = (opCosts || []).reduce((s, c) => s + Number(c.amount_brl), 0);

    const revTotal = revOrders + revFiles + revExtra;
    const costTotal = costPersonnel + costOp + costFinancial;
    const margin = revTotal - costTotal;
    const marginPct = revTotal > 0 ? (margin / revTotal) * 100 : 0;
    const efficiency = costTotal > 0 ? revTotal / costTotal : 0;

    results.push({
      company_id: company.id,
      company_name: company.name,
      revenue_orders: revOrders,
      revenue_files: revFiles,
      revenue_extra: revExtra,
      revenue_total: revTotal,
      cost_personnel: costPersonnel,
      cost_operational: costOp,
      cost_financial: costFinancial,
      cost_total: costTotal,
      margin,
      margin_pct: marginPct,
      efficiency,
    });
  }

  return results.sort((a, b) => b.margin - a.margin);
}

// ─── Alert helpers ───────────────────────────────────────────

export interface ProfitabilityAlert {
  type: "danger" | "warning" | "info";
  title: string;
  description: string;
}

export function generateSellerAlerts(sellers: SellerProfitability[]): ProfitabilityAlert[] {
  const alerts: ProfitabilityAlert[] = [];

  const negative = sellers.filter((s) => s.margin < 0);
  if (negative.length > 0) {
    alerts.push({
      type: "danger",
      title: `${negative.length} colaborador(es) com margem negativa`,
      description: negative.map((s) => s.display_name).join(", "),
    });
  }

  const lowRoi = sellers.filter((s) => s.roi > 0 && s.roi < 150 && s.cost_total > 0);
  if (lowRoi.length > 0) {
    alerts.push({
      type: "warning",
      title: `${lowRoi.length} colaborador(es) com ROI abaixo de 150%`,
      description: lowRoi.map((s) => `${s.display_name} (${s.roi.toFixed(0)}%)`).join(", "),
    });
  }

  const highCostLowRev = sellers.filter((s) => s.cost_total > 0 && s.revenue_total < s.cost_total * 0.5);
  if (highCostLowRev.length > 0) {
    alerts.push({
      type: "danger",
      title: `${highCostLowRev.length} com custo alto e baixa geração`,
      description: "Faturamento abaixo de 50% do custo total",
    });
  }

  return alerts;
}

export function generateCompanyAlerts(companies: CompanyProfitability[]): ProfitabilityAlert[] {
  const alerts: ProfitabilityAlert[] = [];

  for (const c of companies) {
    if (c.margin_pct < 20 && c.revenue_total > 0) {
      alerts.push({
        type: "warning",
        title: `${c.company_name}: margem abaixo de 20%`,
        description: `Margem atual: ${c.margin_pct.toFixed(1)}%`,
      });
    }
    if (c.margin < 0) {
      alerts.push({
        type: "danger",
        title: `${c.company_name}: resultado negativo`,
        description: `Margem: ${c.margin.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      });
    }
  }

  return alerts;
}
