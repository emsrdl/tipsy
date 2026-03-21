/**
 * @file src/hooks/useShifts.ts
 * @description Hook for shift persistence in localStorage.
 *
 * @see src/types/shift.ts for Shift type
 *
 * @example
 * const { shifts, addShift, deleteShift, clearHistory } = useShifts()
 */

import { useCallback } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Shift } from '@/types/shift'

const SHIFTS_KEY = 'tipsy_shifts'

export interface UseShiftsReturn {
  /** All saved shifts. */
  shifts: Shift[]
  /** Add a new shift to history. */
  addShift: (shift: Shift) => void
  /** Add multiple shifts (e.g. from import). */
  addShifts: (newShifts: Shift[]) => void
  /** Update an existing shift by ID. */
  updateShift: (id: string, updates: Partial<Omit<Shift, 'id'>>) => void
  /** Delete a shift by ID. */
  deleteShift: (id: string) => void
  /** Clear all shift history. */
  clearHistory: () => void
}

/**
 * Hook for managing shift history in localStorage.
 * Must be used within a component tree (uses useLocalStorage internally).
 */
export function useShifts(): UseShiftsReturn {
  const [shifts, setShifts] = useLocalStorage<Shift[]>(SHIFTS_KEY, [])

  const addShift = useCallback(
    (shift: Shift) => {
      setShifts((prev) => [shift, ...prev])
    },
    [setShifts]
  )

  const addShifts = useCallback(
    (newShifts: Shift[]) => {
      setShifts((prev) => [...newShifts, ...prev])
    },
    [setShifts]
  )

  const updateShift = useCallback(
    (id: string, updates: Partial<Omit<Shift, 'id'>>) => {
      setShifts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      )
    },
    [setShifts]
  )

  const deleteShift = useCallback(
    (id: string) => {
      setShifts((prev) => prev.filter((s) => s.id !== id))
    },
    [setShifts]
  )

  const clearHistory = useCallback(() => {
    setShifts([])
  }, [setShifts])

  return { shifts, addShift, addShifts, updateShift, deleteShift, clearHistory }
}
