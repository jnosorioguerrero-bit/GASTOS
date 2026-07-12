import { useState, useEffect } from 'react'
import Modal from '../../Modal.jsx'
import { FIELDS, autoMapColumn, buildEntriesFromRows } from '../../../xlsxImport.js'

export default function ColumnMapModal({ headers, rows, onClose, onConfirm }) {
  const [mapping, setMapping] = useState({})

  useEffect(() => {
    const initial = {}
    FIELDS.forEach(f => {
      const idx = autoMapColumn(headers, f.k)
      initial[f.k] = idx >= 0 ? idx : null
    })
    setMapping(initial)
  }, [headers])

  function handleConfirm() {
    for (const f of FIELDS.filter(f => f.req)) {
      if (mapping[f.k] === null || mapping[f.k] === undefined) {
        alert(`El campo "${f.label}" es obligatorio.`)
        return
      }
    }
    onConfirm(buildEntriesFromRows(rows, mapping))
  }

  return (
    <Modal
      open
      onClose={onClose}
      large
      title="🔗 Mapear Columnas del Excel"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleConfirm}>Importar ✓</button>
      </>}
    >
      <p style={{ color: 'var(--text2)', fontSize: '0.83rem', marginBottom: 12 }}>
        Indica qué columna de tu archivo corresponde a cada campo. Los campos marcados con <strong>*</strong> son obligatorios.
      </p>
      {FIELDS.map(f => (
        <div className="debt-form-group" key={f.k} style={{ marginBottom: 12 }}>
          <label>{f.label}{f.req ? ' *' : ''}</label>
          <select
            value={mapping[f.k] ?? ''}
            onChange={e => setMapping(m => ({ ...m, [f.k]: e.target.value === '' ? null : parseInt(e.target.value) }))}
          >
            <option value="">-- No incluido --</option>
            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
          </select>
        </div>
      ))}
    </Modal>
  )
}
