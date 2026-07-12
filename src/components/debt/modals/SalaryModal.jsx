import { useState, useEffect } from 'react'
import Modal from '../../Modal.jsx'

export default function SalaryModal({ open, salary, onClose, onSave }) {
  const [value, setValue] = useState('')

  useEffect(() => { if (open) setValue(salary || '') }, [open, salary])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="💵 Configurar Sueldo Mensual"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => onSave(parseFloat(value) || 0)}>Guardar</button>
      </>}
    >
      <div className="debt-form-group" style={{ marginBottom: 14 }}>
        <label>Sueldo líquido mensual (CLP)</label>
        <input type="number" min="0" value={value} onChange={e => setValue(e.target.value)} placeholder="Ej: 1500000" />
      </div>
      <div style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>
        💡 Ingresa lo que recibes en tu cuenta (sueldo neto). Se usará para calcular tu capacidad de pago.
      </div>
    </Modal>
  )
}
