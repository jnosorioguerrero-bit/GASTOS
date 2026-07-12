import { useState } from 'react'
import { useApp } from '../../AppContext.jsx'
import { formatCLP } from '../../categories.js'
import KpiCard from '../../components/debt/KpiCard.jsx'

export default function PorCobrarView() {
  const {
    expenses, splitTags, splitConfig, saveSplitConfig,
    partnerOwedTotal, partnerSettledTotal, partnerBalance,
    partnerSettlements, addPartnerSettlement, toggleSplitTag,
  } = useApp()
  const [pctInput, setPctInput] = useState(splitConfig.pareja?.pct ?? 40)
  const [settleAmount, setSettleAmount] = useState('')

  const taggedTx = expenses.filter(tx => splitTags[tx.id]?.type === 'pareja')
  const pct = splitConfig.pareja?.pct ?? 40

  function handleSavePct() {
    const n = parseFloat(pctInput)
    if (!n || n <= 0 || n > 100) { alert('Ingresa un porcentaje válido (1-100).'); return }
    saveSplitConfig({ ...splitConfig, pareja: { pct: n } })
  }

  function handleAddSettlement() {
    const n = parseFloat(settleAmount)
    if (!n || n <= 0) { alert('Ingresa un monto válido.'); return }
    addPartnerSettlement(n)
    setSettleAmount('')
  }

  return (
    <div className="page">
      <div className="sec-head">
        <h2>🤝 Por Cobrar</h2>
      </div>
      <p style={{ padding: '0 16px 12px', color: 'var(--text2)', fontSize: 13 }}>
        Marca gastos "con pareja" desde Movimientos (ícono 👥) para llevar la cuenta de cuánto te debe.
        No afecta tus totales de Gastos — es un registro aparte, para evitar contar el reembolso dos veces.
      </p>

      <div className="kpi-grid">
        <KpiCard
          label="Pareja te debe (acumulado)"
          value={formatCLP(partnerOwedTotal)}
          sub={`${taggedTx.length} gasto${taggedTx.length !== 1 ? 's' : ''} marcado${taggedTx.length !== 1 ? 's' : ''}`}
        />
        <KpiCard label="Ya recibido" value={formatCLP(partnerSettledTotal)} variant="success" />
        <KpiCard
          label={partnerBalance > 0 ? 'Saldo pendiente' : 'A favor tuyo'}
          value={partnerBalance > 0 ? formatCLP(partnerBalance) : (partnerBalance < 0 ? `+${formatCLP(partnerBalance)}` : '$0')}
          sub={partnerBalance < 0 ? 'Recibiste más de lo marcado' : undefined}
          variant={partnerBalance > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="debt-card">
        <div className="debt-card-title" style={{ marginBottom: 12 }}>⚙️ Porcentaje de pareja</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" className="plan-input" min="1" max="100" value={pctInput} onChange={e => setPctInput(e.target.value)} />
          <span>%</span>
          <button className="btn btn-primary btn-sm" onClick={handleSavePct}>Guardar</button>
        </div>
      </div>

      <div className="debt-card">
        <div className="debt-card-title" style={{ marginBottom: 12 }}>💸 Registrar pago recibido</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" className="plan-input" min="0" placeholder="Monto" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} style={{ width: 160 }} />
          <button className="btn btn-primary btn-sm" onClick={handleAddSettlement}>+ Registrar</button>
        </div>
        {partnerSettlements.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="debt-table">
              <thead><tr><th>Fecha</th><th className="text-right">Monto</th></tr></thead>
              <tbody>
                {partnerSettlements.slice().reverse().map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.date).toLocaleDateString('es-CL')}</td>
                    <td className="text-right">{formatCLP(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="debt-card">
        <div className="debt-card-title" style={{ marginBottom: 12 }}>📋 Gastos marcados con pareja</div>
        {taggedTx.length === 0 ? (
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Sin gastos marcados aún.</p>
        ) : (
          <div className="table-wrap">
            <table className="debt-table">
              <thead>
                <tr><th>Descripción</th><th className="text-right">Monto</th><th className="text-right">{pct}% pareja</th><th></th></tr>
              </thead>
              <tbody>
                {taggedTx.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.description}</td>
                    <td className="text-right">{formatCLP(tx.amount)}</td>
                    <td className="text-right" style={{ color: 'var(--red)', fontWeight: 700 }}>{formatCLP(Math.abs(tx.amount) * pct / 100)}</td>
                    <td><button className="btn btn-ghost btn-xs" onClick={() => toggleSplitTag(tx.id, 'pareja')}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
