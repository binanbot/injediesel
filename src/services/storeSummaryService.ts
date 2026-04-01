import { supabase } from '@/integrations/supabase/client'

type Filters = {
  startDate?: string
  endDate?: string
}

type StoreSummary = {
  totalRevenue: number
  totalOrders: number
  averageTicket: number
  totalItems: number
}

export async function getStoreSummary(filters?: Filters): Promise<StoreSummary> {
  let query = supabase
    .from('orders')
    .select('id, total_amount, items_count, status, created_at')
    .not('status', 'in', '("cancelado","reembolsado")')

  if (filters?.startDate) {
    query = query.gte('created_at', `${filters.startDate}T00:00:00`)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', `${filters.endDate}T23:59:59`)
  }

  const { data, error } = await query
  if (error) throw error

  const orders = data || []
  const totalRevenue = orders.reduce((s, o: any) => s + Number(o.total_amount || 0), 0)
  const totalItems = orders.reduce((s, o: any) => s + Number(o.items_count || 0), 0)
  const totalOrders = orders.length
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return { totalRevenue, totalOrders, averageTicket, totalItems }
}

export type { StoreSummary, Filters as StoreSummaryFilters }
