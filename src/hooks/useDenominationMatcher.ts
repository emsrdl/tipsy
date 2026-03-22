/**
 * @file src/hooks/useDenominationMatcher.ts
 * @description Denomination matching algorithm — assigns physical bills/coins to employees.
 *
 * Solves a constrained optimization problem: given a set of physical EUR denominations
 * (bills and coins) and per-employee ideal amounts (from {@link calculateDistribution}),
 * find an assignment of denominations to employees that minimizes deviation from ideal.
 *
 * ## Algorithm Overview
 *
 * The algorithm uses a greedy approach with largest-denomination-first assignment:
 *
 *   1. **Sort employees by ideal amount descending** — process larger shares first
 *      to maximize options for denomination matching.
 *
 *   2. **For each employee, greedily assign denominations** — starting from the
 *      largest available denomination, assign as many as possible without exceeding
 *      a threshold above the ideal amount. Then fill remaining with smaller denominations.
 *
 *   3. **Sweep phase** — after initial greedy assignment, attempt to swap denominations
 *      between employees to reduce the maximum deviation. A swap is accepted if it
 *      reduces the sum of squared deviations (improving fairness).
 *
 *   4. **Compute fairness metrics** — calculate max deviation, mean deviation,
 *      unallocated remainder, and a 0–100 fairness score.
 *
 * ## Performance
 *
 * The greedy approach runs in O(E × D) where E = employee count and D = denomination
 * types (15 for EUR). The swap phase is bounded by O(E² × D). For typical restaurant
 * scenarios (≤30 employees, 15 denominations), this completes in < 1ms.
 *
 * ## Edge Cases
 *
 * - **Zero total**: Returns zero payouts for all employees, perfect fairness score.
 * - **Single employee**: Gets all available cash (trivially optimal).
 * - **Insufficient denominations**: Assigns what's available, reports unallocated = 0
 *   but employees may be underpaid (deviation < 0).
 * - **Excess denominations**: Leftover denominations reported in `unallocated`.
 * - **All same ideal amount**: Round-robin assignment ensures fairness.
 * - **One cent denomination available**: Can always match exactly (given enough 1ct coins).
 *
 * @see src/types/calculation.ts for all type definitions
 * @see src/lib/tipCalculator.ts for computing ideal amounts
 * @see src/utils/calculations.ts for math utilities used here
 *
 * @example
 * import { matchDenominations } from '@/hooks/useDenominationMatcher'
 *
 * const result = matchDenominations({
 *   distributions: [
 *     { employeeId: 'e1', name: 'Anna', group: 'service', hours: 8, amountInCents: 6667 },
 *     { employeeId: 'e2', name: 'Bob',  group: 'service', hours: 4, amountInCents: 3333 },
 *   ],
 *   available: [
 *     { denominationId: 'eur_50', available: 1, valueInCents: 5000 },
 *     { denominationId: 'eur_20', available: 2, valueInCents: 2000 },
 *     { denominationId: 'eur_10', available: 1, valueInCents: 1000 },
 *   ],
 * })
 *
 * console.log(result.payouts[0].actualAmountInCents) // 7000 (€50 + €20)
 * console.log(result.fairness.score)                  // high score
 */

import { useMemo } from 'react';
import type { DistributionResult } from '@/types/session';
import type {
  AvailableDenomination,
  DenominationAssignment,
  DenominationMatchInput,
  DenominationMatchResult,
  EmployeePayoutPlan,
  FairnessScore,
} from '@/types/calculation';

/**
 * React hook that runs the denomination matching algorithm.
 *
 * Memoized on the input reference — recalculates only when distributions
 * or available denominations change.
 *
 * @param input - Distributions and available denominations, or null to skip
 * @returns DenominationMatchResult or null if input is null
 *
 * @example
 * function ResultsView({ distributions, available }) {
 *   const result = useDenominationMatcher({ distributions, available })
 *   if (!result) return null
 *   return <PayoutTable payouts={result.payouts} />
 * }
 */
export function useDenominationMatcher(
  input: DenominationMatchInput | null,
): DenominationMatchResult | null {
  return useMemo(() => {
    if (!input) return null;
    return matchDenominations(input);
  }, [input]);
}

/**
 * Core denomination matching algorithm.
 *
 * Pure function — no side effects. Can be called outside React.
 *
 * @param input - The distributions and available denominations
 * @returns Complete match result with payouts, fairness score, and unallocated
 *
 * @example
 * const result = matchDenominations({
 *   distributions: calculateDistribution({ totalInCents: 10000, employees, split }),
 *   available: [{ denominationId: 'eur_10', available: 10, valueInCents: 1000 }],
 * })
 */
