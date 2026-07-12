import { useState, useEffect } from 'react'
import Modal from '../../Modal.jsx'

export default function EntryModal({ open, onClose, onSave }) {
  const [desc, setDesc] = useState('')
  const [cuota, setCuota] = useState('')
  const [cuotasT, setCuotasT] = useState('')
  const [cuotasR, setCuotasR] = useState('')
  const [tasa, setTasa] = useState('0')
  const [deuda, setDeuda] = useState('')

  useEffect(() => {
    if (open) { setDesc(''); setCuota(''); setCuotasT(''); setCuotasR(''); setTasa('0'); setDeuda('') }
  }, [open])

  function autoDeuda(c, r) {
    const cN = parseFloat(c) || 0, rN = parseFloat(r) || 0
    if (cN && rN) setDeuda(String(Math.round(cN * rN)))
  }

  function handleSave() {
    if (!desc.trim()) { alert('Ingresa una descripción.'); return }
    const cuotaN = parseFloat(cuota) || 0
    if (!cuotaN) { alert('Ingresa la cuota mensual.'); return }
    const cuotasRN = parseFloat(cuotasR) || 0
    onSave({
      descripcion: desc.trim(), cuotaMensual: cuotaN,
      cuotasTotal: parseFloat(cuotasT) || 0, cuotasRestantes: cuotasRN,
      tasaAnual: parseFloat(tasa) || 0,
      deudaRestante: parseFloat(deuda) || (cuotaN * (cuotasRN || 1)),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      large
      title="➕ Agregar Deuda Manual"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
      </>}
    >
      <div className="form-grid">
        <div className="debt-form-group" style={{ gridColumn: '1/-1' }}>
          <label>Descripción *</label>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder='Ej: TV Samsung 55&quot;' />
        </div>
        <div className="debt-form-group">
          <label>Cuota Mensual (CLP) *</label>
          <input type="number" min="0" value={cuota} onChange={e => { setCuota(e.target.value); autoDeuda(e.target.value, cuotasR) }} placeholder="50000" />
        </div>
        <div className="debt-form-group">
          <label>Cuotas Totales</label>
          <input type="number" min="1" value={cuotasT} onChange={e => setCuotasT(e.target.value)} placeholder="12" />
        </div>
        <div className="debt-form-group">
          <label>Cuotas Restantes</label>
          <input type="number" min="0" value={cuotasR} onChange={e => { setCuotasR(e.target.value); autoDeuda(cuota, e.target.value) }} placeholder="8" />
        </div>
        <div className="debt-form-group">
          <label>Tasa Anual (%)</label>
          <input type="number" min="0" step="0.1" value={tasa} onChange={e => setTasa(e.target.value)} />
        </div>
        <div className="debt-form-group">
          <label>Deuda Restante (CLP)</label>
          <input type="number" min="0" value={deuda} onChange={e => setDeuda(e.target.value)} placeholder="Auto-calculada" />
        </div>
      </div>
    </Modal>
  )
}
