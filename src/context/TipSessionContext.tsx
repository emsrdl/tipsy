/**
 * @file src/context/TipSessionContext.tsx
 * @description React context for the active tip distribution session.
 *
 * Manages the full session state: employees, split config, denomination
 * quantities, and calculated results.
 *
 * State flows through three steps:
 *   1. Setup → update employees and split
 *   2. Cash input → update denominations
 *   3. Calculate → run tipCalculator and store results
 *
 * The session can be reset at any time (e.g. "new shift").
 *
 * @see src/types/session.ts for TipSession type
 * @see src/lib/tipCalculator.ts for the calculation logic
 * @see src/hooks/useTipCalculator.ts for the consumer hook
 *
 * @example
 * <TipSessionProvider><App /></TipSessionProvider>
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { TipSession, TipSplit, DistributionResult } from '@/types/session'
import type { Employee } from '@/types/employee'
import { calculateDistribution } from '@/lib/tipCalculator'
import { sumDenominations } from '@/lib/denominationParser'
import { DENOMINATIONS } from '@/config/currency'

const DEFAULT_SESSION: TipSession = {
  employees: [],
  split: { kitchenPercent: 30, servicePercent: 70 },
  denominations: DENOMINATIONS.map((d) => ({ denominationId: d.id, quantity: 0 })),
  results: null,
}

export interface TipSessionContextValue {
  session: TipSession
  /** Total cash in euro cents (derived from denominations). */
  totalInCents: number
  addEmployee: (employee: Employee) => void
  removeEmployee: (id: string) => void
  updateEmployee: (id: string, updates: Partial<Omit<Employee, 'id'>>) => void
  setSplit: (split: TipSplit) => void
  setDenominationQuantity: (denominationId: string, quantity: number) => void
  calculate: () => DistributionResult[]
  reset: () => void
}

const TipSessionContext = createContext<TipSessionContextValue | null>(null)

interface TipSessionProviderProps {
  children: ReactNode
  /** Optional initial session (used in tests via renderWithProviders). */
  initialSession?: TipSession
}

/**
 * Provides tip session state and mutation actions to the component tree.
 */
export function TipSessionProvider({ children, initialSession }: TipSessionProviderProps) {
  const [session, setSession] = useState<TipSession>(initialSession ?? DEFAULT_SESSION)

  const totalInCents = sumDenominations(session.denominations, DENOMINATIONS)

  const addEmployee = useCallback((employee: Employee) => {
    setSession((s) => ({ ...s, results: null, employees: [...s.employees, employee] }))
  }, [])

  const removeEmployee = useCallback((id: string) => {
    setSession((s) => ({
      ...s,
      results: null,
      employees: s.employees.filter((e) => e.id !== id),
    }))
  }, [])

  const updateEmployee = useCallback((id: string, updates: Partial<Omit<Employee, 'id'>>) => {
    setSession((s) => ({
      ...s,
      results: null,
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }))
  }, [])

  const setSplit = useCallback((split: TipSplit) => {
    setSession((s) => ({ ...s, results: null, split }))
  }, [])

  const setDenominationQuantity = useCallback((denominationId: string, quantity: number) => {
    setSession((s) => ({
      ...s,
      results: null,
      denominations: s.denominations.map((d) =>
        d.denominationId === denominationId ? { ...d, quantity } : d
      ),
    }))
  }, [])

  const calculate = useCallback((): DistributionResult[] => {
    const results = calculateDistribution({
      totalInCents,
      employees: session.employees,
      split: session.split,
    })
    setSession((s) => ({ ...s, results }))
    return results
  }, [totalInCents, session.employees, session.split])

  const reset = useCallback(() => {
    setSession(DEFAULT_SESSION)
  }, [])

  return (
    <TipSessionContext.Provider
      value={{
        session,
        totalInCents,
        addEmployee,
        removeEmployee,
        updateEmployee,
        setSplit,
        setDenominationQuantity,
        calculate,
        reset,
      }}
    >
      {children}
    </TipSessionContext.Provider>
  )
}

export function useTipSessionContext(): TipSessionContextValue {
  const ctx = useContext(TipSessionContext)
  if (!ctx) throw new Error('useTipSessionContext must be used inside TipSessionProvider')
  return ctx
}
