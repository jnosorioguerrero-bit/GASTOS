export default function Modal({ open, onClose, title, large, children, footer }) {
  if (!open) return null
  return (
    <div className="modal-bd open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal ${large ? 'modal-lg' : ''}`}>
        <div className="modal-title">{title}</div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
