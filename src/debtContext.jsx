import { createContext, useContext, useEffect, useReducer } from 'react'
import { uid, applyCerrarMes } from './debtUtils.js'

const STORAGE_KEY = 'wt_debt'

const initialState = {
  salary: 0, bancos: [], mercadopago: [], casas: [], personas: [],
  gastosFijos: 0, acumulado: 0, planPagos: {}, historialMeses: [], mesActual: null,
}

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...initialState, ...JSON.parse(saved) } : initialState
  } catch {
    return initialState
  }
}

function debtReducer(state, action) {
  switch (action.type) {
    case 'SET_SALARY':
      return { ...state, salary: action.salary }
    case 'SET_GASTOS_FIJOS':
      return { ...state, gastosFijos: action.gastosFijos }
    case 'ADD_ACCOUNT':
      return {
        ...state,
        [action.accType]: [
          ...state[action.accType],
          { id: uid(), nombre: action.nombre, tipo: action.tipo, entries: [] },
        ],
      }
    case 'DELETE_ACCOUNT':
      return { ...state, [action.accType]: state[action.accType].filter(a => a.id !== action.accId) }
    case 'ADD_ENTRIES':
      return {
        ...state,
        [action.accType]: state[action.accType].map(acc =>
          acc.id === action.accId
            ? { ...acc, entries: [...acc.entries, ...action.entries.map(e => ({ ...e, id: e.id || uid() }))] }
            : acc
        ),
      }
    case 'REPLACE_ENTRIES':
      return {
        ...state,
        [action.accType]: state[action.accType].map(acc =>
          acc.id === action.accId
            ? { ...acc, entries: action.entries.map(e => ({ ...e, id: e.id || uid() })) }
            : acc
        ),
      }
    case 'DELETE_ENTRY':
      return {
        ...state,
        [action.accType]: state[action.accType].map(acc =>
          acc.id === action.accId ? { ...acc, entries: acc.entries.filter(e => e.id !== action.entryId) } : acc
        ),
      }
    case 'ADD_PERSONA':
      return { ...state, personas: [...state.personas, { id: uid(), ...action.persona }] }
    case 'DELETE_PERSONA':
      return { ...state, personas: state.personas.filter(p => p.id !== action.personaId) }
    case 'SET_PLAN_PAGO':
      return { ...state, planPagos: { ...state.planPagos, [action.debtId]: action.monto } }
    case 'CERRAR_MES':
      return applyCerrarMes(state)
    case 'CLEAR_HISTORIAL':
      return { ...state, historialMeses: [], acumulado: 0 }
    default:
      return state
  }
}

const DebtContext = createContext(null)

export function DebtProvider({ children }) {
  const [state, dispatch] = useReducer(debtReducer, undefined, load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return <DebtContext.Provider value={{ state, dispatch }}>{children}</DebtContext.Provider>
}

export const useDebt = () => useContext(DebtContext)
