import { useState } from 'react'
import { useApp } from '../AppContext.jsx'
import { CATEGORIES, groupByCategory, formatCLP, isInCurrentPeriod } from '../categories.js'

export default function AlertsView() {
  const { alerts, saveAlerts, expenses, billingCycles } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [newCat, setNewCat]     = useState('food')
  const [newLimit, setNewLimit] = useState('')

  // Gasto real del período actual por categoría (sin transferencias/pagos de TC)
  const thisMonth = expenses.filter(tx => isInCurrentPeriod(tx, billingCycles) && tx.category !== 'transfers')
  const spentMap = Object.fromEntries(
    groupByCategory(thisMonth).map(g => [g.key, g.total])
  )

  function addAlert() {
    const limit = parseFloat(newLimit.replace(/\./g, '').replace(',', '.'))
    if (!limit || limit <= 0) return
    saveAlerts([...alerts, { id: Date.now(), category: newCat, limit, enabled: true }])
    setNewLimit('')
    setShowForm(false)
  }

  function toggleAlert(id) {
    saveAlerts(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  function deleteAlert(id) {
    saveAlerts(alerts.filter(a => a.id !== id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Alertas</h2>
        <button className="icon-btn" onClick={() => setShowForm(!showForm)}>+</button>
      </div>

      <p className="hint-text">
        Recibe una advertencia cuando superes tu límite mensual en una categoría.
      </p>

      {showForm && (
        <div className="alert-form">
          <select value={newCat} onChange={e => setNewCat(e.target.value)}>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.emoji} {cat.label}</option>
            ))}
          </select>
          <div className="form-row">
            <label>Límite mensual $</label>
            <input
              type="number"
              placeholder="50000"
              value={newLimit}
              onChange={e => setNewLimit(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-primary" onClick={addAlert}>Guardar</button>
          </div>
        </div>
      )}

      <div className="alert-list">
        {alerts.length === 0 && (
          <div className="center-msg">Sin alertas — toca + para agregar</div>
        )}
        {alerts.map(alert => {
          const cat   = CATEGORIES[alert.category] || CATEGORIES.other
          const spent = spentMap[alert.category] || 0
          const pct   = Math.min((spent / alert.limit) * 100, 100)
          const over  = spent > alert.limit

          return (
            <div key={alert.id} className={`alert-card ${over ? 'over' : ''} ${!alert.enabled ? 'disabled' : ''}`}>
              <div className="alert-top">
                <span className="alert-title">{cat.emoji} {cat.label}</span>
                <div className="alert-actions">
                  <label className="toggle">
                    <input type="checkbox" checked={alert.enabled} onChange={() => toggleAlert(alert.id)} />
                    <span className="slider" />
                  </label>
                  <button className="delete-btn" onClick={() => deleteAlert(alert.id)}>✕</button>
                </div>
              </div>
              <div className="alert-amounts">
                <span>{formatCLP(spent)} gastado</span>
                <span>límite: {formatCLP(alert.limit)}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-bar"
                  style={{ width: `${pct}%`, background: over ? '#ef4444' : cat.color }}
                />
              </div>
              {over && <div className="over-badge">⚠️ Límite superado</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
