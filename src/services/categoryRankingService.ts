import { supabase } from '@/integrations/supabase/client'

type Filters = {
  startDate?: string
  endDate?: string
  franchiseProfileId?: string
}

type CategoryRanking = {
  category: string
  total_quantity: number
  total_revenue: number
  orders_count: number
}

export async function getCategoryRanking(filters?: Filters) {
  let query = supabase
    .from('order_items')
    .select(`
      quantity,
      line_total,
      order_id,
      product_snapshot,
      products (
        category
      ),
      orders!inner (
        status,
        created_at,
        franchise_profile_id
      )
    `)
    .not('orders.status', 'in', '("cancelado","reembolsado")')

  if (filters?.franchiseProfileId) {
    query = query.eq('orders.franchise_profile_id', filters.franchiseProfileId)
  }
  if (filters?.startDate) {
    query = query.gte('orders.created_at', `${filters.startDate}T00:00:00`)
  }
  if (filters?.endDate) {
    query = query.lte('orders.created_at', `${filters.endDate}T23:59:59`)
  }

  const { data, error } = await query
  if (error) throw error

  const grouped = new Map<string, CategoryRanking & { orderIds: Set<string> }>()

  ;(data || []).forEach((item: any) => {
    const category =
      item.products?.category ||
      (item.product_snapshot as any)?.category ||
      'Sem categoria'

    if (!grouped.has(category)) {
      grouped.set(category, {
        category,
        total_quantity: 0,
        total_revenue: 0,
        orders_count: 0,
        orderIds: new Set<string>(),
      })
    }

    const current = grouped.get(category)!
    current.total_quantity += Number(item.quantity || 0)
    current.total_revenue += Number(item.line_total || 0)
    current.orderIds.add(item.order_id)
    current.orders_count = current.orderIds.size
  })

  return Array.from(grouped.values())
    .map(({ orderIds, ...rest }) => rest)
    .sort((a, b) => b.total_revenue - a.total_revenue)
}

export type { CategoryRanking, Filters as CategoryRankingFilters }
