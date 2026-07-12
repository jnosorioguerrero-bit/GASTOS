import { classifyTransaction } from './categories.js'

// La public key es segura de exponer en el cliente (así está pensada por Fintoc).
// La secret key vive solo en el backend (server/index.js), nunca aquí.
export const FINTOC_PUBLIC_KEY = 'pk_live_zbbX888xQdzhyhyX6CkX9Smt_s_D8zRK1UTiEbNLDdw'
const BASE_URL = '/api'

// ── Obtener cuentas ──────────────────────────────────────────────
export async function fetchAccounts(linkToken) {
  const res = await fetch(`${BASE_URL}/accounts?link_token=${linkToken}`)
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
  const body = await res.json()
  return Array.isArray(body) ? body : (body.data ?? [])
}

// ── Obtener movimientos de los últimos N meses ────────────────────
// Fintoc pagina los resultados (300 por página, ordenados de más antiguo a
// más reciente) — con una sola página, cuentas con mucho movimiento se
// truncan antes de llegar a las transacciones más recientes. Se pagina hasta
// que una página vuelve con menos de `perPage` resultados.
export async function fetchTransactions(linkToken, accountId, months = 3) {
  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const perPage = 300
  const allTxs = []
  let page = 1

  while (true) {
    const params = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
      since: since.toISOString(),
      link_token: linkToken,
    })

    const res = await fetch(`${BASE_URL}/accounts/${accountId}/movements?${params}`)
    if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
    const body = await res.json()
    const txs = Array.isArray(body) ? body : (body.data ?? [])
    allTxs.push(...txs)

    if (txs.length < perPage || page > 20) break // última página (o freno de seguridad)
    page += 1
  }

  return allTxs.map(tx => ({
    ...tx,
    accountId,
    // Normalizar fecha: Fintoc usa post_date o transaction_date
    date: tx.post_date || tx.transaction_date || tx.date || new Date().toISOString(),
    category: classifyTransaction(tx.description),
  }))
}

// ── Cargar todas las cuentas y sus movimientos ────────────────────
// Se conservan ingresos y gastos (no solo gastos) para poder calcular flujo de caja.
export async function loadAll(linkToken) {
  const accounts = await fetchAccounts(linkToken)
  const allTxs = []

  for (const account of accounts) {
    const txs = await fetchTransactions(linkToken, account.id)
    allTxs.push(...txs)
  }

  const transactions = allTxs.sort((a, b) => new Date(b.date) - new Date(a.date))

  return { accounts, transactions }
}