import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './AppContext.jsx'
import { DebtProvider } from './debtContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <DebtProvider>
        <App />
      </DebtProvider>
    </AppProvider>
  </React.StrictMode>
)
