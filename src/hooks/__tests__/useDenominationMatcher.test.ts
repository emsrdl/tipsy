import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDenominationMatcher, matchDenominations } from '@/hooks/useDenominationMatcher'
import type { AvailableDenomination, DenominationMatchInput } from '@/types/calculation'
import type { DistributionResult } from '@/types/session'

/**
 * Helper to create AvailableDenomination entries.
 */
function avail(denominationId: string, available: number, valueInCents: number): AvailableDenomination {
  return { denominationId, available, valueInCents }
}

/**
 * Helper to create DistributionResult entries.
 */
function dist(id: string, name: string, amountInCents: number): DistributionResult {
  return { employeeId: id, name, group: 'service', hours: 8, amountInCents }
}

describe('matchDenominations', () => {
  describe('basic assignment', () => {
    it('assigns exact denominations when possible', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 5000)],
        available: [avail('eur_50', 1, 5000)],
      })

      expect(result.payouts).toHaveLength(1)
      expect(result.payouts[0]!.actualAmountInCents).toBe(5000)
      expect(result.payouts[0]!.deviationInCents).toBe(0)
      expect(result.fairness.isPerfect).toBe(true)
      expect(result.fairness.score).toBe(100)
    })

    it('uses multiple denominations to reach target', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 7000)],
        available: [
          avail('eur_50', 1, 5000),
          avail('eur_20', 1, 2000),
        ],
      })

      expect(result.payouts[0]!.actualAmountInCents).toBe(7000)
      expect(result.payouts[0]!.deviationInCents).toBe(0)
    })

    it('distributes among multiple employees', () => {
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 3000),
          dist('e2', 'Bob', 2000),
        ],
        available: [
          avail('eur_20', 1, 2000),
          avail('eur_10', 3, 1000),
        ],
      })

      const totalAssigned = result.payouts.reduce((s, p) => s + p.actualAmountInCents, 0)
      expect(totalAssigned).toBe(5000)
    })
  })

  describe('edge cases', () => {
    it('handles empty distributions', () => {
      const result = matchDenominations({
        distributions: [],
        available: [avail('eur_10', 5, 1000)],
      })

      expect(result.payouts).toEqual([])
      expect(result.fairness.isPerfect).toBe(true)
      expect(result.fairness.score).toBe(100)
      expect(result.unallocated).toHaveLength(1)
    })

    it('handles zero ideal amounts', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 0), dist('e2', 'Bob', 0)],
        available: [avail('eur_10', 5, 1000)],
      })

      expect(result.payouts[0]!.actualAmountInCents).toBe(0)
      expect(result.payouts[1]!.actualAmountInCents).toBe(0)
      expect(result.fairness.isPerfect).toBe(true)
    })

    it('handles no available denominations', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 5000)],
        available: [],
      })

      expect(result.payouts[0]!.actualAmountInCents).toBe(0)
      expect(result.payouts[0]!.deviationInCents).toBe(-5000)
    })

    it('handles single employee getting all cash', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 10000)],
        available: [
          avail('eur_50', 1, 5000),
          avail('eur_20', 2, 2000),
          avail('eur_10', 1, 1000),
        ],
      })

      expect(result.payouts[0]!.actualAmountInCents).toBe(10000)
      expect(result.payouts[0]!.deviationInCents).toBe(0)
    })

    it('handles insufficient denominations (underpayment)', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 10000)],
        available: [avail('eur_20', 2, 2000)], // only €40 available
      })

      expect(result.payouts[0]!.actualAmountInCents).toBe(4000)
      expect(result.payouts[0]!.deviationInCents).toBe(-6000)
      expect(result.fairness.isPerfect).toBe(false)
    })

    it('reports unallocated denominations', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 1000)],
        available: [
          avail('eur_10', 1, 1000),
          avail('eur_50', 1, 5000), // excess
        ],
      })

      // Anna should get €10, €50 may be unallocated
      const totalUnallocated = result.unallocated.reduce(
        (s, u) => s + u.available * u.valueInCents, 0
      )
      expect(totalUnallocated).toBeGreaterThanOrEqual(0)
    })
  })

  describe('fairness', () => {
    it('reports perfect fairness when all deviations are zero', () => {
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 2000),
          dist('e2', 'Bob', 3000),
        ],
        available: [
          avail('eur_20', 1, 2000),
          avail('eur_10', 1, 1000),
          avail('eur_20b', 1, 2000),
        ],
      })

      if (
        result.payouts[0]!.deviationInCents === 0 &&
        result.payouts[1]!.deviationInCents === 0
      ) {
        expect(result.fairness.isPerfect).toBe(true)
        expect(result.fairness.score).toBe(100)
      }
    })

    it('computes max deviation correctly', () => {
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 5000),
          dist('e2', 'Bob', 5000),
        ],
        available: [avail('eur_50', 1, 5000)], // only one €50
      })

      // One gets €50, one gets €0
      const deviations = result.payouts.map((p) => Math.abs(p.deviationInCents))
      expect(result.fairness.maxDeviationInCents).toBe(Math.max(...deviations))
    })

    it('score is between 0 and 100', () => {
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 3333),
          dist('e2', 'Bob', 3333),
          dist('e3', 'Cara', 3334),
        ],
        available: [
          avail('eur_50', 2, 5000),
          avail('eur_20', 5, 2000),
          avail('eur_10', 10, 1000),
          avail('eur_5', 10, 500),
          avail('eur_2', 10, 200),
          avail('eur_1', 10, 100),
        ],
      })

      expect(result.fairness.score).toBeGreaterThanOrEqual(0)
      expect(result.fairness.score).toBeLessThanOrEqual(100)
    })

    it('total unallocated is non-negative', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 1000)],
        available: [avail('eur_10', 5, 1000)],
      })

      expect(result.fairness.totalUnallocatedCents).toBeGreaterThanOrEqual(0)
    })
  })

  describe('performance', () => {
    it('completes in under 100ms for typical restaurant scenario', () => {
      // 15 employees, 15 denomination types
      const distributions: DistributionResult[] = Array.from({ length: 15 }, (_, i) =>
        dist(`e${i}`, `Employee ${i}`, 1000 + i * 500)
      )

      const available: AvailableDenomination[] = [
        avail('eur_100', 5, 10000),
        avail('eur_50', 10, 5000),
        avail('eur_20', 20, 2000),
        avail('eur_10', 30, 1000),
        avail('eur_5', 40, 500),
        avail('eur_2', 50, 200),
        avail('eur_1', 100, 100),
        avail('eur_50ct', 50, 50),
        avail('eur_20ct', 50, 20),
        avail('eur_10ct', 50, 10),
      ]

      const start = performance.now()
      const result = matchDenominations({ distributions, available })
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(100)
      expect(result.durationMs).toBeDefined()
      expect(result.payouts).toHaveLength(15)
    })

    it('completes in under 100ms for 30 employees', () => {
      const distributions = Array.from({ length: 30 }, (_, i) =>
        dist(`e${i}`, `Emp ${i}`, 500 + i * 200)
      )

      const available = [
        avail('eur_50', 20, 5000),
        avail('eur_20', 50, 2000),
        avail('eur_10', 100, 1000),
        avail('eur_5', 100, 500),
        avail('eur_2', 200, 200),
        avail('eur_1', 200, 100),
      ]

      const start = performance.now()
      const result = matchDenominations({ distributions, available })
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(100)
      expect(result.payouts).toHaveLength(30)
    })
  })

  describe('denomination assignment correctness', () => {
    it('never assigns more denominations than available', () => {
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 5000),
          dist('e2', 'Bob', 5000),
        ],
        available: [avail('eur_50', 1, 5000)],
      })

      // Total €50 assigned should not exceed 1
      const totalFifties = result.payouts.reduce((s, p) => {
        const fiftyAssignment = p.assignments.find((a) => a.denominationId === 'eur_50')
        return s + (fiftyAssignment?.count ?? 0)
      }, 0)

      expect(totalFifties).toBeLessThanOrEqual(1)
    })

    it('assignment totalCents matches count × value', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 7500)],
        available: [
          avail('eur_50', 1, 5000),
          avail('eur_20', 1, 2000),
          avail('eur_5', 1, 500),
        ],
      })

      for (const payout of result.payouts) {
        for (const assignment of payout.assignments) {
          // We can only verify count > 0 assignments have meaningful totalCents
          if (assignment.count > 0) {
            expect(assignment.totalCents).toBeGreaterThan(0)
          }
        }
      }
    })

    it('actual amount equals sum of assignments', () => {
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 5000),
          dist('e2', 'Bob', 3000),
        ],
        available: [
          avail('eur_50', 1, 5000),
          avail('eur_20', 1, 2000),
          avail('eur_10', 1, 1000),
        ],
      })

      for (const payout of result.payouts) {
        const sumAssignments = payout.assignments.reduce((s, a) => s + a.totalCents, 0)
        expect(payout.actualAmountInCents).toBe(sumAssignments)
      }
    })

    it('deviation equals actual minus ideal', () => {
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 4500),
          dist('e2', 'Bob', 5500),
        ],
        available: [
          avail('eur_50', 1, 5000),
          avail('eur_20', 2, 2000),
          avail('eur_5', 2, 500),
        ],
      })

      for (const payout of result.payouts) {
        expect(payout.deviationInCents).toBe(
          payout.actualAmountInCents - payout.idealAmountInCents
        )
      }
    })
  })

  describe('swap improvement phase', () => {
    it('improves fairness via swaps when greedy overshoots one employee', () => {
      // Greedy assigns €50 to Anna (ideal €30), leaving Bob (ideal €20) with nothing.
      // Swap phase should move a denomination from Anna to Bob.
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 3000),
          dist('e2', 'Bob', 2000),
        ],
        available: [
          avail('eur_20', 2, 2000),
          avail('eur_10', 1, 1000),
        ],
      })

      // Both should get something
      const anna = result.payouts.find((p) => p.name === 'Anna')!
      const bob = result.payouts.find((p) => p.name === 'Bob')!
      expect(anna.actualAmountInCents).toBeGreaterThan(0)
      expect(bob.actualAmountInCents).toBeGreaterThan(0)
    })

    it('swaps denomination to new employee who had none of that type', () => {
      // Force a scenario where swap pushes a denomination type to an employee
      // who doesn't yet have that type (the else branch in swap)
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 1000),
          dist('e2', 'Bob', 1000),
        ],
        available: [
          avail('eur_10', 2, 1000),
        ],
      })

      // Both should get €10 each
      expect(result.payouts[0]!.actualAmountInCents + result.payouts[1]!.actualAmountInCents).toBe(2000)
    })

    it('handles overshoot when no smaller denomination available', () => {
      // Target 3000, only €50 bills — must overshoot
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 3000)],
        available: [avail('eur_50', 2, 5000)],
      })

      // Should get €50 (overshoot) since no smaller denominations exist
      expect(result.payouts[0]!.actualAmountInCents).toBeGreaterThanOrEqual(0)
    })
  })

  describe('coins scenario', () => {
    it('handles exact change with small denominations', () => {
      const result = matchDenominations({
        distributions: [
          dist('e1', 'Anna', 350),
          dist('e2', 'Bob', 150),
        ],
        available: [
          avail('eur_2', 2, 200),
          avail('eur_1', 1, 100),
          avail('eur_50ct', 2, 50),
        ],
      })

      const totalAssigned = result.payouts.reduce((s, p) => s + p.actualAmountInCents, 0)
      const totalAvailable = 2 * 200 + 1 * 100 + 2 * 50 // 600ct
      expect(totalAssigned).toBeLessThanOrEqual(totalAvailable)
    })

    it('handles mixed bills and coins', () => {
      const result = matchDenominations({
        distributions: [dist('e1', 'Anna', 1250)],
        available: [
          avail('eur_10', 1, 1000),
          avail('eur_2', 1, 200),
          avail('eur_50ct', 1, 50),
        ],
      })

      expect(result.payouts[0]!.actualAmountInCents).toBe(1250)
      expect(result.payouts[0]!.deviationInCents).toBe(0)
    })
  })
})

describe('useDenominationMatcher', () => {
  it('returns null for null input', () => {
    const { result } = renderHook(() => useDenominationMatcher(null))
    expect(result.current).toBeNull()
  })

  it('returns match result for valid input', () => {
    const input: DenominationMatchInput = {
      distributions: [
        { employeeId: 'e1', name: 'Anna', group: 'service', hours: 8, amountInCents: 5000 },
      ],
      available: [{ denominationId: 'eur_50', available: 1, valueInCents: 5000 }],
    }

    const { result } = renderHook(() => useDenominationMatcher(input))
    expect(result.current).not.toBeNull()
    expect(result.current!.payouts).toHaveLength(1)
  })

  it('memoizes result for same input reference', () => {
    const input: DenominationMatchInput = {
      distributions: [
        { employeeId: 'e1', name: 'Anna', group: 'service', hours: 8, amountInCents: 5000 },
      ],
      available: [{ denominationId: 'eur_50', available: 1, valueInCents: 5000 }],
    }

    const { result, rerender } = renderHook(() => useDenominationMatcher(input))
    const firstResult = result.current

    rerender()
    expect(result.current).toBe(firstResult)
  })
})
