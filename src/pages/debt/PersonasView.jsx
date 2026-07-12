import { useState } from 'react'
import { useDebt } from '../../debtContext.jsx'
import { formatCLP } from '../../categories.js'
import PersonaModal from '../../components/debt/modals/PersonaModal.jsx'
import ProgressBar from '../../components/debt/ProgressBar.jsx'

export default function PersonasView() {
  const { state, dispatch } = useDebt()
  const [showModal, setShowModal] = useState(false)

  function handleSave(persona) {
    dispatch({ type: 'ADD_PERSONA', persona })
    setShowModal(false)
  }

  function handleDelete(id) {
    if (!confirm('¿Eliminar esta deuda?')) return
    dispatch({ type: 'DELETE_PERSONA', personaId: id })
  }

  return (
    <div className="page">
      <div className="sec-head">
        <h2>👤 Deudas con Personas Naturales</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Agregar Deuda</button>
      </div>
      <p style={{ padding: '0 16px 12px', color: 'var(--text2)', fontSize: 13 }}>
        Registra deudas con amigos, familiares u otras personas. Puedes indicar si hay interés acordado.
      </p>

      {state.personas.length === 0 ? (
        <div className="debt-card">
          <div className="debt-empty">
            <div className="debt-empty-icon">👤</div>
            <h3>Sin deudas registradas</h3>
            <p>Agrega deudas con personas para un control completo</p>
          </div>
        </div>
      ) : (
        state.personas.map(p => {
          const restante = Math.max(0, p.montoTotal - (p.montoPagado || 0))
          const pctP = p.montoTotal ? Math.round(((p.montoPagado || 0) / p.montoTotal) * 100) : 0
          const barColor = pctP < 30 ? 'var(--red)' : pctP < 70 ? 'var(--df-warning)' : 'var(--df-success)'
          return (
            <div className="debt-card" key={p.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>👤 {p.nombre}</div>
                  {p.notas && <div style={{ color: 'var(--text2)', marginTop: 3 }}>{p.notas}</div>}
                  {p.fechaAcuerdo && <div style={{ color: 'var(--text2)' }}>📅 Desde: {p.fechaAcuerdo}</div>}
                </div>
                <button className="btn btn-ghost btn-xs" onClick={() => handleDelete(p.id)}>🗑️</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginTop: 14 }}>
                <div><div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>Monto Total</div><div style={{ fontWeight: 700 }}>{formatCLP(p.montoTotal)}</div></div>
                <div><div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>Ya Pagado</div><div style={{ fontWeight: 700, color: 'var(--green)' }}>{formatCLP(p.montoPagado || 0)}</div></div>
                <div><div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>Deuda Restante</div><div style={{ fontWeight: 700, color: 'var(--red)' }}>{formatCLP(restante)}</div></div>
                <div><div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>Cuota/Mes</div><div style={{ fontWeight: 700 }}>{p.cuotaMensual ? formatCLP(p.cuotaMensual) : '–'}</div></div>
                <div><div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>Interés Mensual</div><div style={{ fontWeight: 700 }}>{p.tasaMensual ? `${p.tasaMensual}%` : 'Sin interés'}</div></div>
                <div><div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>Plazo</div><div style={{ fontWeight: 700 }}>{p.plazoMeses ? `${p.plazoMeses} meses` : '–'}</div></div>
              </div>
              <div className="persona-progress">
                <div className="persona-progress-label"><span>Progreso de pago</span><span>{pctP}%</span></div>
                <ProgressBar pct={pctP} color={barColor} />
              </div>
            </div>
          )
        })
      )}

      <PersonaModal open={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
    </div>
  )
}
