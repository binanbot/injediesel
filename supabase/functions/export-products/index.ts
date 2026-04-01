import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Minimal XLSX builder — no external deps
function colLetter(col: number): string {
  let s = ''
  while (col >= 0) {
    s = String.fromCharCode(65 + (col % 26)) + s
    col = Math.floor(col / 26) - 1
  }
  return s
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildXlsx(headers: string[], rows: (string | number | null)[][]): Uint8Array {
  // Build sheet XML
  let sheetData = '<row r="1">'
  headers.forEach((h, i) => {
    sheetData += `<c r="${colLetter(i)}1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`
  })
  sheetData += '</row>'

  rows.forEach((row, ri) => {
    const rowNum = ri + 2
    sheetData += `<row r="${rowNum}">`
    row.forEach((cell, ci) => {
      const ref = `${colLetter(ci)}${rowNum}`
      if (cell === null || cell === undefined) {
        sheetData += `<c r="${ref}"/>`
      } else if (typeof cell === 'number') {
        sheetData += `<c r="${ref}"><v>${cell}</v></c>`
      } else {
        sheetData += `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(cell))}</t></is></c>`
      }
    })
    sheetData += '</row>'
  })

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${sheetData}</sheetData>
</worksheet>`

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Produtos" sheetId="1" r:id="rId1"/></sheets>
</workbook>`

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

  // Use a simple zip implementation (PK header based)
  const enc = new TextEncoder()
  const files: { path: string; data: Uint8Array }[] = [
    { path: '[Content_Types].xml', data: enc.encode(contentTypes) },
    { path: '_rels/.rels', data: enc.encode(relsXml) },
    { path: 'xl/workbook.xml', data: enc.encode(workbookXml) },
    { path: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRels) },
    { path: 'xl/worksheets/sheet1.xml', data: enc.encode(sheetXml) },
  ]

  return createZip(files)
}

function createZip(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const centralDir: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = enc.encode(file.path)
    const crc = crc32(file.data)

    // Local file header
    const local = new Uint8Array(30 + nameBytes.length + file.data.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true) // sig
    lv.setUint16(4, 20, true) // version needed
    lv.setUint16(6, 0, true) // flags
    lv.setUint16(8, 0, true) // compression (store)
    lv.setUint16(10, 0, true) // mod time
    lv.setUint16(12, 0, true) // mod date
    lv.setUint32(14, crc, true)
    lv.setUint32(18, file.data.length, true) // compressed
    lv.setUint32(22, file.data.length, true) // uncompressed
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true) // extra length
    local.set(nameBytes, 30)
    local.set(file.data, 30 + nameBytes.length)
    parts.push(local)

    // Central directory entry
    const cd = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(cd.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, 0, true)
    cv.setUint16(14, 0, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, file.data.length, true)
    cv.setUint32(24, file.data.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)
    cv.setUint16(32, 0, true)
    cv.setUint16(34, 0, true)
    cv.setUint16(36, 0, true)
    cv.setUint32(38, 0x20, true)
    cv.setUint32(42, offset, true)
    cd.set(nameBytes, 46)
    centralDir.push(cd)

    offset += local.length
  }

  const cdOffset = offset
  let cdSize = 0
  centralDir.forEach(c => cdSize += c.length)

  // End of central directory
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, cdSize, true)
  ev.setUint32(16, cdOffset, true)
  ev.setUint16(20, 0, true)

  const totalSize = offset + cdSize + 22
  const result = new Uint8Array(totalSize)
  let pos = 0
  for (const p of parts) { result.set(p, pos); pos += p.length }
  for (const c of centralDir) { result.set(c, pos); pos += c.length }
  result.set(eocd, pos)

  return result
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
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

    // Verify caller is admin
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

    // Fetch all products
    const { data: products, error: fetchError } = await supabaseAdmin
      .from('products').select('*').order('sku')

    if (fetchError) throw fetchError

    const headers = [
      'id', 'sku', 'ref', 'name', 'brand', 'category',
      'price', 'promo_type', 'promo_value',
      'description_short', 'description_full',
      'available', 'image_url', 'models', 'specifications',
      'weight_kg', 'dimensions_mm',
    ]

    const rows = (products || []).map((p: any) => [
      p.id,
      p.sku,
      p.ref || '',
      p.name,
      p.brand,
      p.category || '',
      p.price,
      p.promo_type || '',
      p.promo_value ?? '',
      p.description_short || '',
      p.description_full || '',
      p.available ? 'true' : 'false',
      p.image_url || '',
      (p.models || []).join(', '),
      (p.specifications || []).join(' | '),
      p.weight_kg ?? '',
      p.dimensions_mm || '',
    ])

    const xlsxData = buildXlsx(headers, rows)

    return new Response(xlsxData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="produtos.xlsx"',
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
