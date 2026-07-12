// Funciones puras portadas de control_financiero.html — sin dependencias de React.

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const ACCT_TYPES = {
  bancos: [
    { v: 'credito', l: 'Tarjeta de Crédito' },
    { v: 'debito', l: 'Tarjeta de Débito' },
    { v: 'consumo', l: 'Crédito de Consumo' },
    { v: 'hipotecario', l: 'Crédito Hipotecario' },
  ],
  mercadopago: [{ v: 'billetera', l: 'Billetera Digital' }],
  casas: [
    { v: 'cmr', l: 'CMR / Tarjeta Comercial' },
    { v: 'cuotas', l: 'Plan de Cuotas' },
  ],
}

export const ACCT_ICONS = { bancos: '🏦', mercadopago: '💳', casas: '🏪' }
export const ACCT_NAMES = { bancos: 'Cuenta Bancaria', mercadopago: 'Billetera', casas: 'Tarjeta Comercial' }

// Valores = sufijo de clase para <Badge variant="...">, ej. 'blue' -> .badge-blue
export const TYPE_BADGE = {
  credito: 'blue', debito: 'teal', consumo: 'orange',
  hipotecario: 'purple', billetera: 'green', cmr: 'red', cuotas: 'orange',
}
export const TYPE_LABEL = {
  credito: 'Crédito', debito: 'Débito', consumo: 'Consumo', hipotecario: 'Hipotecario',
  billetera: 'Billetera', cmr: 'Tarjeta Comercial', cuotas: 'Cuotas',
}
export const TIPO_BADGE = {
  Banco: 'blue', 'Mercado Pago': 'green',
  'Casa Comercial': 'orange', 'Persona Natural': 'purple',
}

const TIPO_MAP = { bancos: 'Banco', mercadopago: 'Mercado Pago', casas: 'Casa Comercial' }

// Junta todas las deudas (cuentas + personas) en una lista plana con un `ref`
// estructurado para ubicar la entidad original sin parsear strings.
export function getAllDebts(state) {
  const debts = []
  ;['bancos', 'mercadopago', 'casas'].forEach(type => {
    state[type].forEach(acc => {
      ;(acc.entries || []).forEach(e => {
        debts.push({
          id: `${type}_${acc.id}_${e.id}`,
          ref: { kind: 'entry', type, accId: acc.id, entryId: e.id },
          nombre: `${acc.nombre} – ${e.descripcion}`,
          tipo: TIPO_MAP[type],
          deudaRestante: e.deudaRestante || 0,
          cuotaMensual: e.cuotaMensual || 0,
          tasaAnual: e.tasaAnual || 0,
          cuotasRestantes: e.cuotasRestantes || 0,
        })
      })
    })
  })
  state.personas.forEach(p => {
    debts.push({
      id: `persona_${p.id}`,
      ref: { kind: 'persona', personaId: p.id },
      nombre: `${p.nombre} (Persona)`,
      tipo: 'Persona Natural',
      deudaRestante: Math.max(0, (p.montoTotal || 0) - (p.montoPagado || 0)),
      cuotaMensual: p.cuotaMensual || 0,
      tasaAnual: (p.tasaMensual || 0) * 12,
      cuotasRestantes: p.plazoMeses || 0,
    })
  })
  return debts
}

export function getPlanPago(state, debtId, cuotaMin) {
  const v = state.planPagos?.[debtId]
  return v !== undefined && v !== null ? v : cuotaMin
}

export function getMesKey(state) {
  if (state.mesActual) return state.mesActual
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
export function getMesStr(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}
export function avanzarMes(key) {
  const [y, m] = key.split('-').map(Number)
  const next = new Date(y, m, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

// Cuota fija (amortización francesa). Si no hay interés, es reparto simple.
export function calcAmortizedCuota(restante, tasaMensualPct, plazoMeses) {
  if (restante <= 0 || plazoMeses <= 0) return 0
  const tasa = (tasaMensualPct || 0) / 100
  if (tasa > 0) {
    return restante * (tasa * Math.pow(1 + tasa, plazoMeses)) / (Math.pow(1 + tasa, plazoMeses) - 1)
  }
  return restante / plazoMeses
}

// Cierra el mes actual: aplica los pagos planificados a cada deuda, registra
// el resultado en el historial y avanza al mes siguiente. Pura e inmutable —
// nunca muta `state`, siempre retorna un objeto nuevo.
export function applyCerrarMes(state) {
  const debts = getAllDebts(state)
  const salary = state.salary || 0
  const acum = state.acumulado || 0
  const gastos = state.gastosFijos || 0
  const disponible = salary + acum

  const plans = new Map(debts.map(d => [d.id, getPlanPago(state, d.id, d.cuotaMensual)]))
  const totalPag = debts.reduce((s, d) => s + (plans.get(d.id) || 0), 0)
  const sobrante = disponible - gastos - totalPag
  const nuevo = Math.max(0, sobrante)

  const mesKey = getMesKey(state)
  const fechaStr = getMesStr(mesKey)
  const nextMes = avanzarMes(mesKey)

  function applyToAccounts(type) {
    return state[type].map(acc => {
      let changed = false
      const newEntries = acc.entries.map(e => {
        const debt = debts.find(d =>
          d.ref.kind === 'entry' && d.ref.type === type && d.ref.accId === acc.id && d.ref.entryId === e.id
        )
        const monto = debt ? plans.get(debt.id) : 0
        if (!monto) return e
        changed = true
        return {
          ...e,
          deudaRestante: Math.max(0, (e.deudaRestante || 0) - monto),
          cuotasRestantes: Math.max(0, (e.cuotasRestantes || 0) - 1),
        }
      })
      return changed ? { ...acc, entries: newEntries } : acc
    })
  }

  const newPersonas = state.personas.map(p => {
    const debt = debts.find(d => d.ref.kind === 'persona' && d.ref.personaId === p.id)
    const monto = debt ? plans.get(debt.id) : 0
    if (!monto) return p
    return {
      ...p,
      montoPagado: Math.min(p.montoTotal, (p.montoPagado || 0) + monto),
      plazoMeses: Math.max(0, (p.plazoMeses || 0) - 1),
    }
  })

  const historialEntry = {
    fecha: fechaStr, sueldo: salary, acumAnterior: acum,
    gastos, pagosDeuda: totalPag, sobrante: nuevo,
    deficit: Math.min(0, sobrante),
  }

  return {
    ...state,
    bancos: applyToAccounts('bancos'),
    mercadopago: applyToAccounts('mercadopago'),
    casas: applyToAccounts('casas'),
    personas: newPersonas,
    historialMeses: [historialEntry, ...(state.historialMeses || [])],
    acumulado: nuevo,
    planPagos: {},
    mesActual: nextMes,
  }
}