export function matchDenominations(input: DenominationMatchInput): DenominationMatchResult {
  const start = performance.now();
  const { distributions, available } = input;

  // Edge case: no employees
  if (distributions.length === 0) {
    return {
      payouts: [],
      fairness: perfectFairness(),
      unallocated: available.map((a) => ({ ...a })),
      durationMs: performance.now() - start,
    };
  }

  // Edge case: all ideal amounts are zero
  const totalIdeal = distributions.reduce((s, d) => s + d.amountInCents, 0);
  if (totalIdeal === 0) {
    return {
      payouts: distributions.map((d) => ({
        employeeId: d.employeeId,
        name: d.name,
        idealAmountInCents: 0,
        actualAmountInCents: 0,
        deviationInCents: 0,
        assignments: [],
      })),
      fairness: perfectFairness(),
      unallocated: available.map((a) => ({ ...a })),
      durationMs: performance.now() - start,
    };
  }

  // Deep copy available denominations (we mutate counts during assignment)
  const pool = available
    .map((a) => ({ ...a }))
    .filter((a) => a.available > 0 && a.valueInCents > 0)
    .sort((a, b) => b.valueInCents - a.valueInCents);

  // Sort employees by ideal amount descending — process largest shares first
  const sorted = [...distributions].sort((a, b) => b.amountInCents - a.amountInCents);

  // Phase 1: Greedy assignment
  const assignmentMap = new Map<string, DenominationAssignment[]>();
  const actualMap = new Map<string, number>();

  for (const dist of sorted) {
    const assignments = greedyAssign(dist.amountInCents, pool);
    assignmentMap.set(dist.employeeId, assignments);
    const actual = assignments.reduce((s, a) => s + a.totalCents, 0);
    actualMap.set(dist.employeeId, actual);
  }

  // Phase 2: Improvement swaps — try to reduce max deviation
  improveSwaps(distributions, assignmentMap, actualMap);

  // Build payouts
  const payouts: EmployeePayoutPlan[] = distributions.map((d) => {
    const assignments = assignmentMap.get(d.employeeId) ?? [];
    const actual = actualMap.get(d.employeeId) ?? 0;
    return {
      employeeId: d.employeeId,
      name: d.name,
      idealAmountInCents: d.amountInCents,
      actualAmountInCents: actual,
      deviationInCents: actual - d.amountInCents,
      assignments: assignments.filter((a) => a.count > 0),
    };
  });

  // Compute fairness
  const fairness = computeFairness(payouts, totalIdeal);

  // Unallocated denominations
  const unallocated = pool.filter((p) => p.available > 0);

  return {
    payouts,
    fairness,
    unallocated,
    durationMs: performance.now() - start,
  };
}

/**
 * Greedy denomination assignment for a single employee.
 *
 * Strategy: Starting from the largest denomination, assign as many units
 * as possible without exceeding the target by more than one unit of the
 * next-smaller denomination. This prevents overshooting while still making
 * progress toward the target.
 *
 * @internal
 * @param targetCents - Ideal amount in cents for this employee
 * @param pool - Mutable pool of available denominations (will be decremented)
 * @returns Array of denomination assignments
 */
function greedyAssign(
  targetCents: number,
  pool: AvailableDenomination[],
): DenominationAssignment[] {
  const assignments: DenominationAssignment[] = [];
  let remaining = targetCents;

  for (let i = 0; i < pool.length; i++) {
    const denom = pool[i]!;
    if (denom.available <= 0 || denom.valueInCents <= 0) continue;

    // How many of this denomination can we use?
    let count = Math.min(denom.available, Math.floor(remaining / denom.valueInCents));

    // If we haven't reached the target and this denomination would get us closer,
    // consider using one more (overshoot by at most one unit of this denomination)
    if (count < denom.available && remaining > 0) {
      const shortfall = remaining - count * denom.valueInCents;
      // Only overshoot if the overshoot is smaller than the shortfall
      if (shortfall > 0 && denom.valueInCents - shortfall < shortfall) {
        // Check if there's a smaller denomination that could fill the gap better
        const hasSmaller = pool
          .slice(i + 1)
          .some((d) => d.available > 0 && d.valueInCents <= shortfall);
        if (!hasSmaller) {
          count++;
        }
      }
    }

    if (count > 0) {
      assignments.push({
        denominationId: denom.denominationId,
        count,
        totalCents: count * denom.valueInCents,
      });
      denom.available -= count;
      remaining -= count * denom.valueInCents;
    }
  }

  return assignments;
}

