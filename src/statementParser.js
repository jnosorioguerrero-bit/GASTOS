// Parser específico para el "Estado de Cuenta" / "Movimientos Facturados" de
// tarjetas Banco de Chile (.xls exportado desde su portal). Extrae solo las
// compras en cuotas con saldo pendiente — las compras al contado (01/01) y
// los cargos/comisiones/impuestos ya están pagados ese mes, no son deuda futura.

const CUOTAS_RE = /^(\d+)\s*\/\s*(\d+)$/
const TASA_RE = /TASA\s+INT\.?\s*([\d.,]+)\s*%/i

function norm(v) {
  return String(v ?? '').trim()
}

function findHeaderRow(rows) {
  return rows.findIndex(row =>
    row.some(c => norm(c).toLowerCase().startsWith('categor')) &&
    row.some(c => norm(c).toLowerCase().startsWith('descripci'))
  )
}

// Busca una fila cuya celda contenga `label`, y lee el valor en la misma
// columna de la fila siguiente (así están dispuestos los datos del encabezado
// del estado de cuenta: etiqueta en una fila, valores en la de abajo).
function findLabelValue(rows, label) {
  const rowIdx = rows.findIndex(row => row.some(c => norm(c).toLowerCase().includes(label)))
  if (rowIdx === -1 || !rows[rowIdx + 1]) return null
  const colIdx = rows[rowIdx].findIndex(c => norm(c).toLowerCase().includes(label))
  const val = rows[rowIdx + 1][colIdx]
  return val === '' || val == null ? null : val
}

export function parseBancoChileStatement(rows) {
  const headerIdx = findHeaderRow(rows)
  if (headerIdx === -1) {
    throw new Error('No se reconoce este archivo como estado de cuenta Banco de Chile.')
  }

  const CAT_COL = 1, DESC_COL = 3, CUOTAS_COL = 6, MONTO_COL = 7

  const entries = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every(c => norm(c) === '')) continue

    const categoria = norm(row[CAT_COL]).toLowerCase()
    // "Total de Pagos, Compras, Cuotas y Avance" y "...Compras en Cuotas en Periodo"
    // Se excluye "Cargos, Comisiones, Impuestos y Abonos" (no son deuda futura).
    if (!categoria.includes('pagos') && !categoria.includes('cuotas')) continue

    const match = norm(row[CUOTAS_COL]).match(CUOTAS_RE)
    if (!match) continue

    const actual = parseInt(match[1], 10)
    const total = parseInt(match[2], 10)
    const restantes = total - actual
    if (total <= 1 || restantes <= 0) continue // pagada al contado o ya terminada

    const monto = parseFloat(norm(row[MONTO_COL]).replace(/[$.\s]/g, '').replace(',', '.')) || 0
    if (!monto) continue

    let descripcion = norm(row[DESC_COL])
    const tasaMatch = descripcion.match(TASA_RE)
    const tasaAnual = tasaMatch ? parseFloat(tasaMatch[1].replace(',', '.')) : 0
    descripcion = descripcion.replace(TASA_RE, '').trim()

    entries.push({
      descripcion,
      cuotaMensual: monto,
      cuotasTotal: total,
      cuotasRestantes: restantes,
      tasaAnual,
      deudaRestante: monto * restantes,
    })
  }

  return {
    entries,
    meta: {
      montoFacturado: findLabelValue(rows, 'monto facturado'),
      fechaFacturacion: findLabelValue(rows, 'facturaci'),
      pagarHasta: findLabelValue(rows, 'pagar hasta'),
    },
  }
}
