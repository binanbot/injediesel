/**
 * walletProfitabilityService.ts
 * Connects CRM wallet data with costs and revenue for per-seller
 * and per-portfolio profitability analysis.
 */

import { supabase } from "@/integrations/supabase/client";
import { EXCLUDED_ORDER_STATUSES } from "@/services/commercialEligibilityService";

// ─── Types ───────────────────────────────────────────────────

export interface WalletProfitability {
  seller_profile_id: string;
  employee_profile_id: string;
  display_name: string;
  department_name: string | null;
  // Wallet metrics
  total_customers: number;
  active_customers: number;
  at_risk_customers: number;
  inactive_customers: number;
  no_seller_customers: number;
  // Revenue from wallet customers
  wallet_revenue: number;
  // Activities
  total_activities: number;
  completed_activities: number;
  overdue_activities: number;
  completion_rate: number;
  // Cost
  employee_cost: number;
  // Calculated
  revenue_per_customer: number;
  cost_per_customer: number;
  wallet_margin: number;
  wallet_roi: number;
}

export interface CostCenterBreakdown {
  cost_center: string;
  total_amount: number;
  entry_count: number;
  categories: { category: string; amount: number }[];
}

export interface DepartmentCostBreakdown {
  department_id: string | null;
  department_name: string;
  employee_count: number;
  total_cost: number;
  cost_fixed: number;
  cost_variable: number;
}

// ─── Wallet Profitability ────────────────────────────────────

export async function fetchWalletProfitability(companyId: string): Promise<WalletProfitability[]> {
  // 1. Get sellers
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

  // 2. Get units and customers
  const { data: units } = await supabase
    .from("units")
    .select("id")
    .eq("company_id", companyId);
  const unitIds = (units || []).map((u) => u.id);

  const { data: customers } = await supabase
    .from("customers")
    .select("id, primary_seller_id, wallet_status, is_active")
    .in("unit_id", unitIds)
    .eq("is_active", true);

  // 3. Customer grouping by seller
  const customersBySeller = new Map<string, typeof customers>();
  for (const c of customers || []) {
    if (!c.primary_seller_id) continue;
    const list = customersBySeller.get(c.primary_seller_id) || [];
    list.push(c);
    customersBySeller.set(c.primary_seller_id, list);
  }

  // 4. Revenue from orders by seller
  const { data: orders } = await supabase
    .from("orders")
    .select("seller_profile_id, total_amount, status")
    .in("seller_profile_id", sellerIds);

  const revBySeller = new Map<string, number>();
  for (const o of orders || []) {
    if (EXCLUDED_ORDER_STATUSES.includes(o.status as any)) continue;
    if (!o.seller_profile_id) continue;
    revBySeller.set(o.seller_profile_id, (revBySeller.get(o.seller_profile_id) || 0) + Number(o.total_amount));
  }

  // 5. Activities by seller
  const { data: activities } = await supabase
    .from("crm_activities")
    .select("seller_profile_id, status, scheduled_at")
    .eq("company_id", companyId)
    .in("seller_profile_id", sellerIds);

  const actsBySeller = new Map<string, { total: number; completed: number; overdue: number }>();
  const now = new Date().toISOString();
  for (const a of activities || []) {
    if (!a.seller_profile_id) continue;
    const entry = actsBySeller.get(a.seller_profile_id) || { total: 0, completed: 0, overdue: 0 };
    entry.total++;
    if (a.status === "realizada") entry.completed++;
    if (a.status === "pendente" && a.scheduled_at && a.scheduled_at < now) entry.overdue++;
    actsBySeller.set(a.seller_profile_id, entry);
  }

  // 6. Employee costs
  const { data: costs } = await supabase
    .from("employee_costs")
    .select("employee_profile_id, amount_brl, is_recurring")
    .in("employee_profile_id", employeeIds)
    .eq("is_recurring", true);

  const costByEmp = new Map<string, number>();
  for (const c of costs || []) {
    costByEmp.set(c.employee_profile_id, (costByEmp.get(c.employee_profile_id) || 0) + Number(c.amount_brl));
  }

  // 7. Build result
  return companySellers.map((s: any) => {
    const ep = s.employee_profiles;
    const walletCustomers = customersBySeller.get(s.id) || [];
    const activeCount = walletCustomers.filter((c) => c.wallet_status === "ativa").length;
    const atRiskCount = walletCustomers.filter((c) => c.wallet_status === "em_risco").length;
    const inactiveCount = walletCustomers.filter((c) => c.wallet_status === "inativa").length;
    const revenue = revBySeller.get(s.id) || 0;
    const acts = actsBySeller.get(s.id) || { total: 0, completed: 0, overdue: 0 };
    const cost = costByEmp.get(s.employee_profile_id) || 0;
    const totalCust = walletCustomers.length;

    return {
      seller_profile_id: s.id,
      employee_profile_id: s.employee_profile_id,
      display_name: ep?.display_name || "Sem nome",
      department_name: ep?.departments?.name || null,
      total_customers: totalCust,
      active_customers: activeCount,
      at_risk_customers: atRiskCount,
      inactive_customers: inactiveCount,
      no_seller_customers: 0,
      wallet_revenue: revenue,
      total_activities: acts.total,
      completed_activities: acts.completed,
      overdue_activities: acts.overdue,
      completion_rate: acts.total > 0 ? (acts.completed / acts.total) * 100 : 0,
      employee_cost: cost,
      revenue_per_customer: totalCust > 0 ? revenue / totalCust : 0,
      cost_per_customer: totalCust > 0 ? cost / totalCust : 0,
      wallet_margin: revenue - cost,
      wallet_roi: cost > 0 ? (revenue / cost) * 100 : 0,
    };
  }).sort((a, b) => b.wallet_margin - a.wallet_margin);
}

