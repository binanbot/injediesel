import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Minimal XLSX parser — reads inline strings and shared strings
function parseXlsx(zipData: Uint8Array): string[][] {
  const files = unzip(zipData)
  
  // Find sheet1.xml
  const sheetEntry = files.find(f => f.path.includes('sheet1.xml') || f.path.includes('sheet.xml'))
  if (!sheetEntry) throw new Error('No worksheet found in XLSX')

  const sheetXml = new TextDecoder().decode(sheetEntry.data)

  // Parse shared strings if exists
  const sharedStrings: string[] = []
  const sstEntry = files.find(f => f.path.includes('sharedStrings.xml'))
  if (sstEntry) {
    const sstXml = new TextDecoder().decode(sstEntry.data)
    const siRegex = /<si[^>]*>([\s\S]*?)<\/si>/g
    let siMatch
    while ((siMatch = siRegex.exec(sstXml)) !== null) {
      const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g
      let text = ''
      let tMatch
      while ((tMatch = tRegex.exec(siMatch[1])) !== null) {
        text += tMatch[1]
      }
      sharedStrings.push(unescapeXml(text))
    }
  }

  // Parse rows
  const rows: string[][] = []
  const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g
  let rowMatch
  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const cells: Map<number, string> = new Map()
    const cellRegex = /<c\s+r="([A-Z]+)\d+"([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g
    let cellMatch
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const colRef = cellMatch[1]
      const attrs = cellMatch[2]
      const content = cellMatch[3] || ''
      const colIdx = colRefToIndex(colRef)

      let value = ''
      if (attrs.includes('t="s"')) {
        // Shared string
        const vMatch = content.match(/<v>([\s\S]*?)<\/v>/)
        if (vMatch) {
          const idx = parseInt(vMatch[1], 10)
          value = sharedStrings[idx] || ''
        }
      } else if (attrs.includes('t="inlineStr"')) {
        const tMatch = content.match(/<t[^>]*>([\s\S]*?)<\/t>/)
        value = tMatch ? unescapeXml(tMatch[1]) : ''
      } else {
        const vMatch = content.match(/<v>([\s\S]*?)<\/v>/)
        value = vMatch ? vMatch[1] : ''
      }
      cells.set(colIdx, value)
    }

    if (cells.size > 0) {
      const maxCol = Math.max(...cells.keys())
      const row: string[] = []
      for (let i = 0; i <= maxCol; i++) {
        row.push(cells.get(i) || '')
      }
      rows.push(row)
    }
  }

  return rows
}

function colRefToIndex(col: string): number {
  let idx = 0
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64)
  }
  return idx - 1
}

function unescapeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function unzip(data: Uint8Array): { path: string; data: Uint8Array }[] {
  const files: { path: string; data: Uint8Array }[] = []
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let pos = 0

  while (pos < data.length - 4) {
    const sig = dv.getUint32(pos, true)
    if (sig !== 0x04034b50) break

    const compression = dv.getUint16(pos + 8, true)
    const compSize = dv.getUint32(pos + 18, true)
    const uncompSize = dv.getUint32(pos + 22, true)
    const nameLen = dv.getUint16(pos + 26, true)
    const extraLen = dv.getUint16(pos + 28, true)
    const name = new TextDecoder().decode(data.subarray(pos + 30, pos + 30 + nameLen))
    const fileDataStart = pos + 30 + nameLen + extraLen
    const fileData = data.subarray(fileDataStart, fileDataStart + compSize)

    if (compression === 0) {
      files.push({ path: name, data: fileData })
    } else {
      // Deflate — use DecompressionStream
      files.push({ path: name, data: fileData, } as any)
      // We'll handle decompression separately
    }

    pos = fileDataStart + compSize
  }

  return files
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles').select('role')
      .eq('user_id', user.id).in('role', ['admin', 'suporte']).single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Read the uploaded file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const buffer = new Uint8Array(await file.arrayBuffer())
    const rows = parseXlsx(buffer)

    if (rows.length < 2) {
      return new Response(JSON.stringify({ error: 'File has no data rows' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const headerRow = rows[0].map(h => h.trim().toLowerCase())
    const idCol = headerRow.indexOf('id')
    const skuCol = headerRow.indexOf('sku')
    const nameCol = headerRow.indexOf('name')

    if (idCol === -1 || skuCol === -1 || nameCol === -1) {
      return new Response(JSON.stringify({ 
        error: 'Missing required columns: id, sku, name. Use the exported file as template.' 
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const colIndex = (name: string) => headerRow.indexOf(name)

    const results = { updated: 0, skipped: 0, errors: [] as string[] }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const id = row[idCol]?.trim()
      if (!id) {
        results.skipped++
        continue
      }

      try {
        const updateData: Record<string, any> = {}

        const setIfPresent = (col: string, key: string, transform?: (v: string) => any) => {
          const idx = colIndex(col)
          if (idx !== -1 && row[idx] !== undefined && row[idx] !== '') {
            updateData[key] = transform ? transform(row[idx]) : row[idx]
          }
        }

        setIfPresent('sku', 'sku')
        setIfPresent('ref', 'ref')
        setIfPresent('name', 'name')
        setIfPresent('brand', 'brand')
        setIfPresent('category', 'category')
        setIfPresent('price', 'price', v => parseFloat(v) || 0)
        setIfPresent('promo_type', 'promo_type', v => v || null)
        setIfPresent('promo_value', 'promo_value', v => { const n = parseFloat(v); return isNaN(n) ? null : n })
        setIfPresent('description_short', 'description_short')
        setIfPresent('description_full', 'description_full')
        setIfPresent('available', 'available', v => v.toLowerCase() === 'true')
        setIfPresent('image_url', 'image_url')
        setIfPresent('weight_kg', 'weight_kg', v => { const n = parseFloat(v); return isNaN(n) ? null : n })
        setIfPresent('dimensions_mm', 'dimensions_mm')
        
        const modelsIdx = colIndex('models')
        if (modelsIdx !== -1 && row[modelsIdx]) {
          updateData.models = row[modelsIdx].split(',').map((m: string) => m.trim()).filter(Boolean)
        }

        const specsIdx = colIndex('specifications')
        if (specsIdx !== -1 && row[specsIdx]) {
          updateData.specifications = row[specsIdx].split('|').map((s: string) => s.trim()).filter(Boolean)
        }

        // Recalculate promo_price
        if (updateData.price !== undefined || updateData.promo_type !== undefined || updateData.promo_value !== undefined) {
          const price = updateData.price ?? 0
          const promoType = updateData.promo_type
          const promoValue = updateData.promo_value
          
          if (promoType && promoValue) {
            if (promoType === 'percent') {
              updateData.promo_price = Math.max(0, price * (1 - promoValue / 100))
            } else if (promoType === 'fixed') {
              updateData.promo_price = Math.max(0, price - promoValue)
            }
          } else {
            updateData.promo_price = null
            if (!promoType) updateData.promo_type = null
            if (!promoValue && promoValue !== 0) updateData.promo_value = null
          }
        }

        if (Object.keys(updateData).length === 0) {
          results.skipped++
          continue
        }

        updateData.updated_at = new Date().toISOString()

        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update(updateData)
          .eq('id', id)

        if (updateError) {
          results.errors.push(`Row ${i + 1} (${id}): ${updateError.message}`)
        } else {
          results.updated++
        }
      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Import error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
