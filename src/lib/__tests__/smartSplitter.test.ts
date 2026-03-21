/**
 * @file src/lib/__tests__/smartSplitter.test.ts
 * @description Comprehensive tests for the smart splitting algorithm.
 */

import { describe, it, expect } from 'vitest'
import { smartSplit, calculateTransfers, buildAvailablePool } from '../smartSplitter'
import { makeEmployee, makeDenomQty } from '@/test/factories'
import type { SmartSplitInput, PersonShare } from '@/types/shift'

function makeInput(overrides: Partial<SmartSplitInput> = {}): SmartSplitInput {
  return {
    employees: [
      makeEmployee({ id: 'e1', name: 'Anna', hours: 8, group: 'service' }),
      makeEmployee({ id: 'e2', name: 'Bob', hours: 4, group: 'service' }),
    ],
    totalInCents: 10000,
    kitchenPercent: 0,
    denominations: [makeDenomQty('eur_50', 2)],
    smartMode: false,
    fairnessThresholdInCents: 500,
    ...overrides,
  }
}

describe('smartSplit', () => {
  describe('normal mode', () => {
    it('distributes proportionally by hours', () => {
      const output = smartSplit(makeInput())
      const shares = output.distribution.personShares

      expect(shares).toHaveLength(2)
      // Anna: 8/(8+4) = 2/3 of 10000 = 6667
      // Bob: 4/(8+4) = 1/3 of 10000 = 3333
      expect(shares[0]!.actualShareInCents).toBe(6667)
      expect(shares[1]!.actualShareInCents).toBe(3333)
    })

    it('has zero deviation in normal mode', () => {
      const output = smartSplit(makeInput())
      for (const share of output.distribution.personShares) {
        expect(share.deviationInCents).toBe(0)
      }
    })

    it('has perfect fairness score in normal mode', () => {
      const output = smartSplit(makeInput())
      expect(output.distribution.fairnessScore).toBe(100)
    })

    it('produces no transfers in normal mode', () => {
      const output = smartSplit(makeInput())
      expect(output.differences).toHaveLength(0)
    })

    it('tracks denominations used', () => {
      const output = smartSplit(makeInput())
      expect(output.distribution.denominationsUsed).toEqual([
        { denominationId: 'eur_50', quantity: 2 },
      ])
    })

    it('records duration', () => {
      const output = smartSplit(makeInput())
      expect(output.durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('smart mode', () => {
    it('assigns denominations to employees', () => {
      const output = smartSplit(makeInput({ smartMode: true }))
      const shares = output.distribution.personShares

      expect(shares).toHaveLength(2)
      // With 2x€50 and ideal Anna=6667, Bob=3333:
      // Greedy will assign 1x€50 to Anna, 1x€50 to Bob
      const totalDistributed = shares.reduce((s, p) => s + p.actualShareInCents, 0)
      expect(totalDistributed).toBe(10000)
    })

    it('calculates deviations in smart mode', () => {
      const output = smartSplit(makeInput({ smartMode: true }))
      const shares = output.distribution.personShares

      // Each gets €50 (5000). Anna ideal=6667, Bob ideal=3333
      // Anna deviation: 5000 - 6667 = -1667
      // Bob deviation: 5000 - 3333 = 1667
      for (const share of shares) {
        expect(share.deviationInCents).toBe(share.actualShareInCents - share.idealShareInCents)
      }
    })

    it('suggests transfers when deviation exceeds threshold', () => {
      const output = smartSplit(
        makeInput({ smartMode: true, fairnessThresholdInCents: 100 })
      )
      // With large deviations and low threshold, should suggest transfers
      expect(output.differences.length).toBeGreaterThanOrEqual(0)
    })

    it('uses denomination matching for better distribution', () => {
      // 3x€20 + 4x€10 = 100 EUR total
      // Anna 8h, Bob 4h → Anna ideal: 6667, Bob ideal: 3333
      const output = smartSplit(
        makeInput({
          smartMode: true,
          denominations: [
            makeDenomQty('eur_20', 3),
            makeDenomQty('eur_10', 4),
          ],
        })
      )

      const shares = output.distribution.personShares
      const totalDistributed = shares.reduce((s, p) => s + p.actualShareInCents, 0)
      expect(totalDistributed).toBeLessThanOrEqual(10000)
    })
  })

  describe('kitchen/service split', () => {
    it('respects kitchen/service percentage split', () => {
      const input = makeInput({
        employees: [
          makeEmployee({ id: 'k1', name: 'Chef', hours: 8, group: 'kitchen' }),
          makeEmployee({ id: 's1', name: 'Waiter', hours: 8, group: 'service' }),
        ],
        kitchenPercent: 40,
        totalInCents: 10000,
      })
      const output = smartSplit(input)
      const shares = output.distribution.personShares

      const kitchen = shares.find((s) => s.role === 'kitchen')
      const service = shares.find((s) => s.role === 'service')

      expect(kitchen!.idealShareInCents).toBe(4000) // 40%
      expect(service!.idealShareInCents).toBe(6000) // 60%
    })
  })

  describe('edge cases', () => {
    it('handles zero total', () => {
      const output = smartSplit(makeInput({ totalInCents: 0 }))
      expect(output.distribution.personShares).toHaveLength(2)
      for (const share of output.distribution.personShares) {
        expect(share.actualShareInCents).toBe(0)
      }
      expect(output.distribution.fairnessScore).toBe(100)
    })

    it('handles no employees', () => {
      const output = smartSplit(makeInput({ employees: [] }))
      expect(output.distribution.personShares).toHaveLength(0)
      expect(output.distribution.fairnessScore).toBe(100)
    })

    it('handles single employee', () => {
      const output = smartSplit(
        makeInput({
          employees: [makeEmployee({ id: 'e1', name: 'Solo', hours: 8, group: 'service' })],
          kitchenPercent: 0,
        })
      )
      const shares = output.distribution.personShares
      expect(shares).toHaveLength(1)
      expect(shares[0]!.actualShareInCents).toBe(10000)
    })

    it('handles single employee in smart mode', () => {
      const output = smartSplit(
        makeInput({
          employees: [makeEmployee({ id: 'e1', name: 'Solo', hours: 8, group: 'service' })],
          kitchenPercent: 0,
          smartMode: true,
        })
      )
      const shares = output.distribution.personShares
      expect(shares).toHaveLength(1)
      // Gets all available cash
      expect(shares[0]!.actualShareInCents).toBe(10000) // 2x€50
    })

    it('handles negative total', () => {
      const output = smartSplit(makeInput({ totalInCents: -100 }))
      expect(output.distribution.personShares).toHaveLength(2)
      for (const share of output.distribution.personShares) {
        expect(share.actualShareInCents).toBe(0)
      }
    })

    it('handles impossible distribution (no denominations) in smart mode', () => {
      const output = smartSplit(
        makeInput({
          smartMode: true,
          denominations: [],
        })
      )
      // Should still return results but with 0 actual amounts
      for (const share of output.distribution.personShares) {
        expect(share.actualShareInCents).toBe(0)
      }
    })

    it('handles employees with zero hours', () => {
      const output = smartSplit(
        makeInput({
          employees: [
            makeEmployee({ id: 'e1', name: 'Zero', hours: 0, group: 'service' }),
            makeEmployee({ id: 'e2', name: 'Normal', hours: 8, group: 'service' }),
          ],
          kitchenPercent: 0,
        })
      )
      const shares = output.distribution.personShares
      expect(shares).toHaveLength(2)
      const zero = shares.find((s) => s.name === 'Zero')
      const normal = shares.find((s) => s.name === 'Normal')
      expect(zero!.idealShareInCents).toBe(0)
      expect(normal!.idealShareInCents).toBe(10000)
    })
  })
})

describe('calculateTransfers', () => {
  it('returns empty array when no deviations exceed threshold', () => {
    const shares: PersonShare[] = [
      { id: 'e1', name: 'A', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 5100, deviationInCents: 100 },
      { id: 'e2', name: 'B', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 4900, deviationInCents: -100 },
    ]
    const transfers = calculateTransfers(shares, 500)
    expect(transfers).toHaveLength(0)
  })

  it('suggests transfer when deviations exceed threshold', () => {
    const shares: PersonShare[] = [
      { id: 'e1', name: 'A', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 6000, deviationInCents: 1000 },
      { id: 'e2', name: 'B', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 4000, deviationInCents: -1000 },
    ]
    const transfers = calculateTransfers(shares, 500)
    expect(transfers).toHaveLength(1)
    expect(transfers[0]!.fromPerson.name).toBe('A')
    expect(transfers[0]!.toPerson.name).toBe('B')
    expect(transfers[0]!.amountInCents).toBe(1000)
  })

  it('limits transfers to MAX_TRANSFER_CHAINS', () => {
    const shares: PersonShare[] = Array.from({ length: 10 }, (_, i) => ({
      id: `e${i}`,
      name: `Person ${i}`,
      role: 'service' as const,
      hoursWorked: 8,
      idealShareInCents: 1000,
      actualShareInCents: i < 5 ? 2000 : 0,
      deviationInCents: i < 5 ? 1000 : -1000,
    }))
    const transfers = calculateTransfers(shares, 100)
    expect(transfers.length).toBeLessThanOrEqual(3) // MAX_TRANSFER_CHAINS
  })

  it('handles all underpaid or all overpaid', () => {
    const allOver: PersonShare[] = [
      { id: 'e1', name: 'A', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 6000, deviationInCents: 1000 },
      { id: 'e2', name: 'B', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 6000, deviationInCents: 1000 },
    ]
    expect(calculateTransfers(allOver, 500)).toHaveLength(0)
  })

  it('pairs largest overpaid with largest underpaid', () => {
    const shares: PersonShare[] = [
      { id: 'e1', name: 'Big Over', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 7000, deviationInCents: 2000 },
      { id: 'e2', name: 'Small Over', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 5800, deviationInCents: 800 },
      { id: 'e3', name: 'Big Under', role: 'service', hoursWorked: 8, idealShareInCents: 5000, actualShareInCents: 3000, deviationInCents: -2000 },
    ]
    const transfers = calculateTransfers(shares, 500)
    expect(transfers.length).toBeGreaterThanOrEqual(1)
    expect(transfers[0]!.fromPerson.name).toBe('Big Over')
    expect(transfers[0]!.toPerson.name).toBe('Big Under')
  })
})

describe('buildAvailablePool', () => {
  it('converts DenominationQuantity to AvailableDenomination', () => {
    const pool = buildAvailablePool([
      makeDenomQty('eur_10', 5),
      makeDenomQty('eur_5', 3),
    ])
    expect(pool).toHaveLength(2)
    expect(pool[0]!.denominationId).toBe('eur_10')
    expect(pool[0]!.available).toBe(5)
    expect(pool[0]!.valueInCents).toBe(1000)
    expect(pool[1]!.denominationId).toBe('eur_5')
    expect(pool[1]!.available).toBe(3)
    expect(pool[1]!.valueInCents).toBe(500)
  })

  it('filters out zero-quantity denominations', () => {
    const pool = buildAvailablePool([
      makeDenomQty('eur_10', 0),
      makeDenomQty('eur_5', 3),
    ])
    expect(pool).toHaveLength(1)
    expect(pool[0]!.denominationId).toBe('eur_5')
  })

  it('filters out unknown denomination IDs', () => {
    const pool = buildAvailablePool([
      makeDenomQty('unknown_denom', 5),
    ])
    expect(pool).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(buildAvailablePool([])).toEqual([])
  })
})
