export default function SubNav({ tabs, active, onSelect, variant }) {
  return (
    <nav className={`sub-nav ${variant || ''}`}>
      {tabs.map(t => (
        <button
          key={t.id}
          className={`sub-nav-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </nav>
  )
}