// ─── Cost Center Breakdown ───────────────────────────────────

export async function fetchCostCenterBreakdown(companyId: string): Promise<CostCenterBreakdown[]> {
  const { data: entries } = await supabase
    .from("financial_entries")
    .select("cost_center, category, amount, status")
    .eq("company_id", companyId)
    .neq("status", "cancelado");

  if (!entries || entries.length === 0) return [];

  const map = new Map<string, { total: number; count: number; cats: Map<string, number> }>();

  for (const e of entries) {
    const cc = e.cost_center || "Sem centro de custo";
    const entry = map.get(cc) || { total: 0, count: 0, cats: new Map() };
    entry.total += Number(e.amount);
    entry.count++;
    entry.cats.set(e.category, (entry.cats.get(e.category) || 0) + Number(e.amount));
    map.set(cc, entry);
  }

  return Array.from(map.entries())
    .map(([cc, v]) => ({
      cost_center: cc,
      total_amount: v.total,
      entry_count: v.count,
      categories: Array.from(v.cats.entries())
        .map(([cat, amt]) => ({ category: cat, amount: amt }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
}

// ─── Department Cost Breakdown ───────────────────────────────

export async function fetchDepartmentCostBreakdown(companyId: string): Promise<DepartmentCostBreakdown[]> {
  const { data: employees } = await supabase
    .from("employee_profiles")
    .select(`
      id, display_name, department_id, is_active,
      departments ( id, name )
    `)
    .eq("company_id", companyId)
    .eq("is_active", true);

  if (!employees || employees.length === 0) return [];

  const empIds = employees.map((e) => e.id);

  const { data: costs } = await supabase
    .from("employee_costs")
    .select("employee_profile_id, amount_brl, is_recurring")
    .in("employee_profile_id", empIds);

  const costByEmp = new Map<string, { fixed: number; variable: number }>();
  for (const c of costs || []) {
    const entry = costByEmp.get(c.employee_profile_id) || { fixed: 0, variable: 0 };
    if (c.is_recurring) entry.fixed += Number(c.amount_brl);
    else entry.variable += Number(c.amount_brl);
    costByEmp.set(c.employee_profile_id, entry);
  }

  const deptMap = new Map<string, { name: string; empCount: number; fixed: number; variable: number }>();

  for (const emp of employees) {
    const dept = (emp as any).departments;
    const deptKey = dept?.id || "sem_departamento";
    const deptName = dept?.name || "Sem departamento";
    const entry = deptMap.get(deptKey) || { name: deptName, empCount: 0, fixed: 0, variable: 0 };
    entry.empCount++;
    const empCost = costByEmp.get(emp.id) || { fixed: 0, variable: 0 };
    entry.fixed += empCost.fixed;
    entry.variable += empCost.variable;
    deptMap.set(deptKey, entry);
  }

  return Array.from(deptMap.entries())
    .map(([id, v]) => ({
      department_id: id === "sem_departamento" ? null : id,
      department_name: v.name,
      employee_count: v.empCount,
      total_cost: v.fixed + v.variable,
      cost_fixed: v.fixed,
      cost_variable: v.variable,
    }))
    .sort((a, b) => b.total_cost - a.total_cost);
}
