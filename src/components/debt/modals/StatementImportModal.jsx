import Modal from '../../Modal.jsx'
import { formatCLP } from '../../../categories.js'

export default function StatementImportModal({ data, currentCount, onClose, onConfirm }) {
  if (!data) return null
  const { entries, meta } = data

  return (
    <Modal
      open
      onClose={onClose}
      large
      title="📄 Importar estado de cuenta"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={entries.length === 0} onClick={() => onConfirm(entries)}>
          Reemplazar {currentCount} deuda{currentCount !== 1 ? 's' : ''} por {entries.length}
        </button>
      </>}
    >
      {meta?.fechaFacturacion && (
        <p style={{ color: 'var(--text2)', fontSize: '0.83rem', marginBottom: 12 }}>
          Estado de cuenta al {meta.fechaFacturacion}
          {meta.montoFacturado ? ` · Monto facturado: ${formatCLP(meta.montoFacturado)}` : ''}
        </p>
      )}
      <p style={{ fontSize: '0.85rem', marginBottom: 10 }}>
        Se encontraron <strong>{entries.length}</strong> compra{entries.length !== 1 ? 's' : ''} en cuotas con saldo pendiente.
        Esto <strong>reemplazará</strong> las {currentCount} deuda{currentCount !== 1 ? 's' : ''} actuales de esta cuenta
        (las compras al contado y cargos/comisiones/impuestos del mes no se incluyen, no son deuda pendiente).
      </p>
      <div className="table-wrap">
        <table className="debt-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th className="text-right">Cuota</th>
              <th className="text-right">Restantes</th>
              <th className="text-right">Deuda</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td>{e.descripcion}</td>
                <td className="text-right">{formatCLP(e.cuotaMensual)}</td>
                <td className="text-right">{e.cuotasRestantes}/{e.cuotasTotal}</td>
                <td className="text-right" style={{ color: 'var(--red)', fontWeight: 700 }}>{formatCLP(e.deudaRestante)}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--text2)' }}>
                No se encontraron cuotas pendientes en este estado de cuenta.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
