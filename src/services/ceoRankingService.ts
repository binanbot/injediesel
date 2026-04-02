import { supabase } from "@/integrations/supabase/client";

export interface RankedUnit {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  revenue: number;
  orders: number;
  files: number;
}

export interface RankedItem {
  name: string;
  value: number;
  count: number;
}

type Filters = {
  startDate?: string;
  endDate?: string;
  companyId?: string;
};

const EXCLUDED = ["cancelado", "reembolsado"];

async function getUnitIds(companyId?: string): Promise<string[] | null> {
  if (!companyId) return null; // null = all units
  const { data } = await supabase.from("units").select("id").eq("company_id", companyId);
  return (data || []).map((u) => u.id);
}

export async function getTopUnits(filters?: Filters): Promise<RankedUnit[]> {
  const scopedIds = await getUnitIds(filters?.companyId);
  if (scopedIds && scopedIds.length === 0) return [];

  // Orders
  let oq = supabase
    .from("orders")
    .select("total_amount, unit_id")
    .not("status", "in", `("${EXCLUDED.join('","')}")`);
  if (filters?.startDate) oq = oq.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) oq = oq.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: orders } = await oq;

  // Files
  let fq = supabase.from("received_files").select("valor_brl, unit_id");
  if (scopedIds) fq = fq.in("unit_id", scopedIds);
  if (filters?.startDate) fq = fq.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) fq = fq.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: files } = await fq;

  // Units metadata
  let uq = supabase.from("units").select("id, name, city, state").eq("is_active", true);
  if (scopedIds) uq = uq.in("id", scopedIds);
  const { data: units } = await uq;

  const map = new Map<string, RankedUnit>();
  (units || []).forEach((u) =>
    map.set(u.id, { id: u.id, name: u.name, city: u.city, state: u.state, revenue: 0, orders: 0, files: 0 })
  );

  (orders || []).forEach((o: any) => {
    if (scopedIds && !scopedIds.includes(o.unit_id)) return;
    const u = map.get(o.unit_id);
    if (u) { u.revenue += Number(o.total_amount || 0); u.orders += 1; }
  });

  (files || []).forEach((f: any) => {
    const u = map.get(f.unit_id);
    if (u) { u.revenue += Number(f.valor_brl || 0); u.files += 1; }
  });

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
}

export async function getTopClients(filters?: Filters): Promise<RankedItem[]> {
  const scopedIds = await getUnitIds(filters?.companyId);
  if (scopedIds && scopedIds.length === 0) return [];

  let q = supabase.from("received_files").select("valor_brl, customer_id");
  if (scopedIds) q = q.in("unit_id", scopedIds);
  if (filters?.startDate) q = q.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) q = q.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data } = await q;

  const map = new Map<string, { value: number; count: number }>();
  (data || []).forEach((f: any) => {
    if (!f.customer_id) return;
    const cur = map.get(f.customer_id) || { value: 0, count: 0 };
    cur.value += Number(f.valor_brl || 0);
    cur.count += 1;
    map.set(f.customer_id, cur);
  });

  const topIds = Array.from(map.entries()).sort((a, b) => b[1].value - a[1].value).slice(0, 10).map(([id]) => id);
  if (topIds.length === 0) return [];

  const { data: names } = await supabase.from("customers").select("id, full_name").in("id", topIds);
  const nameMap = new Map((names || []).map((c: any) => [c.id, c.full_name]));

  return topIds.map((id) => ({
    name: nameMap.get(id) || "Cliente",
    value: map.get(id)!.value,
    count: map.get(id)!.count,
  }));
}

export async function getTopProducts(filters?: Filters): Promise<RankedItem[]> {
  const scopedIds = await getUnitIds(filters?.companyId);

  let oq = supabase
    .from("orders")
    .select("id, unit_id")
    .not("status", "in", `("${EXCLUDED.join('","')}")`);
  if (filters?.startDate) oq = oq.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) oq = oq.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data: orders } = await oq;

  const validOrderIds = (orders || [])
    .filter((o: any) => !scopedIds || scopedIds.includes(o.unit_id))
    .map((o: any) => o.id);

  if (validOrderIds.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, line_total, quantity")
    .in("order_id", validOrderIds);

  const map = new Map<string, { value: number; count: number }>();
  (items || []).forEach((i: any) => {
    const cur = map.get(i.product_name) || { value: 0, count: 0 };
    cur.value += Number(i.line_total || 0);
    cur.count += Number(i.quantity || 0);
    map.set(i.product_name, cur);
  });

  return Array.from(map.entries())
    .map(([name, { value, count }]) => ({ name, value, count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export async function getCategoryBreakdown(filters?: Filters): Promise<RankedItem[]> {
  const scopedIds = await getUnitIds(filters?.companyId);
  if (scopedIds && scopedIds.length === 0) return [];

  let q = supabase.from("received_files").select("valor_brl, servico");
  if (scopedIds) q = q.in("unit_id", scopedIds);
  if (filters?.startDate) q = q.gte("created_at", `${filters.startDate}T00:00:00`);
  if (filters?.endDate) q = q.lte("created_at", `${filters.endDate}T23:59:59`);
  const { data } = await q;

  const map = new Map<string, { value: number; count: number }>();
  (data || []).forEach((f: any) => {
    const key = f.servico || "Outros";
    const cur = map.get(key) || { value: 0, count: 0 };
    cur.value += Number(f.valor_brl || 0);
    cur.count += 1;
    map.set(key, cur);
  });

  return Array.from(map.entries())
    .map(([name, { value, count }]) => ({ name, value, count }))
    .sort((a, b) => b.value - a.value);
}
