import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useApp } from '../AppContext.jsx'
import { groupCashFlowByMonth, formatCLP } from '../categories.js'

export default function BalanceView() {
  const { transactions, billingCycles } = useApp()

  const monthly = groupCashFlowByMonth(transactions, billingCycles)
  const current = monthly[monthly.length - 1] || { income: 0, expense: 0, transfer: 0 }
  const net = current.income - current.expense - current.transfer

  const fmtMonth = (m) => {
    const [y, mo] = m.split('-')
    return new Date(y, mo - 1).toLocaleDateString('es-CL', { month: 'short' })
  }

  return (
    <div className="page">
      <div className="page-header"><h2>Balance</h2></div>

      <div className={`total-card ${net < 0 ? 'negative' : ''}`}>
        <div className="total-label">Balance neto (este mes)</div>
        <div className="total-amount">{net < 0 ? '-' : '+'}{formatCLP(net)}</div>
      </div>

      <div className="flow-list">
        <div className="flow-row">
          <span>💰 Ingresos</span>
          <span className="flow-amount income">+{formatCLP(current.income)}</span>
        </div>
        <div className="flow-row">
          <span>🛒 Gastos</span>
          <span className="flow-amount expense">-{formatCLP(current.expense)}</span>
        </div>
        <div className="flow-row">
          <span>💸 Transferencias / pagos TC</span>
          <span className="flow-amount transfer">-{formatCLP(current.transfer)}</span>
        </div>
      </div>

      <div className="chart-card">
        <h3>Ingresos vs gastos por mes</h3>
        {monthly.length === 0
          ? <p className="center-msg">Sin datos</p>
          : <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
                <Tooltip
                  formatter={(v, name) => [formatCLP(v), name]}
                  labelFormatter={fmtMonth}
                />
                <Legend
                  formatter={(value) => ({ income: 'Ingresos', expense: 'Gastos', transfer: 'Transferencias' }[value] || value)}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="income"   name="income"   fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense"  name="expense"  fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="transfer" name="transfer" fill="#6b7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        }
      </div>
    </div>
  )
}
