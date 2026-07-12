import { formatCLP } from '../../categories.js'

export default function EntriesTable({ entries, onDelete }) {
  if (!entries.length) {
    return (
      <div className="debt-empty" style={{ padding: 20 }}>
        <div className="debt-empty-icon" style={{ fontSize: '1.8rem' }}>📋</div>
        <p>Sin deudas. Importa un Excel o agrega manualmente.</p>
      </div>
    )
  }
  return (
    <div className="table-wrap">
      <table className="debt-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th className="text-right">Cuota/Mes</th>
            <th className="text-right">Cuotas Rest./Total</th>
            <th className="text-right">Tasa Anual</th>
            <th className="text-right">Deuda Restante</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id}>
              <td>{e.descripcion || '–'}</td>
              <td className="text-right" style={{ fontWeight: 700 }}>{formatCLP(e.cuotaMensual)}</td>
              <td className="text-right">{e.cuotasRestantes ?? '?'} / {e.cuotasTotal ?? '?'}</td>
              <td className="text-right">{e.tasaAnual ? `${e.tasaAnual}%` : '–'}</td>
              <td className="text-right" style={{ color: 'var(--red)', fontWeight: 700 }}>{formatCLP(e.deudaRestante)}</td>
              <td><button className="btn btn-ghost btn-xs" onClick={() => onDelete(e.id)}>🗑️</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
