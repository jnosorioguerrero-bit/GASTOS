import { useState } from 'react'
import { useApp } from '../AppContext.jsx'
import { groupByCategory, formatCLP, isInCurrentPeriod } from '../categories.js'
import AccountCycleSettingsModal from '../components/AccountCycleSettingsModal.jsx'

export default function CategoryView() {
  const { expenses, accounts, billingCycles, saveBillingCycles } = useApp()
  const [showCycleSettings, setShowCycleSettings] = useState(false)

  // Filtrar solo el período actual (ciclo de facturación real si está configurado,
  // mes calendario si no), sin transferencias/pagos de TC (no son consumo real)
  const now = new Date()
  const thisMonth = expenses.filter(tx => isInCurrentPeriod(tx, billingCycles) && tx.category !== 'transfers')

  const groups = groupByCategory(thisMonth)
  const total  = groups.reduce((s, g) => s + g.total, 0)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Categorías</h2>
        <span className="subtitle">
          {now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </span>
        <button className="icon-btn" onClick={() => setShowCycleSettings(true)} title="Ciclo de facturación">⚙️</button>
      </div>

      <AccountCycleSettingsModal
        open={showCycleSettings}
        accounts={accounts}
        cycles={billingCycles}
        onClose={() => setShowCycleSettings(false)}
        onSave={next => { saveBillingCycles(next); setShowCycleSettings(false) }}
      />

      <div className="total-card">
        <div className="total-label">Total gastado</div>
        <div className="total-amount">{formatCLP(total)}</div>
      </div>

      <div className="cat-list">
        {groups.map(g => (
          <div key={g.key} className="cat-row">
            <div className="cat-header">
              <span>{g.emoji} {g.label}</span>
              <span className="cat-amount">{formatCLP(g.total)}</span>
              <span className="cat-pct">{total > 0 ? Math.round(g.total / total * 100) : 0}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-bar"
                style={{
                  width: `${total > 0 ? (g.total / total) * 100 : 0}%`,
                  background: g.color,
                }}
              />
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="center-msg">Sin gastos este mes</div>
        )}
      </div>
    </div>
  )
}
