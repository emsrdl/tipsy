/**
 * @file src/lib/denominationParser.ts
 * @description Converts denomination quantities to a total in euro cents.
 *
 * @see src/config/currency.ts for the DENOMINATIONS array
 * @see src/types/session.ts for DenominationQuantity type
 *
 * @example
 * import { sumDenominations } from '@/lib/denominationParser'
 * const total = sumDenominations(
 *   [{ denominationId: 'eur_10', quantity: 5 }],
 *   DENOMINATIONS
 * )
 * // total === 5000 (5 × €10 = €50.00 = 5000 cents)
 */

import type { DenominationQuantity } from '@/types/session'
import type { Denomination } from '@/config/currency'

/**
 * Sums a list of denomination quantities into a total in euro cents.
 *
 * Unknown denomination ids are silently skipped (returns 0 for that entry).
 * Fractional quantities are floored to the nearest integer before multiplying.
 *
 * @param quantities - Array of denomination id + quantity pairs
 * @param denominations - Reference list of all denominations with valueInCents
 * @returns Total amount in euro cents (integer)
 *
 * @example
 * sumDenominations(
 *   [{ denominationId: 'eur_20', quantity: 3 }, { denominationId: 'eur_1', quantity: 2 }],
 *   DENOMINATIONS
 * )
 * // 3 × 2000 + 2 × 100 = 6200
 */
export function sumDenominations(
  quantities: DenominationQuantity[],
  denominations: Denomination[]
): number {
  const valueMap = new Map<string, number>(
    denominations.map((d) => [d.id, d.valueInCents])
  )

  return quantities.reduce((total, { denominationId, quantity }) => {
    const value = valueMap.get(denominationId)
    if (value === undefined) return total
    // Floor quantity to prevent fractional cent issues
    return total + value * Math.floor(quantity)
  }, 0)
}
