import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useApp } from '../AppContext.jsx'
import { groupByMonth, groupByCategory, formatCLP, CATEGORIES, isInCurrentPeriod } from '../categories.js'

export default function ChartsView() {
  const { expenses, billingCycles } = useApp()

  // Gasto real: excluye transferencias/pagos de TC (no son consumo)
  const realExpenses = expenses.filter(tx => tx.category !== 'transfers')

  const monthlyData  = groupByMonth(realExpenses, billingCycles)
  const categoryData = groupByCategory(realExpenses.filter(tx => {
    return isInCurrentPeriod(tx, billingCycles)
  }))

  const fmtMonth = (m) => {
    const [y, mo] = m.split('-')
    return new Date(y, mo - 1).toLocaleDateString('es-CL', { month: 'short' })
  }

  return (
    <div className="page">
      <div className="page-header"><h2>Resumen</h2></div>

      <div className="chart-card">
        <h3>Gasto por mes</h3>
        {monthlyData.length === 0
          ? <p className="center-msg">Sin datos</p>
          : <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
                <Tooltip
                  formatter={(v) => [formatCLP(v), 'Gasto']}
                  labelFormatter={fmtMonth}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        }
      </div>

      <div className="chart-card">
        <h3>Categorías (este mes)</h3>
        {categoryData.length === 0
          ? <p className="center-msg">Sin datos este mes</p>
          : <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCLP(v)} />
                <Legend
                  formatter={(value) => {
                    const cat = categoryData.find(c => c.label === value)
                    return `${cat?.emoji || ''} ${value}`
                  }}
                  iconSize={10}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
        }
      </div>
    </div>
  )
}
