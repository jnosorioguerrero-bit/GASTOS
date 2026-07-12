import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { google } from 'googleapis'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const FINTOC_SECRET_KEY = process.env.FINTOC_SECRET_KEY
const FINTOC_BASE_URL = 'https://api.fintoc.com/v1'

if (!FINTOC_SECRET_KEY) {
  console.warn('⚠️  FINTOC_SECRET_KEY no está definida. Configúrala en .env (ver .env.example)')
}

// Lee/escribe en Sheets con el Service Account que ya usa extractor.py
// (Gemini Gastos). En local se carga desde un archivo (SHEETS_CREDENTIALS_PATH);
// en un hosting en la nube no siempre se puede subir un archivo suelto, así que
// también se acepta el JSON completo pegado en GOOGLE_SERVICE_ACCOUNT_JSON.
const SHEETS_CREDENTIALS_PATH   = process.env.SHEETS_CREDENTIALS_PATH
const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
const SHEETS_SPREADSHEET_ID     = process.env.SHEETS_SPREADSHEET_ID
const CC_TRACKER_SHEET_NAME     = 'CCTrackerState'

if (!SHEETS_SPREADSHEET_ID || (!SHEETS_CREDENTIALS_PATH && !GOOGLE_SERVICE_ACCOUNT_JSON)) {
  console.warn('⚠️  Faltan credenciales de Sheets. Configura SHEETS_SPREADSHEET_ID y (SHEETS_CREDENTIALS_PATH o GOOGLE_SERVICE_ACCOUNT_JSON) en .env')
}

function getSheetsClient() {
  const authOptions = { scopes: ['https://www.googleapis.com/auth/spreadsheets'] }
  if (GOOGLE_SERVICE_ACCOUNT_JSON) {
    authOptions.credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON)
  } else {
    authOptions.keyFile = SHEETS_CREDENTIALS_PATH
  }
  const auth = new google.auth.GoogleAuth(authOptions)
  return google.sheets({ version: 'v4', auth })
}

// Se asegura de que exista la pestaña donde cc-tracker guarda su estado
// completo (config/expenses/payments/statements) como un único JSON en A1.
async function ensureStateSheet(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEETS_SPREADSHEET_ID })
  const exists = meta.data.sheets.some(s => s.properties.title === CC_TRACKER_SHEET_NAME)
  if (exists) return

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEETS_SPREADSHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: CC_TRACKER_SHEET_NAME } } }] },
  })
}

app.get('/api/accounts', async (req, res) => {
  const { link_token } = req.query
  if (!link_token) return res.status(400).json({ error: 'link_token requerido' })

  const r = await fetch(`${FINTOC_BASE_URL}/accounts?link_token=${encodeURIComponent(link_token)}`, {
    headers: { Authorization: FINTOC_SECRET_KEY },
  })
  res.status(r.status).type('application/json').send(await r.text())
})

app.get('/api/accounts/:accountId/movements', async (req, res) => {
  const { accountId } = req.params
  const params = new URLSearchParams(req.query)

  const r = await fetch(`${FINTOC_BASE_URL}/accounts/${encodeURIComponent(accountId)}/movements?${params}`, {
    headers: { Authorization: FINTOC_SECRET_KEY },
  })
  res.status(r.status).type('application/json').send(await r.text())
})

app.get('/api/gastos-sheet', async (req, res) => {
  if (!SHEETS_SPREADSHEET_ID || (!SHEETS_CREDENTIALS_PATH && !GOOGLE_SERVICE_ACCOUNT_JSON)) {
    return res.status(500).json({ error: 'Faltan credenciales de Sheets en .env' })
  }
  try {
    const sheets = getSheetsClient()
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_SPREADSHEET_ID,
      range: 'A2:F',
    })
    const rows = result.data.values || []
    const transactions = rows
      .filter(r => r[0] && r[2])
      .map(r => ({
        date:        r[0] || '',
        description: r[1] || 'Sin descripción',
        amount:      Number(String(r[2]).replace(/[^\d.-]/g, '')) || 0,
        bank:        r[3] || '',
        medio:       r[4] || '',
        refId:       r[5] || '',
      }))
    res.json(transactions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Estado completo de cc-tracker (config, expenses, payments, statements),
// guardado como un único JSON en la celda A1 de su propia pestaña — así
// varios dispositivos pueden leer/escribir el mismo estado en vez de cada
// uno guardar solo en su localStorage.
app.get('/api/cctracker/state', async (req, res) => {
  if (!SHEETS_SPREADSHEET_ID || (!SHEETS_CREDENTIALS_PATH && !GOOGLE_SERVICE_ACCOUNT_JSON)) {
    return res.status(500).json({ error: 'Faltan credenciales de Sheets en .env' })
  }
  try {
    const sheets = getSheetsClient()
    await ensureStateSheet(sheets)
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_SPREADSHEET_ID,
      range: `${CC_TRACKER_SHEET_NAME}!A1`,
    })
    const raw = result.data.values?.[0]?.[0]
    res.json(raw ? JSON.parse(raw) : {})
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/cctracker/state', async (req, res) => {
  if (!SHEETS_SPREADSHEET_ID || (!SHEETS_CREDENTIALS_PATH && !GOOGLE_SERVICE_ACCOUNT_JSON)) {
    return res.status(500).json({ error: 'Faltan credenciales de Sheets en .env' })
  }
  try {
    const sheets = getSheetsClient()
    await ensureStateSheet(sheets)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEETS_SPREADSHEET_ID,
      range: `${CC_TRACKER_SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [[JSON.stringify(req.body)]] },
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Render (y la mayoría de los hostings) inyectan PORT y esperan que el
// servidor escuche justo ahí; en local seguimos usando API_PORT (o 8787).
const PORT = process.env.PORT || process.env.API_PORT || 8787
app.listen(PORT, () => console.log(`Fintoc proxy backend en http://localhost:${PORT}`))
