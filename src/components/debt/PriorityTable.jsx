import { useState } from 'react'
import { formatCLP } from '../../categories.js'
import { getPlanPago, TIPO_BADGE } from '../../debtUtils.js'
import Badge from './Badge.jsx'

export default function PriorityTable({ state, debts, onChangePlan }) {
  const [mode, setMode] = useState('avalanche')

  if (!debts.length) {
    return (
      <div className="debt-card">
        <div className="debt-card-header">
          <div className="debt-card-title">🎯 Plan de Pago Recomendado</div>
        </div>
        <p style={{ textAlign: 'center', padding: 28, color: 'var(--text2)' }}>Sin deudas registradas aún.</p>
      </div>
    )
  }

  const sorted = [...debts].sort((a, b) =>
    mode === 'avalanche' ? b.tasaAnual - a.tasaAnual : a.deudaRestante - b.deudaRestante
  )

  return (
    <div className="debt-card">
      <div className="debt-card-header">
        <div className="debt-card-title">🎯 Plan de Pago Recomendado</div>
        <div className="toggle-group">
          <button className={`toggle-btn ${mode === 'avalanche' ? 'active' : ''}`} onClick={() => setMode('avalanche')}>🔥 Avalanche</button>
          <button className={`toggle-btn ${mode === 'snowball' ? 'active' : ''}`} onClick={() => setMode('snowball')}>❄️ Snowball</button>
        </div>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '0.81rem', marginBottom: 12 }}>
        {mode === 'avalanche'
          ? '🔥 Avalanche: paga primero la deuda con mayor tasa de interés. Maximiza el ahorro en intereses a largo plazo.'
          : '❄️ Snowball: paga primero la deuda más pequeña. Genera impulso psicológico con victorias rápidas.'}
      </p>
      <div className="table-wrap">
        <table className="debt-table">
          <thead>
            <tr>
              <th>#</th><th>Deuda</th><th>Entidad</th>
              <th className="text-right">Deuda Restante</th><th className="text-right">Cuota Mínima</th>
              <th>✏️ Pagarás Este Mes</th><th className="text-right">Tasa Anual</th><th>Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => {
              const pc = i === 0 ? 'prio-1' : i === 1 ? 'prio-2' : 'prio-3'
              const pt = i === 0 ? '🔴 Alta' : i === 1 ? '🟡 Media' : '🟢 Normal'
              const planMonto = getPlanPago(state, d.id, d.cuotaMensual)
              const esExtra = planMonto > d.cuotaMensual
              return (
                <tr key={d.id}>
                  <td><strong className={pc}>{i + 1}</strong></td>
                  <td>{d.nombre}</td>
                  <td><Badge variant={TIPO_BADGE[d.tipo] || 'blue'}>{d.tipo}</Badge></td>
                  <td className="text-right" style={{ color: 'var(--red)', fontWeight: 700 }}>{formatCLP(d.deudaRestante)}</td>
                  <td className="text-right">{formatCLP(d.cuotaMensual)}</td>
                  <td>
                    <input
                      type="number" min="0" className={`plan-input ${esExtra ? 'over-min' : ''}`}
                      value={planMonto}
                      onChange={e => onChangePlan(d.id, parseFloat(e.target.value) || 0)}
                    />
                    {esExtra && <div className="extra-tag">+{formatCLP(planMonto - d.cuotaMensual)} extra ✓</div>}
                  </td>
                  <td className="text-right">{d.tasaAnual > 0 ? `${d.tasaAnual}%` : '–'}</td>
                  <td className={pc}>{pt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
