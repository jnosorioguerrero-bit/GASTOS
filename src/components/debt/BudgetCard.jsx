import { formatCLP } from '../../categories.js'
import { getMesKey, getMesStr, getPlanPago } from '../../debtUtils.js'

export default function BudgetCard({ state, debts, onChangeGastos, onCerrarMes }) {
  const salary = state.salary || 0
  const acum = state.acumulado || 0
  const gastos = state.gastosFijos || 0
  const disponibleTotal = salary + acum
  const cuotasMin = debts.reduce((s, d) => s + d.cuotaMensual, 0)
  const totalPagos = debts.reduce((s, d) => s + getPlanPago(state, d.id, d.cuotaMensual), 0)
  const sobrante = disponibleTotal - gastos - totalPagos
  const pctGastos = salary > 0 ? (gastos / salary) * 100 : 0
  const pctDeudas = salary > 0 ? (totalPagos / salary) * 100 : 0

  return (
    <div className="debt-card">
      <div className="debt-card-header">
        <div>
          <div className="debt-card-title">🗓️ Mi Presupuesto del Mes</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.78rem', marginTop: 2 }}>
            Planificando: <strong>{getMesStr(getMesKey(state))}</strong>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onCerrarMes}>✅ Cerrar Mes y Acumular</button>
      </div>

      <div className="budget-summary-grid">
        <div className="budget-summary-item">
          <div className="bs-label">💵 Sueldo</div>
          <div className="bs-val">{formatCLP(salary)}</div>
        </div>
        <div className="budget-summary-item">
          <div className="bs-label">🏦 Acumulado anterior</div>
          <div className="bs-val" style={{ color: acum > 0 ? 'var(--df-success)' : 'var(--text2)' }}>{acum > 0 ? '+' : ''} {formatCLP(acum)}</div>
        </div>
        <div className="budget-summary-item">
          <div className="bs-label">💰 Total disponible</div>
          <div className="bs-val" style={{ color: 'var(--df-accent)' }}>{formatCLP(disponibleTotal)}</div>
        </div>
      </div>

      <div className="budget-row">
        <div>
          <div className="budget-label">🏠 Gastos del Hogar</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.76rem' }}>Arriendo, alimentación, transporte, servicios básicos</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-orange">{pctGastos.toFixed(1)}%</span>
          <input type="number" className="plan-input" min="0" value={gastos} placeholder="0" onChange={e => onChangeGastos(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="budget-row">
        <div>
          <div className="budget-label">💳 Pago de Deudas (Plan)</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.76rem' }}>Mínimo: {formatCLP(cuotasMin)} · Edita montos en la tabla de abajo ↓</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge ${totalPagos > cuotasMin ? 'badge-green' : 'badge-blue'}`}>{pctDeudas.toFixed(1)}%</span>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--red)', textAlign: 'right', minWidth: 120 }}>{formatCLP(totalPagos)}</div>
        </div>
      </div>

      <div className="budget-total-bar" style={{ background: sobrante >= 0 ? '#f0fdf4' : '#fff1f2', border: `1.5px solid ${sobrante >= 0 ? '#86efac' : '#fca5a5'}` }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sobrante >= 0 ? '🟢 Sobrante que acumularás' : '🔴 Déficit — ajusta pagos o gastos'}</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.77rem' }}>{sobrante >= 0 ? 'Cierra el mes para guardarlo' : 'Reduce algún pago o gasto para cuadrar'}</div>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: sobrante >= 0 ? 'var(--df-success)' : 'var(--red)' }}>{formatCLP(Math.abs(sobrante))}</div>
      </div>
    </div>
  )
}
