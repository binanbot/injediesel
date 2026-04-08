import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────

export const EMPLOYEE_COST_TYPES = [
  { value: "salario_base", label: "Salário Base" },
  { value: "comissao_estimada", label: "Comissão Estimada" },
  { value: "vale_transporte", label: "Vale Transporte" },
  { value: "vale_alimentacao", label: "Vale Alimentação" },
  { value: "ajuda_custo", label: "Ajuda de Custo" },
  { value: "bonus", label: "Bônus" },
  { value: "encargos", label: "Encargos" },
  { value: "outro", label: "Outro" },
] as const;

export const EMPLOYEE_COST_CATEGORIES = [
  { value: "pessoal_fixo", label: "Pessoal Fixo" },
  { value: "pessoal_variavel", label: "Pessoal Variável" },
] as const;

export const OPERATIONAL_COST_CATEGORIES = [
  { value: "comercial", label: "Comercial" },
  { value: "logistica", label: "Logística" },
  { value: "frota", label: "Frota" },
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "administrativo", label: "Administrativo" },
  { value: "marketing", label: "Marketing" },
  { value: "suporte", label: "Suporte" },
  { value: "financeiro", label: "Financeiro" },
] as const;

export interface EmployeeCostRow {
  id: string;
  employee_profile_id: string;
  company_id: string;
  cost_type: string;
  cost_category: string;
  label: string | null;
  amount_brl: number;
  is_recurring: boolean;
  effective_from: string;
  effective_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperationalCostRow {
  id: string;
  company_id: string;
  cost_category: string;
  description: string;
  amount_brl: number;
  is_recurring: boolean;
  competency_month: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Employee Costs ──────────────────────────────────────────────────

export async function fetchEmployeeCosts(employeeProfileId: string): Promise<EmployeeCostRow[]> {
  const { data, error } = await supabase
    .from("employee_costs")
    .select("*")
    .eq("employee_profile_id", employeeProfileId)
    .order("cost_type");
  if (error) throw error;
  return (data || []) as EmployeeCostRow[];
}

export async function fetchEmployeeCostsByCompany(companyId: string): Promise<EmployeeCostRow[]> {
  const { data, error } = await supabase
    .from("employee_costs")
    .select("*")
    .eq("company_id", companyId)
    .order("employee_profile_id");
  if (error) throw error;
  return (data || []) as EmployeeCostRow[];
}

export async function upsertEmployeeCost(payload: {
  id?: string;
  employee_profile_id: string;
  company_id: string;
  cost_type: string;
  cost_category: string;
  label?: string | null;
  amount_brl: number;
  is_recurring?: boolean;
  effective_from?: string;
  effective_until?: string | null;
  notes?: string | null;
}): Promise<string> {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("employee_costs").update(rest).eq("id", id);
    if (error) throw error;
    return id;
  } else {
    const { data, error } = await supabase.from("employee_costs").insert(payload).select("id").single();
    if (error) throw error;
    return data.id;
  }
}

export async function deleteEmployeeCost(id: string): Promise<void> {
  const { error } = await supabase.from("employee_costs").delete().eq("id", id);
  if (error) throw error;
}

/** Sum all active/recurring costs for one employee in the current period */
export function calcEmployeeTotalMonthlyCost(costs: EmployeeCostRow[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return costs
    .filter((c) => {
      if (!c.is_recurring) return false;
      if (c.effective_from > today) return false;
      if (c.effective_until && c.effective_until < today) return false;
      return true;
    })
    .reduce((sum, c) => sum + Number(c.amount_brl), 0);
}

// ─── Operational Costs ───────────────────────────────────────────────

export async function fetchOperationalCosts(companyId: string, month?: string): Promise<OperationalCostRow[]> {
  let query = supabase
    .from("operational_costs")
    .select("*")
    .eq("company_id", companyId)
    .order("cost_category");
  if (month) query = query.eq("competency_month", month);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as OperationalCostRow[];
}

export async function upsertOperationalCost(payload: {
  id?: string;
  company_id: string;
  cost_category: string;
  description: string;
  amount_brl: number;
  is_recurring?: boolean;
  competency_month?: string;
  notes?: string | null;
}): Promise<string> {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await supabase.from("operational_costs").update(rest).eq("id", id);
    if (error) throw error;
    return id;
  } else {
    const { data, error } = await supabase.from("operational_costs").insert(payload).select("id").single();
    if (error) throw error;
    return data.id;
  }
}

export async function deleteOperationalCost(id: string): Promise<void> {
  const { error } = await supabase.from("operational_costs").delete().eq("id", id);
  if (error) throw error;
}

/** Sum operational costs for a company in a given month */
export function calcOperationalTotal(costs: OperationalCostRow[]): number {
  return costs.reduce((sum, c) => sum + Number(c.amount_brl), 0);
}
