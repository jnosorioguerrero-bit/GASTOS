export const CATEGORIES = {
  food:          { label: 'Comida',         emoji: '🍔', color: '#f97316' },
  transport:     { label: 'Transporte',     emoji: '🚗', color: '#3b82f6' },
  entertainment: { label: 'Entretención',   emoji: '🎬', color: '#a855f7' },
  health:        { label: 'Salud',          emoji: '💊', color: '#22c55e' },
  shopping:      { label: 'Shopping',       emoji: '🛍️', color: '#ec4899' },
  services:      { label: 'Servicios',      emoji: '💡', color: '#eab308' },
  transfers:     { label: 'Transferencias', emoji: '💸', color: '#6b7280' },
  other:         { label: 'Otros',          emoji: '📦', color: '#94a3b8' },
}

const KEYWORDS = [
  ['food',          ['rappi','uber eats','pedidos ya','restaurant','cafe','sushi','pizza','jumbo','lider','unimarc','santa isabel','supermercado','mcdonalds','burger','subway']],
  ['transport',     ['uber','cabify','metro','bip','copec','shell','enex','estacion servicio','bus','taxi']],
  ['entertainment', ['netflix','spotify','steam','cinema','cine','hbo','disney','youtube','twitch','prime video','deezer']],
  ['health',        ['farmacia','clinica','hospital','medico','dental','salcobrand','cruz verde','ahumada','isapre']],
  ['shopping',      ['falabella','ripley','paris','zara','h&m','mercadolibre','amazon','adidas','nike','shein','mercadopago','mercado pago']],
  ['services',      ['entel','claro','movistar','wom','enel','essbio','vtr','cfe','aguaandina','internet','telefono','seguro proteccion bancaria','proteccion bancaria']],
  ['transfers',     ['transferencia','traspaso','pago a','deposito','abono','cargo por pago tc','pago tc']],
]

export function classifyTransaction(description = '') {
  const text = description.toLowerCase()
  for (const [cat, keys] of KEYWORDS) {
    if (keys.some(k => text.includes(k))) return cat
  }
  return 'other'
}

export function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

export function groupByCategory(transactions) {
  const result = {}
  for (const tx of transactions) {
    const cat = tx.category || 'other'
    result[cat] = (result[cat] || 0) + Math.abs(tx.amount)
  }
  return Object.entries(result)
    .map(([key, total]) => ({ key, total, ...CATEGORIES[key] }))
    .sort((a, b) => b.total - a.total)
}

// Fechas "solo calendario" (sin hora, o con hora exactamente en medianoche UTC
// — convención común en APIs financieras para post_date) se parsean como
// medianoche UTC. Leerlas con getters locales las corre un día hacia atrás en
// zonas horarias negativas (ej. Chile). Si traen una hora real (no medianoche
// UTC), se leen en hora local — representan un instante real.
function isDateOnly(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{4}-\d{2}-\d{2}T00:00:00(\.0+)?Z$/.test(dateStr)
}

function toDateParts(dateStr) {
  const d = new Date(dateStr)
  if (isDateOnly(dateStr)) {
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() }
  }
  return { y: d.getFullYear(), m: d.getMonth(), day: d.getDate() }
}

// Formatea tx.date para mostrar en la UI, evitando el mismo corrimiento de día.
export function formatTxDate(dateStr, options = { day: '2-digit', month: 'short' }) {
  const { y, m, day } = toDateParts(dateStr)
  return new Date(y, m, day).toLocaleDateString('es-CL', options)
}

function calendarKey(dateStr) {
  const { y, m } = toDateParts(dateStr)
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

// Ciclo de facturación real (ej. tarjeta que cierra el 22): una transacción
// pertenece al período que cierra en el próximo `closingDay` a partir de su fecha.
export function getPeriodKey(dateStr, closingDay) {
  let { y, m, day } = toDateParts(dateStr)
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const close = Math.min(closingDay, lastDay)
  if (day > close) {
    m += 1
    if (m > 11) { m = 0; y += 1 }
  }
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

// Clave de período de una transacción: ciclo real si su cuenta tiene un día de
// cierre configurado, mes calendario si no (comportamiento por defecto).
function periodKeyFor(tx, cyclesMap) {
  const closingDay = cyclesMap?.[tx.accountId]?.closingDay
  return closingDay ? getPeriodKey(tx.date, closingDay) : calendarKey(tx.date)
}

// ¿La transacción cae en el período (mes calendario o ciclo de facturación,
// según su cuenta) que contiene la fecha de hoy?
export function isInCurrentPeriod(tx, cyclesMap = {}) {
  return periodKeyFor(tx, cyclesMap) === periodKeyFor({ date: new Date().toISOString(), accountId: tx.accountId }, cyclesMap)
}

export function groupByMonth(transactions, cyclesMap = {}) {
  const result = {}
  for (const tx of transactions) {
    const key = periodKeyFor(tx, cyclesMap)
    result[key] = (result[key] || 0) + Math.abs(tx.amount)
  }
  return Object.entries(result)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
}

// Flujo de caja mensual: ingresos vs gasto real vs transferencias/pagos de TC.
// Las transferencias se separan del gasto real porque son movimiento de dinero propio
// (pago de tarjeta, traspasos a terceros), no consumo.
export function groupCashFlowByMonth(transactions, cyclesMap = {}) {
  const result = {}
  for (const tx of transactions) {
    const key = periodKeyFor(tx, cyclesMap)
    if (!result[key]) result[key] = { month: key, income: 0, expense: 0, transfer: 0 }

    if (tx.amount > 0) {
      result[key].income += tx.amount
    } else if (tx.category === 'transfers') {
      result[key].transfer += Math.abs(tx.amount)
    } else {
      result[key].expense += Math.abs(tx.amount)
    }
  }
  return Object.values(result)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
}
