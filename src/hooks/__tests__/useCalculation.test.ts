import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCalculation } from '@/hooks/useCalculation'
import { makeEmployee, makeSplit } from '@/test/factories'
import type { CalculateDistributionInput } from '@/lib/tipCalculator'

describe('useCalculation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  const makeInput = (
    overrides: Partial<CalculateDistributionInput> = {}
  ): CalculateDistributionInput => ({
    totalInCents: 10000,
    employees: [
      makeEmployee({ id: 'e1', name: 'Anna', hours: 8, group: 'service' }),
      makeEmployee({ id: 'e2', name: 'Bob', hours: 4, group: 'service' }),
    ],
    split: makeSplit({ kitchenPercent: 0, servicePercent: 100 }),
    ...overrides,
  })

  describe('calculation', () => {
    it('returns results for valid input', () => {
      const { result } = renderHook(() => useCalculation(makeInput()))
      expect(result.current.results).toHaveLength(2)
      expect(result.current.results[0]!.name).toBe('Anna')
      expect(result.current.results[1]!.name).toBe('Bob')
    })

    it('distributes proportionally by hours', () => {
      const { result } = renderHook(() => useCalculation(makeInput()))
      // 8h:4h = 2:1 ratio
      const anna = result.current.results.find((r) => r.name === 'Anna')!
      const bob = result.current.results.find((r) => r.name === 'Bob')!
      expect(anna.amountInCents + bob.amountInCents).toBe(10000)
      expect(anna.amountInCents).toBeGreaterThan(bob.amountInCents)
    })

    it('returns empty array for null input', () => {
      const { result } = renderHook(() => useCalculation(null))
      expect(result.current.results).toEqual([])
    })

    it('returns empty array for zero total', () => {
      const input = makeInput({ totalInCents: 0 })
      const { result } = renderHook(() => useCalculation(input))
      expect(result.current.results).toEqual([])
    })

    it('returns empty array for empty employees', () => {
      const input = makeInput({ employees: [] })
      const { result } = renderHook(() => useCalculation(input))
      expect(result.current.results).toEqual([])
    })
  })

  describe('history', () => {
    it('starts with empty history', () => {
      const { result } = renderHook(() => useCalculation(null))
      expect(result.current.history).toEqual([])
    })

    it('saves results to history', () => {
      const { result } = renderHook(() => useCalculation(makeInput()))

      act(() => {
        result.current.saveToHistory()
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0]!.totalInCents).toBe(10000)
      expect(result.current.history[0]!.employeeCount).toBe(2)
      expect(result.current.history[0]!.results).toHaveLength(2)
    })

    it('does not save when results are empty', () => {
      const { result } = renderHook(() => useCalculation(null))

      act(() => {
        result.current.saveToHistory()
      })

      expect(result.current.history).toHaveLength(0)
    })

    it('adds newest entries first', () => {
      const input1 = makeInput({ totalInCents: 5000 })
      const input2 = makeInput({ totalInCents: 8000 })

      const { result, rerender } = renderHook(
        ({ input }) => useCalculation(input),
        { initialProps: { input: input1 as CalculateDistributionInput | null } }
      )

      act(() => {
        result.current.saveToHistory()
      })

      rerender({ input: input2 })

      act(() => {
        result.current.saveToHistory()
      })

      expect(result.current.history).toHaveLength(2)
      expect(result.current.history[0]!.totalInCents).toBe(8000)
      expect(result.current.history[1]!.totalInCents).toBe(5000)
    })

    it('clears all history', () => {
      const { result } = renderHook(() => useCalculation(makeInput()))

      act(() => {
        result.current.saveToHistory()
        result.current.saveToHistory()
      })

      expect(result.current.history.length).toBeGreaterThan(0)

      act(() => {
        result.current.clearHistory()
      })

      expect(result.current.history).toEqual([])
    })

    it('removes a single history entry by id', () => {
      const { result } = renderHook(() => useCalculation(makeInput()))

      act(() => {
        result.current.saveToHistory()
        result.current.saveToHistory()
      })

      const idToRemove = result.current.history[0]!.id

      act(() => {
        result.current.removeHistoryEntry(idToRemove)
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0]!.id).not.toBe(idToRemove)
    })

    it('persists history to localStorage', () => {
      const { result } = renderHook(() => useCalculation(makeInput()))

      act(() => {
        result.current.saveToHistory()
      })

      const stored = JSON.parse(localStorage.getItem('tipsy-history')!)
      expect(stored).toHaveLength(1)
    })

    it('generates unique ids for entries', () => {
      const { result } = renderHook(() => useCalculation(makeInput()))

      act(() => {
        result.current.saveToHistory()
        result.current.saveToHistory()
        result.current.saveToHistory()
      })

      const ids = result.current.history.map((h) => h.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('includes ISO timestamp in entries', () => {
      const { result } = renderHook(() => useCalculation(makeInput()))

      act(() => {
        result.current.saveToHistory()
      })

      const timestamp = result.current.history[0]!.timestamp
      expect(() => new Date(timestamp)).not.toThrow()
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })
  })
})
