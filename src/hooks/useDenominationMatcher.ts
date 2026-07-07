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
 *   3. **Sweep phase** — after initial greedy assignment, attempt to improve the
 *      distribution between employee pairs. Two operations are tried: moving a
 *      single unit from an overpaid to an underpaid employee, and *exchanging*
 *      one unit each between two employees (e.g. a €20 for a €10). An operation
 *      is accepted if it reduces the sum of squared deviations.
 *
 *   4. **Mop-up phase** — assign any remaining unallocated denominations to the most
 *      underpaid employee. This guarantees all available cash is distributed.
 *
 *   5. **Best-effort safety net** — if any working employee has €0, try to move
 *      the smallest denomination from an overpaid employee to them. The move is
 *      only performed when the donor keeps a non-zero payout, overall fairness
 *      improves, and the donor isn't pushed across the transfer threshold —
 *      otherwise it would just shift the €0 problem to someone else, make
 *      deviations worse, or create a brand-new transfer.
 *
 *   6. **Compute fairness metrics** — calculate max deviation, mean deviation,
 *      and a 0–100 fairness score.
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
 * - **Excess denominations**: All denominations are distributed via the mop-up phase.
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
import { fairnessScoreFromMeanDev } from '@/lib/calc/calculations';
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
  const { distributions, available, transferThresholdInCents = 0 } = input;

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

  // Phase 3: Mop-up — assign all remaining denominations so nothing is left over
  mopUp(distributions, pool, assignmentMap, actualMap);

  // Phase 4: Best-effort safety net — try to avoid any working employee getting €0 where denominations allow
  ensureNonZeroPayouts(distributions, assignmentMap, actualMap, transferThresholdInCents);

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
 * Adds one unit of a denomination to an employee's assignment list.
 * Creates a new entry if the denomination isn't already assigned.
 *
 * @internal
 */
function addUnit(
  assignments: DenominationAssignment[],
  denominationId: string,
  valueInCents: number,
): void {
  const existing = assignments.find((a) => a.denominationId === denominationId);
  if (existing) {
    existing.count++;
    existing.totalCents += valueInCents;
  } else {
    assignments.push({ denominationId, count: 1, totalCents: valueInCents });
  }
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
 * Improvement phase: attempt pairwise denomination operations between employees.
 *
 * For each pair of employees where A is overpaid and B is underpaid, two
 * operations are tried, best-first:
 *
 *   1. **Move** — one unit from A to B (e.g. A hands B a €5).
 *   2. **Exchange** — one unit from A for one unit from B (e.g. A's €20 for
 *      B's €10, shifting €10 of value while keeping both piece counts). Moves
 *      alone can't fix imbalances smaller than A's smallest piece; exchanges
 *      can shift the *difference* of two piece values.
 *
 * An operation is accepted if it reduces the sum of squared deviations.
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

        // Only try operations where A is overpaid and B is underpaid
        if (deviationA <= 0 || deviationB >= 0) continue;

        if (
          tryMove(distA, distB, deviationA, deviationB, assignmentMap, actualMap) ||
          tryExchange(distA, distB, deviationA, deviationB, assignmentMap, actualMap)
        ) {
          improved = true;
        }
      }
    }
  }
}

/**
 * Transfers `value` worth of one denomination unit from one employee to
 * another, keeping assignments and actuals in sync.
 *
 * @internal
 */
function transferUnit(
  from: DenominationAssignment,
  fromId: string,
  toId: string,
  assignmentMap: Map<string, DenominationAssignment[]>,
  actualMap: Map<string, number>,
): void {
  const value = from.totalCents / from.count;
  from.count--;
  from.totalCents -= value;

  let toAssignments = assignmentMap.get(toId);
  if (!toAssignments) {
    toAssignments = [];
    assignmentMap.set(toId, toAssignments);
  }
  addUnit(toAssignments, from.denominationId, value);

  actualMap.set(fromId, (actualMap.get(fromId) ?? 0) - value);
  actualMap.set(toId, (actualMap.get(toId) ?? 0) + value);
}

