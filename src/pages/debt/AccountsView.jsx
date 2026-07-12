import { useState } from 'react'
import { useDebt } from '../../debtContext.jsx'
import { ACCT_ICONS, ACCT_NAMES } from '../../debtUtils.js'
import AccountCard from '../../components/debt/AccountCard.jsx'
import AccountModal from '../../components/debt/modals/AccountModal.jsx'
import EntryModal from '../../components/debt/modals/EntryModal.jsx'
import ColumnMapModal from '../../components/debt/modals/ColumnMapModal.jsx'
import StatementImportModal from '../../components/debt/modals/StatementImportModal.jsx'
import { readWorkbook, readWorkbookRaw, downloadTemplate } from '../../xlsxImport.js'
import { parseBancoChileStatement } from '../../statementParser.js'

const SECTION_TITLE = { bancos: 'Cuentas Bancarias', mercadopago: 'Mercado Pago / Billeteras', casas: 'Casas Comerciales' }
const TEMPLATE_KEY = { bancos: 'banco', mercadopago: 'mercadopago', casas: 'casa' }
const PLURAL = { bancos: 'cuentas bancarias', mercadopago: 'billeteras', casas: 'tarjetas comerciales' }

export default function AccountsView({ type }) {
  const { state, dispatch } = useDebt()
  const accounts = state[type]

  const [showAccountModal, setShowAccountModal] = useState(false)
  const [entryModalAccId, setEntryModalAccId] = useState(null)
  const [mapModalData, setMapModalData] = useState(null)
  const [statementModalData, setStatementModalData] = useState(null)

  function handleAddAccount({ nombre, tipo }) {
    dispatch({ type: 'ADD_ACCOUNT', accType: type, nombre, tipo })
    setShowAccountModal(false)
  }

  function handleDeleteAccount(accId) {
    if (!confirm('¿Eliminar esta cuenta y todas sus deudas?')) return
    dispatch({ type: 'DELETE_ACCOUNT', accType: type, accId })
  }

  function handleDeleteEntry(accId, entryId) {
    dispatch({ type: 'DELETE_ENTRY', accType: type, accId, entryId })
  }

  function handleAddManual(entry) {
    dispatch({ type: 'ADD_ENTRIES', accType: type, accId: entryModalAccId, entries: [entry] })
    setEntryModalAccId(null)
  }

  async function handleImport(accId, file) {
    if (!file) return
    try {
      const { headers, rows } = await readWorkbook(file)
      if (rows.length === 0) { alert('El archivo no tiene datos suficientes.'); return }
      setMapModalData({ accId, headers, rows })
    } catch {
      alert('No se pudo leer el archivo. Asegúrate de que sea .xlsx, .xls o .csv válido.')
    }
  }

  function triggerImport(accId) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.onchange = e => handleImport(accId, e.target.files[0])
    input.click()
  }

  function handleConfirmMap(entries) {
    dispatch({ type: 'ADD_ENTRIES', accType: type, accId: mapModalData.accId, entries })
    setMapModalData(null)
    alert(`✅ Se importaron ${entries.length} deuda(s) correctamente.`)
  }

  async function handleImportStatement(accId, file) {
    if (!file) return
    try {
      const rows = await readWorkbookRaw(file)
      const data = parseBancoChileStatement(rows)
      setStatementModalData({ accId, ...data })
    } catch (err) {
      alert(err.message || 'No se pudo leer este estado de cuenta.')
    }
  }

  function triggerImportStatement(accId) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.onchange = e => handleImportStatement(accId, e.target.files[0])
    input.click()
  }

  function handleConfirmStatement(entries) {
    dispatch({ type: 'REPLACE_ENTRIES', accType: type, accId: statementModalData.accId, entries })
    setStatementModalData(null)
    alert(`✅ Cuotas actualizadas desde el estado de cuenta (${entries.length} pendiente${entries.length !== 1 ? 's' : ''}).`)
  }

  return (
    <div className="page">
      <div className="sec-head">
        <h2>{ACCT_ICONS[type]} {SECTION_TITLE[type]}</h2>
        <div className="btn-row">
          <button className="btn btn-outline btn-sm" onClick={() => downloadTemplate(TEMPLATE_KEY[type])}>📥 Plantilla Excel</button>
          <button className="btn btn-primary" onClick={() => setShowAccountModal(true)}>+ Nueva {ACCT_NAMES[type]}</button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="debt-card">
          <div className="debt-empty">
            <div className="debt-empty-icon">{ACCT_ICONS[type]}</div>
            <h3>Sin {PLURAL[type]} registradas</h3>
            <p>Agrega una para comenzar</p>
          </div>
        </div>
      ) : (
        accounts.map(acc => (
          <AccountCard
            key={acc.id}
            account={acc}
            onDelete={() => handleDeleteAccount(acc.id)}
            onDeleteEntry={entryId => handleDeleteEntry(acc.id, entryId)}
            onImport={() => triggerImport(acc.id)}
            onAddManual={() => setEntryModalAccId(acc.id)}
            onImportStatement={type === 'bancos' ? () => triggerImportStatement(acc.id) : undefined}
          />
        ))
      )}

      <AccountModal open={showAccountModal} accType={type} onClose={() => setShowAccountModal(false)} onSave={handleAddAccount} />
      <EntryModal open={!!entryModalAccId} onClose={() => setEntryModalAccId(null)} onSave={handleAddManual} />
      {mapModalData && (
        <ColumnMapModal
          headers={mapModalData.headers}
          rows={mapModalData.rows}
          onClose={() => setMapModalData(null)}
          onConfirm={handleConfirmMap}
        />
      )}
      {statementModalData && (
        <StatementImportModal
          data={statementModalData}
          currentCount={accounts.find(a => a.id === statementModalData.accId)?.entries.length || 0}
          onClose={() => setStatementModalData(null)}
          onConfirm={handleConfirmStatement}
        />
      )}
    </div>
  )
}
