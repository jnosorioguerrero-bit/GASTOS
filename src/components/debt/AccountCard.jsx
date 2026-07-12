import { useState } from 'react'
import { formatCLP } from '../../categories.js'
import { TYPE_BADGE, TYPE_LABEL } from '../../debtUtils.js'
import Badge from './Badge.jsx'
import EntriesTable from './EntriesTable.jsx'

export default function AccountCard({ account, onDelete, onDeleteEntry, onImport, onAddManual, onImportStatement }) {
  const [open, setOpen] = useState(false)
  const entries = account.entries || []
  const totalDeuda = entries.reduce((s, e) => s + (e.deudaRestante || 0), 0)
  const totalCuota = entries.reduce((s, e) => s + (e.cuotaMensual || 0), 0)

  return (
    <div className="account-card">
      <div className="account-card-header" onClick={() => setOpen(o => !o)}>
        <div>
          <div className="account-name">
            {account.nombre} <Badge variant={TYPE_BADGE[account.tipo] || 'blue'}>{TYPE_LABEL[account.tipo] || account.tipo}</Badge>
          </div>
          <div className="account-meta">
            {entries.length} deuda{entries.length !== 1 ? 's' : ''} · Cuota: <strong>{formatCLP(totalCuota)}/mes</strong> · Deuda: <strong style={{ color: 'var(--red)' }}>{formatCLP(totalDeuda)}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); onDelete() }}>🗑️</button>
          <span style={{ color: 'var(--text2)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="account-card-body">
          <div className="btn-row" style={{ marginBottom: 12 }}>
            <button className="btn btn-outline btn-sm" onClick={onImport}>📤 Importar Excel</button>
            {onImportStatement && (
              <button className="btn btn-outline btn-sm" onClick={onImportStatement}>📄 Estado de Cuenta (Banco de Chile)</button>
            )}
            <button className="btn btn-primary btn-sm" onClick={onAddManual}>+ Agregar manual</button>
          </div>
          <EntriesTable entries={entries} onDelete={onDeleteEntry} />
        </div>
      )}
    </div>
  )
}