/**
 * Tries to move one denomination unit from overpaid A to underpaid B.
 * Accepts the first move that reduces the sum of squared deviations.
 *
 * @internal
 * @returns true if a move was performed
 */
function tryMove(
  distA: DistributionResult,
  distB: DistributionResult,
  deviationA: number,
  deviationB: number,
  assignmentMap: Map<string, DenominationAssignment[]>,
  actualMap: Map<string, number>,
): boolean {
  const assignmentsA = assignmentMap.get(distA.employeeId) ?? [];
  const oldSumSq = deviationA * deviationA + deviationB * deviationB;

  for (const assignA of assignmentsA) {
    if (assignA.count <= 0) continue;
    const denomValue = assignA.totalCents / assignA.count;

    const newDeviationA = deviationA - denomValue;
    const newDeviationB = deviationB + denomValue;
    const newSumSq = newDeviationA * newDeviationA + newDeviationB * newDeviationB;

    if (newSumSq < oldSumSq) {
      transferUnit(assignA, distA.employeeId, distB.employeeId, assignmentMap, actualMap);
      return true;
    }
  }
  return false;
}

/**
 * Tries to exchange one unit of A's for one unit of B's (different values),
 * shifting `valueA − valueB` from overpaid A to underpaid B. Accepts the
 * first exchange that reduces the sum of squared deviations.
 *
 * @internal
 * @returns true if an exchange was performed
 */
function tryExchange(
  distA: DistributionResult,
  distB: DistributionResult,
  deviationA: number,
  deviationB: number,
  assignmentMap: Map<string, DenominationAssignment[]>,
  actualMap: Map<string, number>,
): boolean {
  const assignmentsA = assignmentMap.get(distA.employeeId) ?? [];
  const assignmentsB = assignmentMap.get(distB.employeeId) ?? [];
  const oldSumSq = deviationA * deviationA + deviationB * deviationB;

  for (const assignA of assignmentsA) {
    if (assignA.count <= 0) continue;
    const valueA = assignA.totalCents / assignA.count;

    for (const assignB of assignmentsB) {
      if (assignB.count <= 0) continue;
      const valueB = assignB.totalCents / assignB.count;
      if (valueB >= valueA) continue; // only shift value from A toward B

      const shifted = valueA - valueB;
      const newDeviationA = deviationA - shifted;
      const newDeviationB = deviationB + shifted;
      const newSumSq = newDeviationA * newDeviationA + newDeviationB * newDeviationB;

      if (newSumSq < oldSumSq) {
        transferUnit(assignA, distA.employeeId, distB.employeeId, assignmentMap, actualMap);
        transferUnit(assignB, distB.employeeId, distA.employeeId, assignmentMap, actualMap);
        return true;
      }
    }
  }
  return false;
}

/**
 * Mop-up phase: assigns all remaining denominations to employees.
 *
 * Each remaining denomination unit goes to the employee with the smallest
 * deviation (most underpaid). This guarantees all available cash is distributed.
 *
 * @internal
 * @param distributions - Original ideal distributions
 * @param pool - Mutable pool of available denominations
 * @param assignmentMap - Mutable map of employee assignments
 * @param actualMap - Mutable map of actual amounts
 */
function mopUp(
  distributions: DistributionResult[],
  pool: AvailableDenomination[],
  assignmentMap: Map<string, DenominationAssignment[]>,
  actualMap: Map<string, number>,
): void {
  if (distributions.length === 0) return;

  for (const denom of pool) {
    while (denom.available > 0) {
      // Find the employee with the smallest deviation (most underpaid)
      let bestId = distributions[0]!.employeeId;
      let bestDeviation = Infinity;

      for (const dist of distributions) {
        const deviation = (actualMap.get(dist.employeeId) ?? 0) - dist.amountInCents;
        if (deviation < bestDeviation) {
          bestDeviation = deviation;
          bestId = dist.employeeId;
        }
      }

      // Assign one unit of this denomination to the best employee
      let assignments = assignmentMap.get(bestId);
      if (!assignments) {
        assignments = [];
        assignmentMap.set(bestId, assignments);
      }
      addUnit(assignments, denom.denominationId, denom.valueInCents);

      actualMap.set(bestId, (actualMap.get(bestId) ?? 0) + denom.valueInCents);
      denom.available--;
    }
  }
}

