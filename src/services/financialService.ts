import { supabase } from "@/integrations/supabase/client";

// ─── Constants ───────────────────────────────────────────────────────

export const ENTRY_TYPES = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
  { value: "ajuste", label: "Ajuste" },
] as const;

export const ENTRY_STATUSES = [
  { value: "rascunho", label: "Rascunho", color: "text-muted-foreground" },
  { value: "lancado", label: "Lançado", color: "text-blue-400" },
  { value: "aprovado", label: "Aprovado", color: "text-emerald-400" },
  { value: "pago", label: "Pago", color: "text-emerald-500" },
  { value: "cancelado", label: "Cancelado", color: "text-destructive" },
] as const;

export const FINANCIAL_CATEGORIES = [
  { value: "pessoal_fixo", label: "Pessoal Fixo", entryType: "despesa" },
  { value: "pessoal_variavel", label: "Pessoal Variável", entryType: "despesa" },
  { value: "comercial", label: "Comercial", entryType: "despesa" },
  { value: "logistica", label: "Logística", entryType: "despesa" },
  { value: "frota", label: "Frota", entryType: "despesa" },
  { value: "infraestrutura", label: "Infraestrutura", entryType: "despesa" },
  { value: "administrativo", label: "Administrativo", entryType: "despesa" },
  { value: "marketing", label: "Marketing", entryType: "despesa" },
  { value: "suporte", label: "Suporte", entryType: "despesa" },
  { value: "financeiro", label: "Financeiro", entryType: "despesa" },
  { value: "operacional", label: "Operacional", entryType: "despesa" },
  { value: "receita_manual", label: "Receita Manual", entryType: "receita" },
  { value: "receita_pedido", label: "Receita de Pedido", entryType: "receita" },
  { value: "receita_arquivo", label: "Receita de Arquivo", entryType: "receita" },
  { value: "ajuste_positivo", label: "Ajuste Positivo", entryType: "ajuste" },
  { value: "ajuste_negativo", label: "Ajuste Negativo", entryType: "ajuste" },
] as const;

export const SUBCATEGORY_SUGGESTIONS = [
  "Salário", "Comissão", "Vale Transporte", "Vale Alimentação",
  "Ajuda de Custo", "Bônus", "Encargos", "INSS", "FGTS",
  "Combustível", "Manutenção Veicular", "Uniforme", "Papelaria",
  "Cartão de Visita", "Telefonia", "Internet", "Aluguel", "Energia",
  "Material de Escritório", "Equipamentos", "Software/Licenças",
  "Recebimento Manual", "Receita Operacional",
] as const;

// ─── Types ───────────────────────────────────────────────────────────

export interface FinancialEntryRow {
  id: string;
  franchise_profile_id: string | null;
  order_id: string | null;
  company_id: string | null;
  unit_id: string | null;
  employee_profile_id: string | null;
  seller_profile_id: string | null;
  scope: string;
  entry_type: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  amount: number;
  competency_date: string;
  reference_month: string | null;
  cost_center: string | null;
  is_recurring: boolean;
  created_by: string | null;
  created_at: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  attachment_url: string | null;
}

export interface FinancialFilters {
  companyId?: string;
  entryType?: string;
  category?: string;
  employeeProfileId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
}

export interface FinancialSummary {
  total_receitas: number;
  total_despesas: number;
  total_ajustes: number;
  saldo: number;
  count: number;
}

export interface ClosingPeriod {
  id: string;
  company_id: string;
  reference_month: string;
  status: string;
  closed_by: string | null;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Queries ─────────────────────────────────────────────────────────

export async function fetchFinancialEntries(filters?: FinancialFilters): Promise<FinancialEntryRow[]> {
  let query = supabase
    .from("financial_entries")
    .select("*")
    .order("competency_date", { ascending: false });

  if (filters?.companyId) query = query.eq("company_id", filters.companyId);
  if (filters?.entryType) query = query.eq("entry_type", filters.entryType);
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.employeeProfileId) query = query.eq("employee_profile_id", filters.employeeProfileId);
  if (filters?.startDate) query = query.gte("competency_date", filters.startDate);
  if (filters?.endDate) query = query.lte("competency_date", filters.endDate);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;

  let results = (data || []) as FinancialEntryRow[];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.description?.toLowerCase().includes(s) ||
        r.category?.toLowerCase().includes(s) ||
        r.subcategory?.toLowerCase().includes(s) ||
        r.cost_center?.toLowerCase().includes(s)
    );
  }

  return results;
}

