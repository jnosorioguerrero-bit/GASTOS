import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { loadAll } from './fintocService.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts]         = useState([])
  const [alerts, setAlerts]             = useState(() => {
    const saved = localStorage.getItem('wt_alerts')
    return saved ? JSON.parse(saved) : []
  })
  const [linkToken, setLinkToken]       = useState(() =>
    localStorage.getItem('wt_link_token') || null
  )
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  // Día de cierre configurado por cuenta, para agrupar "mes" por ciclo real de
  // facturación en vez de mes calendario: { [accountId]: { closingDay } }
  const [billingCycles, setBillingCycles] = useState(() => {
    const saved = localStorage.getItem('wt_billing_cycles')
    return saved ? JSON.parse(saved) : {}
  })
  // Etiqueta de división de gasto por transacción: { [txId]: { type: 'pareja' } }
  // El gasto sigue contando completo en Categorías/Balance — esto solo marca
  // qué parte le corresponde a otra persona, para trackearlo aparte como
  // "por cobrar" (evita el doble conteo con la transferencia de reembolso).
  const [splitTags, setSplitTagsState] = useState(() => {
    const saved = localStorage.getItem('wt_split_tags')
    return saved ? JSON.parse(saved) : {}
  })
  // Porcentaje que asume cada tipo de división, configurable una vez.
  const [splitConfig, setSplitConfigState] = useState(() => {
    const saved = localStorage.getItem('wt_split_config')
    return saved ? JSON.parse(saved) : { pareja: { pct: 40 } }
  })
  // Registro manual de pagos recibidos de vuelta (ej. pareja te transfiere).
  const [partnerSettlements, setPartnerSettlementsState] = useState(() => {
    const saved = localStorage.getItem('wt_partner_settlements')
    return saved ? JSON.parse(saved) : []
  })

  const connect = useCallback((token) => {
    localStorage.setItem('wt_link_token', token)
    setLinkToken(token)
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem('wt_link_token')
    setLinkToken(null)
    setTransactions([])
    setAccounts([])
  }, [])

  const refresh = useCallback(async (token) => {
    const t = token || linkToken
    if (!t) return
    setLoading(true)
    setError(null)
    try {
      const data = await loadAll(t)
      setAccounts(data.accounts)
      setTransactions(data.transactions)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [linkToken])

  const saveAlerts = useCallback((newAlerts) => {
    setAlerts(newAlerts)
    localStorage.setItem('wt_alerts', JSON.stringify(newAlerts))
  }, [])

  const saveBillingCycles = useCallback((next) => {
    setBillingCycles(next)
    localStorage.setItem('wt_billing_cycles', JSON.stringify(next))
  }, [])

  const toggleSplitTag = useCallback((txId, type) => {
    setSplitTagsState(prev => {
      const next = { ...prev }
      if (next[txId]?.type === type) {
        delete next[txId] // ya estaba marcado con este tipo -> desmarcar
      } else {
        next[txId] = { type }
      }
      localStorage.setItem('wt_split_tags', JSON.stringify(next))
      return next
    })
  }, [])

  const saveSplitConfig = useCallback((next) => {
    setSplitConfigState(next)
    localStorage.setItem('wt_split_config', JSON.stringify(next))
  }, [])

  const addPartnerSettlement = useCallback((amount) => {
    setPartnerSettlementsState(prev => {
      const next = [...prev, { id: Date.now(), amount, date: new Date().toISOString() }]
      localStorage.setItem('wt_partner_settlements', JSON.stringify(next))
      return next
    })
  }, [])

  // Gastos = movimientos con monto negativo (excluye ingresos)
  const expenses = useMemo(
    () => transactions.filter(tx => tx.amount < 0),
    [transactions]
  )
  // Ingresos = movimientos con monto positivo (transferencias recibidas, depósitos, etc.)
  const income = useMemo(
    () => transactions.filter(tx => tx.amount > 0),
    [transactions]
  )

  // Transacciones marcadas "con pareja" -> cuánto le corresponde pagar en total.
  const partnerOwedTotal = useMemo(() => {
    const pct = (splitConfig.pareja?.pct ?? 40) / 100
    return expenses.reduce((sum, tx) => {
      if (splitTags[tx.id]?.type !== 'pareja') return sum
      return sum + Math.abs(tx.amount) * pct
    }, 0)
  }, [expenses, splitTags, splitConfig])

  const partnerSettledTotal = useMemo(
    () => partnerSettlements.reduce((s, p) => s + p.amount, 0),
    [partnerSettlements]
  )

  const partnerBalance = partnerOwedTotal - partnerSettledTotal

  return (
    <AppContext.Provider value={{
      transactions, expenses, income, accounts, alerts, linkToken,
      loading, error, billingCycles,
      splitTags, splitConfig, partnerSettlements,
      partnerOwedTotal, partnerSettledTotal, partnerBalance,
      connect, disconnect, refresh, saveAlerts, saveBillingCycles,
      toggleSplitTag, saveSplitConfig, addPartnerSettlement,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
