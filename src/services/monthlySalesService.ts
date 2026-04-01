import { supabase } from '@/integrations/supabase/client'

type Filters = {
  startDate?: string
  endDate?: string
}

type MonthlySales = {
  month: string
  label: string
  revenue: number
  orders: number
}

export async function getMonthlyStoreSales(filters?: Filters) {
  let query = supabase
    .from('orders')
    .select('id, total_amount, status, created_at')
    .not('status', 'in', '("cancelado","reembolsado")')
    .order('created_at', { ascending: true })

  if (filters?.startDate) {
    query = query.gte('created_at', `${filters.startDate}T00:00:00`)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', `${filters.endDate}T23:59:59`)
  }

  const { data, error } = await query
  if (error) throw error

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const grouped = new Map<string, MonthlySales>()

  ;(data || []).forEach((order: any) => {
    const date = new Date(order.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        month: key,
        label: `${monthNames[date.getMonth()]}/${date.getFullYear()}`,
        revenue: 0,
        orders: 0,
      })
    }

    const current = grouped.get(key)!
    current.revenue += Number(order.total_amount || 0)
    current.orders += 1
  })

  return Array.from(grouped.values())
}

export type { MonthlySales, Filters as MonthlySalesFilters }
