import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts'
import { useDebt } from '../../debtContext.jsx'
import { formatCLP } from '../../categories.js'
import { getAllDebts } from '../../debtUtils.js'
import KpiCard from '../../components/debt/KpiCard.jsx'
import ProgressBar from '../../components/debt/ProgressBar.jsx'
import PriorityTable from '../../components/debt/PriorityTable.jsx'
import BudgetCard from '../../components/debt/BudgetCard.jsx'
import HistorialCard from '../../components/debt/HistorialCard.jsx'
import SalaryModal from '../../components/debt/modals/SalaryModal.jsx'

const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

export default function DashboardView() {
  const { state, dispatch } = useDebt()
  const [showSalary, setShowSalary] = useState(false)

  const debts = getAllDebts(state)
  const totalDeuda = debts.reduce((s, d) => s + d.deudaRestante, 0)
  const cuotasMes = debts.reduce((s, d) => s + d.cuotaMensual, 0)
  const salary = state.salary || 0
  const disponible = salary - cuotasMes
  const ratio = salary > 0 ? (cuotasMes / salary) * 100 : 0
  const ratioColor = ratio < 30 ? 'var(--df-success)' : ratio < 50 ? 'var(--df-warning)' : 'var(--red)'
  const ratioLabel = ratio < 30 ? '✅ Saludable' : ratio < 50 ? '🟡 Moderado' : '🔴 Alto – considera refinanciar'

  const pieMap = { Banco: 0, 'Mercado Pago': 0, 'Casa Comercial': 0, 'Persona Natural': 0 }
  debts.forEach(d => { pieMap[d.tipo] = (pieMap[d.tipo] || 0) + d.deudaRestante })
  const pieData = Object.entries(pieMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))

  const projMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() + i)
    return d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
  })
  const projData = projMonths.map((label, mi) => {
    const total = debts.reduce((s, d) => s + Math.max(0, d.deudaRestante - d.cuotaMensual * mi), 0)
    const r = salary > 0 ? total / salary : 99
    const color = r > 6 ? 'rgba(239,68,68,0.75)' : r > 3 ? 'rgba(245,158,11,0.75)' : 'rgba(16,185,129,0.75)'
    return { label, total, color }
  })

  function handleSaveSalary(value) {
    dispatch({ type: 'SET_SALARY', salary: value })
    setShowSalary(false)
  }

  return (
    <div className="page">
      {!salary && (
        <div className="debt-alert debt-alert-warning">
          <div style={{ fontSize: '1.3rem' }}>⚠️</div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong>Configura tu sueldo</strong> para ver tu capacidad de pago y análisis completos.
            <button className="btn btn-sm btn-outline" style={{ marginLeft: 8 }} onClick={() => setShowSalary(true)}>Configurar ahora</button>
          </div>
        </div>
      )}
      {salary > 0 && ratio > 50 && (
        <div className="debt-alert debt-alert-danger">
          <div style={{ fontSize: '1.3rem' }}>🔴</div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong>Carga financiera alta:</strong> tus cuotas superan el 50% de tu sueldo. Se recomienda buscar refinanciamiento o reducir gastos.
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard label="Sueldo Mensual" value={formatCLP(salary)} sub="Ingreso neto configurado" />
        <KpiCard label="Deuda Total" value={formatCLP(totalDeuda)} sub={salary > 0 ? `${(totalDeuda / salary).toFixed(1)} meses de sueldo` : '–'} variant="danger" />
        <KpiCard label="Cuotas Este Mes" value={formatCLP(cuotasMes)} sub={`${ratio.toFixed(1)}% del sueldo comprometido`} variant="warning" />
        <KpiCard label="Disponible Mensual" value={formatCLP(disponible)} sub="Después de pagar cuotas" variant="success" />
      </div>

      <div className="debt-card">
        <div className="debt-card-header">
          <div className="debt-card-title">📈 Carga Financiera</div>
          <span style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>{ratio.toFixed(1)}% comprometido · {ratioLabel}</span>
        </div>
        <ProgressBar pct={Math.min(ratio, 100)} color={ratioColor} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text2)', marginTop: 6 }}>
          <span>✅ Saludable (&lt;30%)</span>
          <span>🟡 Moderado (30–50%)</span>
          <span>🔴 Alto (&gt;50%)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
        <div className="debt-card">
          <div className="debt-card-title" style={{ marginBottom: 8 }}>🥧 Deuda por Tipo de Entidad</div>
          {pieData.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text2)', padding: 20 }}>Sin datos</p> : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatCLP(v)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="debt-card">
          <div className="debt-card-title" style={{ marginBottom: 8 }}>📉 Proyección 12 Meses (pagos mínimos)</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={projData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`)} tick={{ fontSize: 10 }} width={48} />
              <Tooltip formatter={v => formatCLP(v)} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {projData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <BudgetCard
        state={state}
        debts={debts}
        onChangeGastos={v => dispatch({ type: 'SET_GASTOS_FIJOS', gastosFijos: v })}
        onCerrarMes={() => {
          const fecha = new Date()
          dispatch({ type: 'CERRAR_MES' })
          alert(`✅ Mes cerrado (${fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}).\n\nDeudas actualizadas con tus pagos.`)
        }}
      />

      <PriorityTable
        state={state}
        debts={debts}
        onChangePlan={(debtId, monto) => dispatch({ type: 'SET_PLAN_PAGO', debtId, monto })}
      />

      <HistorialCard
        historialMeses={state.historialMeses}
        onLimpiar={() => { if (confirm('¿Limpiar historial y acumulado?')) dispatch({ type: 'CLEAR_HISTORIAL' }) }}
      />

      <SalaryModal open={showSalary} salary={state.salary} onClose={() => setShowSalary(false)} onSave={handleSaveSalary} />
    </div>
  )
}
