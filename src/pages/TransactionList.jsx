import { useState } from 'react'
import { useApp } from '../AppContext.jsx'
import { CATEGORIES, formatCLP, formatTxDate } from '../categories.js'

export default function TransactionList() {
  const { transactions, expenses, income, loading, error, refresh } = useApp()
  const [view, setView] = useState('todos')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const source = view === 'todos' ? transactions : view === 'gastos' ? expenses : income
  const filtered = source.filter(tx => {
    const matchSearch = tx.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || tx.category === filterCat
    return matchSearch && matchCat
  })

  return (
    <div className="page">
      <div className="page-header">
        <h2>Movimientos</h2>
        <button className="icon-btn" onClick={() => refresh()} title="Actualizar">↻</button>
      </div>

      <div className="chip-row">
        <button
          className={`chip ${view === 'todos' ? 'active' : ''}`}
          onClick={() => setView('todos')}
        >📋 Todos</button>
        <button
          className={`chip ${view === 'gastos' ? 'active' : ''}`}
          onClick={() => setView('gastos')}
        >💳 Gastos</button>
        <button
          className={`chip ${view === 'ingresos' ? 'active' : ''}`}
          onClick={() => setView('ingresos')}
        >💰 Ingresos</button>
      </div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="🔍 Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="chip-row">
        <button
          className={`chip ${filterCat === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCat('all')}
        >Todos</button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`chip ${filterCat === key ? 'active' : ''}`}
            onClick={() => setFilterCat(key)}
          >{cat.emoji} {cat.label}</button>
        ))}
      </div>

      {loading && <div className="center-msg">⏳ Cargando...</div>}
      {error   && <div className="center-msg error">⚠️ {error}</div>}

      {!loading && !error && (
        <div className="tx-list">
          {filtered.length === 0
            ? <div className="center-msg">Sin resultados</div>
            : filtered.map(tx => <TxRow key={tx.id} tx={tx} />)
          }
        </div>
      )}
    </div>
  )
}

function TxRow({ tx }) {
  const { splitTags, splitConfig, toggleSplitTag } = useApp()
  const cat = CATEGORIES[tx.category] || CATEGORIES.other
  const date = formatTxDate(tx.date)
  const isIncome = tx.amount > 0
  const isPareja = splitTags[tx.id]?.type === 'pareja'
  const pct = splitConfig.pareja?.pct ?? 40

  return (
    <div className="tx-row">
      <div className="tx-emoji" style={{ background: cat.color + '22' }}>{cat.emoji}</div>
      <div className="tx-info">
        <span className="tx-desc">{tx.description}</span>
        <span className="tx-meta">
          {cat.label} · {date}
          {isPareja && <span className="tx-split-badge"> · 👥 Pareja {pct}%</span>}
        </span>
      </div>
      {!isIncome && (
        <button
          className={`tx-split-btn ${isPareja ? 'active' : ''}`}
          onClick={() => toggleSplitTag(tx.id, 'pareja')}
          title={isPareja ? 'Quitar división con pareja' : 'Marcar como gasto con pareja'}
        >👥</button>
      )}
      <span className={`tx-amount ${isIncome ? 'income' : ''}`}>{isIncome ? '+' : ''}{formatCLP(tx.amount)}</span>
    </div>
  )
}