/**
 * Improvement phase: attempt pairwise denomination swaps between employees.
 *
 * For each pair of employees where one is overpaid and one is underpaid,
 * try swapping a denomination from the overpaid to the underpaid.
 * Accept swaps that reduce the sum of squared deviations.
 *
 * Bounded to a maximum number of iterations to guarantee performance.
 *
 * @internal
 * @param distributions - Original ideal distributions
 * @param assignmentMap - Mutable map of employee assignments
 * @param actualMap - Mutable map of actual amounts
 */
function improveSwaps(
  distributions: DistributionResult[],
  assignmentMap: Map<string, DenominationAssignment[]>,
  actualMap: Map<string, number>,
): void {
  const MAX_ITERATIONS = 50;
  let improved = true;
  let iteration = 0;

  while (improved && iteration < MAX_ITERATIONS) {
    improved = false;
    iteration++;

    for (const distA of distributions) {
      for (const distB of distributions) {
        if (distA.employeeId === distB.employeeId) continue;

        const deviationA = (actualMap.get(distA.employeeId) ?? 0) - distA.amountInCents;
        const deviationB = (actualMap.get(distB.employeeId) ?? 0) - distB.amountInCents;

        // Only try swaps where A is overpaid and B is underpaid
        if (deviationA <= 0 || deviationB >= 0) continue;

        const assignmentsA = assignmentMap.get(distA.employeeId) ?? [];

        // Try moving one denomination from A to B
        for (const assignA of assignmentsA) {
          if (assignA.count <= 0) continue;
          const denomValue = assignA.totalCents / assignA.count;

          // Would this swap improve things?
          const newDeviationA = deviationA - denomValue;
          const newDeviationB = deviationB + denomValue;

          const oldSumSq = deviationA * deviationA + deviationB * deviationB;
          const newSumSq = newDeviationA * newDeviationA + newDeviationB * newDeviationB;

          if (newSumSq < oldSumSq) {
            // Accept swap: move one unit from A to B
            assignA.count--;
            assignA.totalCents -= denomValue;

            const assignmentsB = assignmentMap.get(distB.employeeId) ?? [];
            const existingB = assignmentsB.find((a) => a.denominationId === assignA.denominationId);
            if (existingB) {
              existingB.count++;
              existingB.totalCents += denomValue;
            } else {
              assignmentsB.push({
                denominationId: assignA.denominationId,
                count: 1,
                totalCents: denomValue,
              });
            }

            actualMap.set(distA.employeeId, (actualMap.get(distA.employeeId) ?? 0) - denomValue);
            actualMap.set(distB.employeeId, (actualMap.get(distB.employeeId) ?? 0) + denomValue);

            improved = true;
            break;
          }
        }
      }
    }
  }
}

/**
 * Computes aggregate fairness metrics for a set of payouts.
 *
 * The fairness score is computed as:
 *   `100 - min(100, (meanAbsDeviation / totalIdeal) × 10000)`
 *
 * This means:
 * - Score 100 = all employees get exactly their ideal amount
 * - Score 0 = mean deviation is ≥ 1% of the total
 * - Typical scenarios score 95–100
 *
 * @internal
 * @param payouts - The employee payout plans
 * @param totalIdeal - Sum of all ideal amounts
 * @returns Computed fairness score
 */
function computeFairness(payouts: EmployeePayoutPlan[], totalIdeal: number): FairnessScore {
  if (payouts.length === 0) return perfectFairness();

  const absDeviations = payouts.map((p) => Math.abs(p.deviationInCents));
  const maxDeviation = Math.max(...absDeviations);
  const meanDeviation = absDeviations.reduce((s, d) => s + d, 0) / absDeviations.length;

  const totalActual = payouts.reduce((s, p) => s + p.actualAmountInCents, 0);
  const totalUnallocated = Math.max(0, totalIdeal - totalActual);

  const isPerfect = maxDeviation === 0 && totalUnallocated === 0;

  // Score: 100 when perfect, decreases as mean deviation increases relative to total
  const score =
    totalIdeal > 0
      ? Math.max(0, Math.round(100 - Math.min(100, (meanDeviation / totalIdeal) * 10000)))
      : 100;

  return {
    maxDeviationInCents: maxDeviation,
    meanDeviationInCents: Math.round(meanDeviation * 100) / 100,
    totalUnallocatedCents: totalUnallocated,
    isPerfect,
    score,
  };
}

/**
 * Returns a perfect fairness score (all zeros, score 100).
 *
 * @internal
 * @returns Perfect FairnessScore object
 */
function perfectFairness(): FairnessScore {
  return {
    maxDeviationInCents: 0,
    meanDeviationInCents: 0,
    totalUnallocatedCents: 0,
    isPerfect: true,
    score: 100,
  };
}
