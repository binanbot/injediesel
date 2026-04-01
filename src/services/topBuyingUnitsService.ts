import { supabase } from '@/integrations/supabase/client'

type Filters = {
  startDate?: string
  endDate?: string
}

type TopBuyingUnit = {
  franchise_profile_id: string
  unit_name: string
  display_name: string
  orders_count: number
  total_amount: number
  total_items: number
  average_ticket: number
}

export async function getTopBuyingUnits(filters?: Filters) {
  let query = supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      items_count,
      status,
      created_at,
      franchise_profile_id,
      unit_id
    `)
    .not('status', 'in', '("cancelado","reembolsado")')

  if (filters?.startDate) {
    query = query.gte('created_at', `${filters.startDate}T00:00:00`)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', `${filters.endDate}T23:59:59`)
  }

  const { data, error } = await query
  if (error) throw error

  // Collect unique unit IDs
  const unitIds = [...new Set((data || []).map((o: any) => o.unit_id).filter(Boolean))]
  
  let unitsMap = new Map<string, { name: string; city: string | null; state: string | null }>()
  if (unitIds.length > 0) {
    const { data: units } = await supabase
      .from('units')
      .select('id, name, city, state')
      .in('id', unitIds)
    ;(units || []).forEach((u: any) => unitsMap.set(u.id, { name: u.name, city: u.city, state: u.state }))
  }

  // Collect unique profile IDs
  const profileIds = [...new Set((data || []).map((o: any) => o.franchise_profile_id).filter(Boolean))]
  let profilesMap = new Map<string, string>()
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles_franchisees')
      .select('id, display_name, first_name, last_name')
      .in('id', profileIds)
    ;(profiles || []).forEach((p: any) => {
      const name = p.display_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Sem nome'
      profilesMap.set(p.id, name)
    })
  }

  const grouped = new Map<string, TopBuyingUnit>()

  ;(data || []).forEach((order: any) => {
    const key = order.unit_id || order.franchise_profile_id
    if (!grouped.has(key)) {
      const unit = unitsMap.get(order.unit_id)
      const unitLabel = unit ? `${unit.name}${unit.city ? ` - ${unit.city}/${unit.state}` : ''}` : 'Unidade sem nome'
      grouped.set(key, {
        franchise_profile_id: order.franchise_profile_id,
        unit_name: unitLabel,
        display_name: profilesMap.get(order.franchise_profile_id) || '-',
        orders_count: 0,
        total_amount: 0,
        total_items: 0,
        average_ticket: 0,
      })
    }

    const current = grouped.get(key)!
    current.orders_count += 1
    current.total_amount += Number(order.total_amount || 0)
    current.total_items += Number(order.items_count || 0)
    current.average_ticket = current.total_amount / current.orders_count
  })

  return Array.from(grouped.values())
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 10)
}

export type { TopBuyingUnit, Filters as TopBuyingUnitFilters }
