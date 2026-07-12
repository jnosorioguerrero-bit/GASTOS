// Import/export de Excel para deudas. `xlsx` (SheetJS) se carga con import()
// dinámico para que quede en un chunk separado y no infle el bundle principal.

export const FIELDS = [
  { k: 'descripcion',     label: 'Descripción / Ítem',   req: true },
  { k: 'cuotaMensual',    label: 'Cuota Mensual (CLP)',  req: true },
  { k: 'cuotasTotal',     label: 'Cuotas Totales',       req: false },
  { k: 'cuotasRestantes', label: 'Cuotas Restantes',     req: false },
  { k: 'tasaAnual',       label: 'Tasa Anual (%)',       req: false },
  { k: 'deudaRestante',   label: 'Deuda Restante (CLP)', req: false },
]

async function loadXlsx() {
  const mod = await import('xlsx')
  return mod.default ?? mod
}

// Devuelve la hoja completa como array de arrays, sin asumir que la fila 0
// son los encabezados (necesario para formatos con info arriba, ej. estados
// de cuenta bancarios).
export async function readWorkbookRaw(file) {
  const XLSX = await loadXlsx()
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
}

export async function readWorkbook(file) {
  const XLSX = await loadXlsx()
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (raw.length < 2) return { headers: [], rows: [] }
  const headers = raw[0].map(h => String(h).trim())
  const rows = raw.slice(1).filter(r => r.some(c => c !== '' && c !== undefined))
  return { headers, rows }
}

export function autoMapColumn(headers, key) {
  return headers.findIndex(h => {
    const l = h.toLowerCase()
    if (key === 'descripcion') return l.includes('desc') || l.includes('item') || l.includes('detail') || l.includes('compra') || l.includes('concepto') || l.includes('producto')
    if (key === 'cuotaMensual') return (l.includes('cuota') && !l.includes('total') && !l.includes('rest')) || l.includes('valor cuota') || l.includes('monto cuota')
    if (key === 'cuotasTotal') return l.includes('cuota') && (l.includes('total') || l === 'cuotas' || l.includes('plazo'))
    if (key === 'cuotasRestantes') return l.includes('rest') || l.includes('pendiente') || l.includes('falt') || l.includes('quedan')
    if (key === 'tasaAnual') return l.includes('tasa') || l.includes('interes') || l.includes('interés') || l === '%'
    if (key === 'deudaRestante') return l.includes('deuda') || l.includes('saldo') || (l.includes('restante') && l.includes('monto'))
    return false
  })
}

function cleanNum(v) {
  return parseFloat(String(v || 0).replace(/[$. ]/g, '').replace(',', '.').trim()) || 0
}

export function buildEntriesFromRows(rows, mapping) {
  return rows.map(row => {
    const e = {}
    FIELDS.forEach(f => {
      const idx = mapping[f.k]
      if (idx !== null && idx !== undefined) {
        const val = row[idx]
        e[f.k] = f.k === 'descripcion' ? String(val || '').trim() : cleanNum(val)
      } else {
        e[f.k] = f.k === 'descripcion' ? 'Sin descripción' : 0
      }
    })
    if (!e.deudaRestante && e.cuotaMensual && e.cuotasRestantes) e.deudaRestante = e.cuotaMensual * e.cuotasRestantes
    if (!e.cuotasRestantes && e.cuotasTotal && e.deudaRestante && e.cuotaMensual) e.cuotasRestantes = Math.round(e.deudaRestante / e.cuotaMensual)
    return e
  }).filter(e => e.cuotaMensual > 0 || e.deudaRestante > 0)
}

const TEMPLATES = {
  banco: {
    name: 'Plantilla_Banco.xlsx',
    data: [
      ['Descripción', 'Cuota Mensual (CLP)', 'Cuotas Totales', 'Cuotas Restantes', 'Tasa Anual (%)', 'Deuda Restante (CLP)'],
      ['TV Samsung 55"', 75000, 12, 8, 24.5, 600000],
      ['Notebook HP', 50000, 24, 18, 22.0, 900000],
      ['Crédito consumo viaje', 120000, 36, 30, 18.5, 3600000],
    ],
  },
  mercadopago: {
    name: 'Plantilla_MercadoPago.xlsx',
    data: [
      ['Descripción', 'Cuota Mensual (CLP)', 'Cuotas Totales', 'Cuotas Restantes', 'Deuda Restante (CLP)'],
      ['Auriculares Sony', 25000, 6, 4, 100000],
      ['Tablet iPad', 60000, 12, 9, 540000],
    ],
  },
  casa: {
    name: 'Plantilla_CasaComercial.xlsx',
    data: [
      ['Descripción', 'Cuota Mensual (CLP)', 'Cuotas Totales', 'Cuotas Restantes', 'Tasa Anual (%)', 'Deuda Restante (CLP)'],
      ['Refrigerador Mabe', 45000, 18, 12, 29.9, 540000],
      ['Ropa temporada verano', 20000, 6, 3, 36.0, 60000],
      ['Smart TV LG 65"', 55000, 24, 20, 32.5, 1100000],
    ],
  },
}

export async function downloadTemplate(type) {
  const XLSX = await loadXlsx()
  const tmpl = TEMPLATES[type]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(tmpl.data)
  ws['!cols'] = tmpl.data[0].map(() => ({ wch: 24 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Deudas')
  XLSX.writeFile(wb, tmpl.name)
}
