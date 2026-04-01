import { supabase } from '@/integrations/supabase/client'

type TopProductFilters = {
  franchiseProfileId?: string
  startDate?: string
  endDate?: string
}

type RawOrderItem = {
  product_id: string | null
  product_name: string
  product_sku: string | null
  quantity: number
  line_total: number
  order_id: string
  orders: {
    id: string
    status: string
    created_at: string
    franchise_profile_id: string
  }
}

type TopProductResult = {
  product_id: string | null
  product_name: string
  product_sku: string | null
  total_quantity: number
  total_revenue: number
  orders_count: number
}

export async function getTopSellingProducts(filters?: TopProductFilters) {
  let query = supabase
    .from('order_items')
    .select(`
      product_id,
      product_name,
      product_sku,
      quantity,
      line_total,
      order_id,
      orders!inner (
        id,
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

  const grouped = new Map<string, TopProductResult & { orderIds: Set<string> }>()

  ;(data as unknown as RawOrderItem[]).forEach((item) => {
    const key = item.product_id || `${item.product_name}-${item.product_sku || 'sem-sku'}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        total_quantity: 0,
        total_revenue: 0,
        orders_count: 0,
        orderIds: new Set<string>(),
      })
    }

    const current = grouped.get(key)!
    current.total_quantity += Number(item.quantity || 0)
    current.total_revenue += Number(item.line_total || 0)
    current.orderIds.add(item.order_id)
    current.orders_count = current.orderIds.size
  })

  const result = Array.from(grouped.values()).map(({ orderIds, ...rest }) => rest)

  const topByQuantity = [...result]
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 10)

  const topByRevenue = [...result]
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10)

  return {
    topByQuantity,
    topByRevenue,
  }
}

export type { TopProductFilters, TopProductResult }
