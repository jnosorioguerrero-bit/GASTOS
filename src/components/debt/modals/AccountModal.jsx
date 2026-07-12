import { useState, useEffect } from 'react'
import Modal from '../../Modal.jsx'
import { ACCT_TYPES, ACCT_ICONS, ACCT_NAMES } from '../../../debtUtils.js'

export default function AccountModal({ open, accType, onClose, onSave }) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('')

  useEffect(() => {
    if (open) {
      setNombre('')
      setTipo(ACCT_TYPES[accType]?.[0]?.v || '')
    }
  }, [open, accType])

  if (!accType) return null

  function handleSave() {
    if (!nombre.trim()) { alert('Ingresa un nombre para la cuenta.'); return }
    onSave({ nombre: nombre.trim(), tipo: accType === 'mercadopago' ? 'billetera' : tipo })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${ACCT_ICONS[accType]} Nueva ${ACCT_NAMES[accType]}`}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}>Crear</button>
      </>}
    >
      <div className="debt-form-group" style={{ marginBottom: 12 }}>
        <label>Nombre de la cuenta</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Banco Chile – Visa" />
      </div>
      {accType !== 'mercadopago' && (
        <div className="debt-form-group" style={{ marginBottom: 12 }}>
          <label>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}>
            {ACCT_TYPES[accType].map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
      )}
    </Modal>
  )
}
