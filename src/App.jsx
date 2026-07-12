import { useState, useEffect } from 'react'
import { useApp } from './AppContext.jsx'
import { useDebt } from './debtContext.jsx'
import { FINTOC_PUBLIC_KEY } from './fintocService.js'
import { formatCLP } from './categories.js'
import SubNav from './components/SubNav.jsx'
import TransactionList from './pages/TransactionList.jsx'
import CategoryView    from './pages/CategoryView.jsx'
import ChartsView      from './pages/ChartsView.jsx'
import AlertsView      from './pages/AlertsView.jsx'
import BalanceView     from './pages/BalanceView.jsx'
import DashboardView   from './pages/debt/DashboardView.jsx'
import AccountsView    from './pages/debt/AccountsView.jsx'
import PersonasView    from './pages/debt/PersonasView.jsx'
import PorCobrarView   from './pages/debt/PorCobrarView.jsx'

const GASTOS_TABS = [
  { id: 'transactions', label: 'Movimientos', icon: '📋' },
  { id: 'categories',   label: 'Categorías', icon: '🏷️' },
  { id: 'balance',      label: 'Balance',    icon: '⚖️' },
  { id: 'charts',       label: 'Resumen',    icon: '📊' },
  { id: 'alerts',       label: 'Alertas',    icon: '🔔' },
]

const DEUDAS_TABS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: '📊' },
  { id: 'bancos',      label: 'Bancos',       icon: '🏦' },
  { id: 'mercadopago', label: 'Mercado Pago', icon: '💳' },
  { id: 'casas',       label: 'Casas',        icon: '🏪' },
  { id: 'personas',    label: 'Personas',     icon: '👤' },
  { id: 'porcobrar',   label: 'Por Cobrar',   icon: '🤝' },
]

export default function App() {
  const { linkToken, connect, refresh } = useApp()
  const { state: debtState } = useDebt()
  const [mode, setMode] = useState('gastos')
  const [tabByMode, setTabByMode] = useState({ gastos: 'transactions', deudas: 'dashboard' })

  // Cargar datos al iniciar si ya hay token
  useEffect(() => {
    if (linkToken) refresh()
  }, [linkToken])

  if (!linkToken) return <ConnectScreen onConnect={connect} onRefresh={refresh} />

  const tabs = mode === 'gastos' ? GASTOS_TABS : DEUDAS_TABS
  const tab = tabByMode[mode]
  const setTab = (id) => setTabByMode(prev => ({ ...prev, [mode]: id }))

  return (
    <div className="app">
      {mode === 'deudas' && (
        <header className="debt-header">
          <div>
            <h1>💰 Control Financiero</h1>
            <div className="sub">Gestión de deudas y presupuesto</div>
          </div>
          <div className="salary-chip">💵 {debtState.salary ? formatCLP(debtState.salary) : 'Sin sueldo'}</div>
        </header>
      )}

      <SubNav tabs={tabs} active={tab} onSelect={setTab} variant={mode === 'gastos' ? 'gastos' : ''} />

      <main className="content">
        {mode === 'gastos' && tab === 'transactions' && <TransactionList />}
        {mode === 'gastos' && tab === 'categories'   && <CategoryView />}
        {mode === 'gastos' && tab === 'balance'      && <BalanceView />}
        {mode === 'gastos' && tab === 'charts'       && <ChartsView />}
        {mode === 'gastos' && tab === 'alerts'       && <AlertsView />}

        {mode === 'deudas' && tab === 'dashboard'    && <DashboardView />}
        {mode === 'deudas' && tab === 'bancos'       && <AccountsView type="bancos" />}
        {mode === 'deudas' && tab === 'mercadopago'  && <AccountsView type="mercadopago" />}
        {mode === 'deudas' && tab === 'casas'        && <AccountsView type="casas" />}
        {mode === 'deudas' && tab === 'personas'     && <PersonasView />}
        {mode === 'deudas' && tab === 'porcobrar'    && <PorCobrarView />}
      </main>

      <nav className="tab-bar">
        <button className={`tab-btn ${mode === 'gastos' ? 'active' : ''}`} onClick={() => setMode('gastos')}>
          <span className="tab-icon">💳</span>
          <span className="tab-label">Gastos</span>
        </button>
        <button className={`tab-btn ${mode === 'deudas' ? 'active' : ''}`} onClick={() => setMode('deudas')}>
          <span className="tab-icon">💰</span>
          <span className="tab-label">Deudas</span>
        </button>
      </nav>
    </div>
  )
}

function ConnectScreen({ onConnect, onRefresh }) {
  const [manual, setManual] = useState('')

  function openFintocWidget() {
    const script = document.createElement('script')
    script.src = 'https://js.fintoc.com/v1/'
    script.onload = () => {
      window.Fintoc.create({
        publicKey: FINTOC_PUBLIC_KEY,
        holderType: 'individual',
        product: 'movements',
        country: 'cl',
        onSuccess: async (token) => {
          onConnect(token)
          await onRefresh(token)
        },
      }).open()
    }
    document.head.appendChild(script)
  }

  function handleManual() {
    if (manual.trim()) {
      onConnect(manual.trim())
      onRefresh(manual.trim())
    }
  }

  return (
    <div className="connect-screen">
      <div className="connect-card">
        <div className="connect-icon">💳</div>
        <h1>Wallet Tracker</h1>
        <p>Conecta tu banco para ver y analizar tus gastos automáticamente.</p>

        <button className="btn-primary" onClick={openFintocWidget}>
          Conectar banco
        </button>

        <div className="divider">— o ingresa tu link token —</div>

        <div className="manual-input">
          <input
            type="text"
            placeholder="link_token_..."
            value={manual}
            onChange={e => setManual(e.target.value)}
          />
          <button className="btn-secondary" onClick={handleManual}>OK</button>
        </div>

        <p className="hint">
          Soporta Banco de Chile y Banco Falabella.<br />
          Tus credenciales nunca pasan por esta app.
        </p>
      </div>
    </div>
  )
}