export function calcFinancialSummary(entries: FinancialEntryRow[]): FinancialSummary {
  let total_receitas = 0;
  let total_despesas = 0;
  let total_ajustes = 0;

  for (const e of entries) {
    if (e.status === "cancelado") continue;
    const amt = Number(e.amount);
    if (e.entry_type === "receita") total_receitas += amt;
    else if (e.entry_type === "despesa") total_despesas += amt;
    else total_ajustes += amt;
  }

  return {
    total_receitas,
    total_despesas,
    total_ajustes,
    saldo: total_receitas - total_despesas + total_ajustes,
    count: entries.filter(e => e.status !== "cancelado").length,
  };
}

// ─── Closing Periods ─────────────────────────────────────────────────

export async function fetchClosingPeriods(companyId: string): Promise<ClosingPeriod[]> {
  const { data, error } = await supabase
    .from("financial_closing_periods")
    .select("*")
    .eq("company_id", companyId)
    .order("reference_month", { ascending: false });

  if (error) throw error;
  return (data || []) as ClosingPeriod[];
}

export async function isMonthClosed(companyId: string, referenceMonth: string): Promise<boolean> {
  const { data } = await supabase
    .from("financial_closing_periods")
    .select("status")
    .eq("company_id", companyId)
    .eq("reference_month", referenceMonth)
    .maybeSingle();

  return data?.status === "fechado";
}

export async function closeMonth(companyId: string, referenceMonth: string, userId: string, notes?: string): Promise<void> {
  const { error } = await supabase
    .from("financial_closing_periods")
    .upsert({
      company_id: companyId,
      reference_month: referenceMonth,
      status: "fechado",
      closed_by: userId,
      closed_at: new Date().toISOString(),
      notes: notes || null,
    }, { onConflict: "company_id,reference_month" });

  if (error) throw error;
}

export async function reopenMonth(companyId: string, referenceMonth: string): Promise<void> {
  const { error } = await supabase
    .from("financial_closing_periods")
    .update({ status: "aberto", closed_by: null, closed_at: null })
    .eq("company_id", companyId)
    .eq("reference_month", referenceMonth);

  if (error) throw error;
}

// ─── Mutations ───────────────────────────────────────────────────────

export async function createFinancialEntry(payload: {
  company_id: string;
  entry_type: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  amount: number;
  competency_date: string;
  reference_month?: string | null;
  scope?: string;
  franchise_profile_id?: string | null;
  order_id?: string | null;
  unit_id?: string | null;
  employee_profile_id?: string | null;
  seller_profile_id?: string | null;
  cost_center?: string | null;
  is_recurring?: boolean;
  created_by?: string | null;
  status?: string;
}): Promise<string> {
  const insertPayload = {
    ...payload,
    scope: payload.scope || "empresa",
    is_recurring: payload.is_recurring ?? false,
    status: payload.status || "lancado",
  };
  const { data, error } = await supabase
    .from("financial_entries")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateFinancialEntry(
  id: string,
  payload: Partial<{
    entry_type: string;
    category: string;
    subcategory: string | null;
    description: string | null;
    amount: number;
    competency_date: string;
    reference_month: string | null;
    employee_profile_id: string | null;
    seller_profile_id: string | null;
    cost_center: string | null;
    is_recurring: boolean;
    status: string;
    approved_by: string | null;
    approved_at: string | null;
  }>
): Promise<void> {
  const { error } = await supabase.from("financial_entries").update(payload).eq("id", id);
  if (error) throw error;
}

export async function approveFinancialEntry(id: string, userId: string): Promise<void> {
  await updateFinancialEntry(id, {
    status: "aprovado",
    approved_by: userId,
    approved_at: new Date().toISOString(),
  });
}

export async function markEntryAsPaid(id: string): Promise<void> {
  await updateFinancialEntry(id, { status: "pago" });
}

export async function cancelFinancialEntry(id: string): Promise<void> {
  await updateFinancialEntry(id, { status: "cancelado" });
}

export async function deleteFinancialEntry(id: string): Promise<void> {
  const { error } = await supabase.from("financial_entries").delete().eq("id", id);
  if (error) throw error;
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function getCategoryLabel(value: string): string {
  return FINANCIAL_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function getEntryTypeLabel(value: string): string {
  return ENTRY_TYPES.find((t) => t.value === value)?.label || value;
}

export function getStatusLabel(value: string): string {
  return ENTRY_STATUSES.find((s) => s.value === value)?.label || value;
}

export function getStatusColor(value: string): string {
  return ENTRY_STATUSES.find((s) => s.value === value)?.color || "text-muted-foreground";
}

export function getCategoriesForType(entryType: string) {
  if (!entryType) return FINANCIAL_CATEGORIES;
  return FINANCIAL_CATEGORIES.filter((c) => c.entryType === entryType);
}