/**
 * Safety net: ensures every employee with hours > 0 gets a non-zero payout
 * where the denominations allow it.
 *
 * If an employee with hours > 0 has actualAmount === 0, tries donors from
 * most overpaid downwards and moves the donor's smallest denomination. The
 * move is only performed when
 *   - the donor keeps a non-zero payout (otherwise the €0 problem just
 *     shifts to the donor — e.g. a pool of one single bill),
 *   - the sum of squared deviations decreases (the move must genuinely
 *     improve fairness, not trade one imbalance for a bigger one), and
 *   - the donor's deviation is not pushed across the transfer threshold —
 *     turning a settled employee into a transfer participant would trade
 *     cosmetics (nobody at €0) for an extra transfer.
 *
 * @internal
 */
function ensureNonZeroPayouts(
  distributions: DistributionResult[],
  assignmentMap: Map<string, DenominationAssignment[]>,
  actualMap: Map<string, number>,
  transferThresholdInCents: number,
): void {
  for (const dist of distributions) {
    if (dist.hours <= 0 || (actualMap.get(dist.employeeId) ?? 0) > 0) continue;

    // Candidate donors, most overpaid first
    const donors = distributions
      .filter((other) => other.employeeId !== dist.employeeId)
      .sort(
        (a, b) =>
          ((actualMap.get(b.employeeId) ?? 0) - b.amountInCents) -
          ((actualMap.get(a.employeeId) ?? 0) - a.amountInCents),
      );

    for (const donor of donors) {
      const donorActual = actualMap.get(donor.employeeId) ?? 0;
      const donorDeviation = donorActual - donor.amountInCents;

      const activeAssignments = (assignmentMap.get(donor.employeeId) ?? []).filter(
        (a) => a.count > 0,
      );
      if (activeAssignments.length === 0) continue;

      // Smallest denomination the donor holds
      activeAssignments.sort((a, b) => a.totalCents / a.count - b.totalCents / b.count);
      const smallest = activeAssignments[0]!;
      const denomValue = smallest.totalCents / smallest.count;

      // Donor must not become the new €0 employee
      if (donorActual - denomValue <= 0) continue;

      // The move must improve fairness overall
      const recipientDeviation = -dist.amountInCents;
      const oldSumSq = donorDeviation * donorDeviation + recipientDeviation * recipientDeviation;
      const newDevDonor = donorDeviation - denomValue;
      const newDevRecipient = recipientDeviation + denomValue;
      const newSumSq = newDevDonor * newDevDonor + newDevRecipient * newDevRecipient;
      if (newSumSq >= oldSumSq) continue;

      // Must not push a settled donor across the transfer threshold
      if (
        Math.abs(donorDeviation) <= transferThresholdInCents &&
        Math.abs(newDevDonor) > transferThresholdInCents
      ) {
        continue;
      }

      transferUnit(smallest, donor.employeeId, dist.employeeId, assignmentMap, actualMap);
      break;
    }
  }
}

/**
 * Computes aggregate fairness metrics for a set of payouts.
 *
 * The fairness score is computed as:
 *   `100 × max(0, 1 − meanAbsDeviation / meanIdealPerPerson)`
 *
 * This means:
 * - Score 100 = all employees get exactly their ideal amount
 * - Score 50 = average employee is off by 50% of their ideal share
 * - Score 0 = average employee is off by 100%+ of their ideal share
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

  const meanIdeal = totalIdeal / payouts.length;
  const score = fairnessScoreFromMeanDev(meanDeviation, meanIdeal);

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
