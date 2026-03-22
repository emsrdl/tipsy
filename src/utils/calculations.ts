/**
 * @file src/utils/calculations.ts
 * @description Pure mathematical utility functions for tip calculations.
 *
 * All functions in this module are pure (no side effects, no state).
 * All monetary values are in integer euro cents.
 *
 * @see src/lib/tipCalculator.ts for the main distribution algorithm
 * @see src/hooks/useDenominationMatcher.ts for the matching algorithm
 *
 * @example
 * import { percentageOf, roundToNearest, clampInt } from '@/utils/calculations'
 */

/**
 * Calculates a percentage of a value in integer cents.
 * Uses floor rounding for consistency with tipCalculator pool allocation.
 *
 * @param totalCents - The total amount in cents
 * @param percent - The percentage (0–100)
 * @returns Floor-rounded result in cents
 *
 * @example
 * percentageOf(10000, 30) // 3000  (30% of €100)
 * percentageOf(10000, 33) // 3300  (33% of €100)
 * percentageOf(999, 50)   // 499   (floor of 499.5)
 */
export function percentageOf(totalCents: number, percent: number): number {
  return Math.floor((totalCents * percent) / 100);
}

/**
 * Rounds a cent amount to the nearest multiple of a given unit.
 * For example, round to nearest €0.50 (50 cents) or nearest €1 (100 cents).
 *
 * @param amountCents - The amount to round
 * @param unitCents - The unit to round to (must be > 0)
 * @returns The rounded amount in cents
 *
 * @example
 * roundToNearest(1234, 100) // 1200 (nearest €1)
 * roundToNearest(1250, 100) // 1300 (nearest €1, rounds up at midpoint)
 * roundToNearest(1234, 50)  // 1250 (nearest 50ct)
 * roundToNearest(1234, 1)   // 1234 (already at 1ct precision)
 */
export function roundToNearest(amountCents: number, unitCents: number): number {
  if (unitCents <= 0) return amountCents;
  return Math.round(amountCents / unitCents) * unitCents;
}

/**
 * Clamps a value to a non-negative integer.
 *
 * @param value - Input value
 * @returns Non-negative integer (floor of max(0, value))
 *
 * @example
 * clampInt(3.7)  // 3
 * clampInt(-5)   // 0
 * clampInt(0)    // 0
 * clampInt(100)  // 100
 */
export function clampInt(value: number): number {
  return Math.floor(Math.max(0, value));
}

/**
 * Distributes a total amount into N proportional shares with exact integer cents.
 *
 * Uses the largest-remainder method: each share gets floor(exact share),
 * then remaining cents are distributed one at a time to the shares
 * with the largest fractional parts.
 *
 * The sum of returned shares always equals totalCents exactly.
 *
 * @param totalCents - Total to distribute (non-negative integer)
 * @param weights - Array of non-negative weights (e.g. hours worked)
 * @returns Array of integer cent amounts, same length as weights
 *
 * @example
 * proportionalSplit(10000, [8, 4, 4])
 * // [5000, 2500, 2500]  — 8/(8+4+4)=50%, 4/16=25%, 4/16=25%
 *
 * @example
 * proportionalSplit(100, [1, 1, 1])
 * // [34, 33, 33]  — one person gets the extra cent
 *
 * @example
 * proportionalSplit(0, [5, 5])
 * // [0, 0]
 */
export function proportionalSplit(totalCents: number, weights: number[]): number[] {
  if (weights.length === 0) return [];

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0 || totalCents <= 0) {
    return weights.map(() => 0);
  }

  // Compute exact fractional shares
  const exact = weights.map((w) => (totalCents * w) / totalWeight);
  const floored = exact.map((v) => Math.floor(v));
  const fractionals = exact.map((v, i) => ({
    index: i,
    frac: v - floored[i]!,
  }));

  let remainder = totalCents - floored.reduce((s, v) => s + v, 0);

  // Sort by fractional part descending, break ties by index ascending (deterministic)
  fractionals.sort((a, b) => b.frac - a.frac || a.index - b.index);

  for (const f of fractionals) {
    if (remainder <= 0) break;
    floored[f.index]! += 1;
    remainder--;
  }

  return floored;
}

/**
 * Computes the mean of an array of numbers.
 * Returns 0 for empty arrays.
 *
 * @param values - Array of numbers
 * @returns The arithmetic mean
 *
 * @example
 * mean([10, 20, 30]) // 20
 * mean([])           // 0
 * mean([5])          // 5
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Computes the tip amount per hour worked for a given amount and hours.
 * Returns 0 when hours is 0 to avoid division by zero.
 *
 * @param amountCents - The tip amount in cents
 * @param hours - Hours worked
 * @returns Amount per hour in cents (not rounded — caller decides formatting)
 *
 * @example
 * tipPerHour(8000, 8) // 1000 (€10.00/hr)
 * tipPerHour(8000, 0) // 0
 */
export function tipPerHour(amountCents: number, hours: number): number {
  if (hours <= 0) return 0;
  return amountCents / hours;
}

/**
 * Calculates a standard-deviation-like fairness metric.
 * Given an array of deviations from ideal (can be positive or negative),
 * returns the root-mean-square deviation.
 *
 * @param deviations - Array of deviation values in cents
 * @returns Root-mean-square deviation in cents
 *
 * @example
 * rmsd([5, -5, 0, 0])  // ~3.54
 * rmsd([0, 0, 0])      // 0 (perfect)
 * rmsd([])             // 0
 */
export function rmsd(deviations: number[]): number {
  if (deviations.length === 0) return 0;
  const sumSquares = deviations.reduce((sum, d) => sum + d * d, 0);
  return Math.sqrt(sumSquares / deviations.length);
}
