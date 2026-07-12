import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'

export default function AccountCycleSettingsModal({ open, accounts, cycles, onClose, onSave }) {
  const [days, setDays] = useState({})

  useEffect(() => {
    if (open) {
      const initial = {}
      accounts.forEach(acc => { initial[acc.id] = cycles?.[acc.id]?.closingDay || '' })
      setDays(initial)
    }
  }, [open, accounts, cycles])

  function handleSave() {
    const next = {}
    Object.entries(days).forEach(([accountId, day]) => {
      const n = parseInt(day, 10)
      if (n >= 1 && n <= 31) next[accountId] = { closingDay: n }
    })
    onSave(next)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      large
      title="⚙️ Ciclo de facturación por cuenta"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
      </>}
    >
      <p style={{ color: 'var(--text2)', fontSize: '0.83rem', marginBottom: 12 }}>
        Configura el día en que cierra el estado de cuenta de cada tarjeta/cuenta para que los totales de
        "este mes" calcen con tu estado de cuenta real, en vez de usar el mes calendario. Déjalo vacío para
        seguir usando mes calendario.
      </p>
      {accounts.length === 0 && <p className="center-msg">No hay cuentas conectadas.</p>}
      {accounts.map(acc => (
        <div className="debt-form-group" key={acc.id} style={{ marginBottom: 12 }}>
          <label>{acc.name || acc.official_name || acc.id}</label>
          <input
            type="number" min="1" max="31" placeholder="Día de cierre (opcional)"
            value={days[acc.id] ?? ''}
            onChange={e => setDays(d => ({ ...d, [acc.id]: e.target.value }))}
          />
        </div>
      ))}
    </Modal>
  )
}
