import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FranchiseeRow {
  email: string
  display_name?: string
  first_name?: string
  last_name?: string
  cpf?: string
  cnpj?: string
  start_date?: string
  equipment_type?: string
  is_prepaid?: boolean
  rental_value_brl?: number
  allow_manual_credits?: boolean
  kess_serial?: string
  kess_expires_at?: string
  ktag_serial?: string
  ktag_expires_at?: string
  legacy_user_login?: string
  legacy_source_user_id?: string
  legacy_role?: string
  legacy_user_registered_at?: string
  contract_type?: string
  contract_expiration_date?: string
}

interface ImportResult {
  success: boolean
  email: string
  error?: string
  userId?: string
  action: 'created' | 'updated' | 'skipped'
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function cleanCpfCnpj(value: string | undefined): string | null {
  if (!value) return null
  return value.replace(/\D/g, '') || null
}

function parseDate(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null
  // Try to parse various date formats
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}

function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (!value) return false
  return value.toLowerCase() === 'true' || value === '1'
}

function parseNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'number' ? value : parseFloat(value.replace(',', '.'))
  return isNaN(num) ? null : num
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'suporte'])
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { franchisees, contractExpirationDate } = body as { 
      franchisees: FranchiseeRow[]
      contractExpirationDate?: string 
    }

    if (!franchisees || !Array.isArray(franchisees)) {
      return new Response(JSON.stringify({ error: 'Invalid data: franchisees array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Starting import of ${franchisees.length} franchisees`)

    const results: ImportResult[] = []
    const defaultContractExpiration = contractExpirationDate || '2026-12-31'

    for (const row of franchisees) {
      const email = row.email?.trim().toLowerCase()
      
      if (!email) {
        results.push({
          success: false,
          email: 'N/A',
          error: 'Email is required',
          action: 'skipped'
        })
        continue
      }

      try {
        // Check if user already exists by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email)

        let userId: string

        if (existingUser) {
          // User exists, just update profile
          userId = existingUser.id
          console.log(`User ${email} already exists, updating profile`)
        } else {
          // Create new user
          const tempPassword = generateTempPassword()
          
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              display_name: row.display_name,
              first_name: row.first_name,
              last_name: row.last_name
            }
          })

          if (createError) {
            console.error(`Error creating user ${email}:`, createError.message)
            results.push({
              success: false,
              email,
              error: createError.message,
              action: 'skipped'
            })
            continue
          }

          userId = newUser.user.id
          console.log(`Created user ${email} with ID ${userId}`)

          // Assign franqueado role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: userId,
              role: 'franqueado'
            }, { onConflict: 'user_id' })

          if (roleError) {
            console.error(`Error assigning role for ${email}:`, roleError.message)
          }
        }

        // Upsert profile data
        const profileData = {
          user_id: userId,
          email,
          display_name: row.display_name || null,
          first_name: row.first_name || null,
          last_name: row.last_name || null,
          cpf: cleanCpfCnpj(row.cpf),
          cnpj: cleanCpfCnpj(row.cnpj),
          start_date: parseDate(row.start_date),
          equipment_type: row.equipment_type || null,
          is_prepaid: parseBoolean(row.is_prepaid),
          rental_value_brl: parseNumber(row.rental_value_brl),
          allow_manual_credits: parseBoolean(row.allow_manual_credits),
          kess_serial: row.kess_serial || null,
          kess_expires_at: parseDate(row.kess_expires_at),
          ktag_serial: row.ktag_serial || null,
          ktag_expires_at: parseDate(row.ktag_expires_at),
          legacy_user_login: row.legacy_user_login || null,
          legacy_source_user_id: row.legacy_source_user_id || null,
          legacy_role: row.legacy_role || null,
          legacy_user_registered_at: row.legacy_user_registered_at || null,
          contract_type: row.contract_type || 'Full',
          contract_expiration_date: row.contract_expiration_date || defaultContractExpiration,
          requires_password_reset: !existingUser,
          updated_at: new Date().toISOString()
        }

        // Check if profile exists by user_id or legacy_source_user_id
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles_franchisees')
          .select('id')
          .or(`user_id.eq.${userId},legacy_source_user_id.eq.${row.legacy_source_user_id}`)
          .maybeSingle()

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabaseAdmin
            .from('profiles_franchisees')
            .update(profileData)
            .eq('id', existingProfile.id)

          if (updateError) {
            console.error(`Error updating profile for ${email}:`, updateError.message)
            results.push({
              success: false,
              email,
              error: updateError.message,
              action: 'skipped'
            })
            continue
          }

          results.push({
            success: true,
            email,
            userId,
            action: 'updated'
          })
        } else {
          // Insert new profile
          const { error: insertError } = await supabaseAdmin
            .from('profiles_franchisees')
            .insert(profileData)

          if (insertError) {
            console.error(`Error inserting profile for ${email}:`, insertError.message)
            results.push({
              success: false,
              email,
              error: insertError.message,
              action: 'skipped'
            })
            continue
          }

          results.push({
            success: true,
            email,
            userId,
            action: existingUser ? 'updated' : 'created'
          })
        }

        // Also update/create franchisee_profiles for contract management
        const { error: fpError } = await supabaseAdmin
          .from('franchisee_profiles')
          .upsert({
            user_id: userId,
            nome: row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            empresa: row.display_name,
            contract_expiration_date: row.contract_expiration_date || defaultContractExpiration,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (fpError) {
          console.error(`Error upserting franchisee_profiles for ${email}:`, fpError.message)
        }

      } catch (err) {
        console.error(`Unexpected error processing ${email}:`, err)
        results.push({
          success: false,
          email,
          error: err instanceof Error ? err.message : 'Unknown error',
          action: 'skipped'
        })
      }
    }

    const summary = {
      total: franchisees.length,
      created: results.filter(r => r.action === 'created').length,
      updated: results.filter(r => r.action === 'updated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      results
    }

    console.log(`Import complete: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`)

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Import error:', err)
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
