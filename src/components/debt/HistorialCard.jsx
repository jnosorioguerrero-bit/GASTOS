import { formatCLP } from '../../categories.js'

export default function HistorialCard({ historialMeses, onLimpiar }) {
  if (!historialMeses.length) return null
  return (
    <div className="debt-card">
      <div className="debt-card-header">
        <div className="debt-card-title">📅 Historial de Meses Cerrados</div>
        <button className="btn btn-ghost btn-sm" onClick={onLimpiar}>🗑️ Limpiar</button>
      </div>
      <div className="table-wrap">
        <table className="debt-table">
          <thead>
            <tr>
              <th>Mes</th><th className="text-right">Sueldo</th><th className="text-right">Acum. anterior</th>
              <th className="text-right">Total disponible</th><th className="text-right">Gastos hogar</th>
              <th className="text-right">Pagos deuda</th><th className="text-right">Sobrante acumulado</th>
            </tr>
          </thead>
          <tbody>
            {historialMeses.map((m, i) => {
              const disponible = m.sueldo + m.acumAnterior
              const resultado = m.sobrante || m.deficit
              return (
                <tr key={i}>
                  <td><strong>{m.fecha}</strong></td>
                  <td className="text-right">{formatCLP(m.sueldo)}</td>
                  <td className="text-right" style={{ color: 'var(--df-success)' }}>{m.acumAnterior > 0 ? '+' : ''} {formatCLP(m.acumAnterior)}</td>
                  <td className="text-right" style={{ fontWeight: 700, color: 'var(--df-accent)' }}>{formatCLP(disponible)}</td>
                  <td className="text-right">{formatCLP(m.gastos)}</td>
                  <td className="text-right" style={{ color: 'var(--red)' }}>{formatCLP(m.pagosDeuda)}</td>
                  <td className="text-right" style={{ fontWeight: 700, color: resultado > 0 ? 'var(--df-success)' : 'var(--red)' }}>{formatCLP(resultado)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
