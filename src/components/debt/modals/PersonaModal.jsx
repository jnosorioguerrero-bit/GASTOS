import { useState, useEffect } from 'react'
import Modal from '../../Modal.jsx'
import { calcAmortizedCuota } from '../../../debtUtils.js'

export default function PersonaModal({ open, onClose, onSave }) {
  const [nombre, setNombre] = useState('')
  const [total, setTotal] = useState('')
  const [pagado, setPagado] = useState('0')
  const [tasa, setTasa] = useState('0')
  const [plazo, setPlazo] = useState('')
  const [cuota, setCuota] = useState('')
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    if (open) {
      setNombre(''); setTotal(''); setPagado('0'); setTasa('0'); setPlazo(''); setCuota(''); setNotas('')
      setFecha(new Date().toISOString().split('T')[0])
    }
  }, [open])

  function recalc(nextTotal, nextPagado, nextTasa, nextPlazo) {
    const restante = (parseFloat(nextTotal) || 0) - (parseFloat(nextPagado) || 0)
    const plazoN = parseFloat(nextPlazo) || 0
    if (restante > 0 && plazoN > 0) {
      setCuota(String(Math.round(calcAmortizedCuota(restante, parseFloat(nextTasa) || 0, plazoN))))
    }
  }

  function handleSave() {
    if (!nombre.trim()) { alert('Ingresa el nombre del acreedor.'); return }
    const totalN = parseFloat(total) || 0
    if (!totalN) { alert('Ingresa el monto total de la deuda.'); return }
    onSave({
      nombre: nombre.trim(), montoTotal: totalN,
      montoPagado: parseFloat(pagado) || 0, tasaMensual: parseFloat(tasa) || 0,
      plazoMeses: parseFloat(plazo) || 0, cuotaMensual: parseFloat(cuota) || 0,
      fechaAcuerdo: fecha, notas: notas.trim(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      large
      title="👤 Deuda con Persona Natural"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
      </>}
    >
      <div className="form-grid" style={{ marginBottom: 14 }}>
        <div className="debt-form-group" style={{ gridColumn: '1/-1' }}>
          <label>Nombre del acreedor *</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" />
        </div>
        <div className="debt-form-group">
          <label>Monto total de la deuda (CLP) *</label>
          <input type="number" min="0" value={total} onChange={e => { setTotal(e.target.value); recalc(e.target.value, pagado, tasa, plazo) }} placeholder="500000" />
        </div>
        <div className="debt-form-group">
          <label>Ya pagado (CLP)</label>
          <input type="number" min="0" value={pagado} onChange={e => { setPagado(e.target.value); recalc(total, e.target.value, tasa, plazo) }} placeholder="0" />
        </div>
        <div className="debt-form-group">
          <label>Tasa de interés mensual (%)</label>
          <input type="number" min="0" step="0.1" value={tasa} onChange={e => { setTasa(e.target.value); recalc(total, pagado, e.target.value, plazo) }} placeholder="0" />
        </div>
        <div className="debt-form-group">
          <label>Plazo restante (meses)</label>
          <input type="number" min="1" value={plazo} onChange={e => { setPlazo(e.target.value); recalc(total, pagado, tasa, e.target.value) }} placeholder="12" />
        </div>
        <div className="debt-form-group">
          <label>Cuota mensual acordada (CLP)</label>
          <input type="number" value={cuota} onChange={e => setCuota(e.target.value)} placeholder="Auto-calculada" />
        </div>
        <div className="debt-form-group">
          <label>Fecha del acuerdo</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
        <div className="debt-form-group" style={{ gridColumn: '1/-1' }}>
          <label>Notas</label>
          <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Contexto o condiciones acordadas..." />
        </div>
      </div>
    </Modal>
  )
}
