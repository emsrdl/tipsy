/**
 * @file src/lib/calc/smartSplitter.ts
 * @description Smart splitting algorithm for tip distribution.
 *
 * Two modes:
 *
 * ## Normal Splitting
 * Each person gets their exact proportional share (or as close as possible).
 * Uses floor + remainder allocation from tipCalculator. Remainder cents go to
 * the employee with the largest fractional part.
 *
 * ## Smart Splitting
 * Optimizes denomination usage by assigning physical bills/coins.
 * Steps:
 *   1. Calculate ideal shares via proportional distribution
 *   2. Greedily assign denominations largest-first to each employee
 *   3. Run swap improvement to reduce deviations
 *   4. If any deviation exceeds the fairness threshold, suggest transfers
 *
 * All monetary values are integer euro cents.
 *
 * @see src/types/shift.ts for SmartSplitInput, SmartSplitOutput, PersonShare, DifferenceLine
 * @see src/lib/calc/tipCalculator.ts for the base proportional algorithm
 * @see src/hooks/useDenominationMatcher.ts for the greedy+swap denomination matching
 * @see src/config/smartSplit.ts for default configuration
 */

import { calculateDistribution } from './tipCalculator';
import { matchDenominations } from '@/hooks/useDenominationMatcher';
import { DENOMINATIONS } from '@/config/currency';
import type { DenominationQuantity } from '@/types/session';
import type { AvailableDenomination } from '@/types/calculation';
import type { PersonShare, DifferenceLine, SmartSplitInput, SmartSplitOutput } from '@/types/shift';

/**
 * Runs the smart splitting algorithm.
 *
 * @param input - Employees, amounts, denominations, and configuration
 * @returns Distribution result with person shares, transfers, and timing
 *
 * @example
 * const output = smartSplit({
 *   employees: [{ id: 'e1', name: 'Anna', hours: 8, group: 'service' }],
 *   totalInCents: 5000,
 *   kitchenPercent: 30,
 *   denominations: [{ denominationId: 'eur_50', quantity: 1 }],
 *   smartMode: true,
 *   fairnessThresholdInCents: 500,
 * })
 */
export function smartSplit(input: SmartSplitInput): SmartSplitOutput {
  const start = performance.now();

  const {
    employees,
    totalInCents,
    kitchenPercent,
    denominations,
    smartMode,
    fairnessThresholdInCents,
  } = input;

  // Step 1: Calculate ideal proportional shares
  const idealResults = calculateDistribution({
    totalInCents,
    employees,
    split: { kitchenPercent, servicePercent: 100 - kitchenPercent },
  });

  // Edge case: no employees or zero total
  if (idealResults.length === 0 || totalInCents <= 0) {
    return {
      distribution: {
        personShares: employees.map((e) => ({
          id: e.id,
          name: e.name,
          role: e.group,
          hoursWorked: e.hours,
          idealShareInCents: 0,
          actualShareInCents: 0,
          deviationInCents: 0,
        })),
        remainingCents: 0,
        fairnessScore: 100,
        denominationsUsed: [],
      },
      differences: [],
      durationMs: performance.now() - start,
    };
  }

  if (!smartMode) {
    // Normal mode: ideal shares are the actual shares
    return buildNormalResult(idealResults, denominations, start);
  }

  // Smart mode: match denominations to employees
  return buildSmartResult(idealResults, denominations, fairnessThresholdInCents, start);
}

/**
 * Builds a normal (non-smart) distribution result.
 * Everyone gets their exact proportional share; denominations are tracked but not constrained.
 *
 * @internal
 */
function buildNormalResult(
  idealResults: ReturnType<typeof calculateDistribution>,
  denominations: DenominationQuantity[],
  startTime: number,
): SmartSplitOutput {
  const personShares: PersonShare[] = idealResults.map((r) => ({
    id: r.employeeId,
    name: r.name,
    role: r.group,
    hoursWorked: r.hours,
    idealShareInCents: r.amountInCents,
    actualShareInCents: r.amountInCents,
    deviationInCents: 0,
  }));

  const denominationsUsed = denominations
    .filter((d) => d.quantity > 0)
    .map((d) => ({ denominationId: d.denominationId, quantity: d.quantity }));

  return {
    distribution: {
      personShares,
      remainingCents: 0,
      fairnessScore: 100,
      denominationsUsed,
    },
    differences: [],
    durationMs: performance.now() - startTime,
  };
}

/**
 * Builds a smart distribution using denomination matching.
 * Assigns physical bills/coins, computes deviations, and suggests transfers.
 *
 * @internal
 */
function buildSmartResult(
  idealResults: ReturnType<typeof calculateDistribution>,
  denominations: DenominationQuantity[],
  thresholdInCents: number,
  startTime: number,
): SmartSplitOutput {
  // Convert denomination quantities to available pool
  const available = buildAvailablePool(denominations);

  // Run the denomination matching algorithm
  const matchResult = matchDenominations({
    distributions: idealResults,
    available,
  });

  // Build person shares from match result
  const idealMap = new Map(idealResults.map((r) => [r.employeeId, r]));
  const personShares: PersonShare[] = matchResult.payouts.map((p) => {
    const ideal = idealMap.get(p.employeeId);
    return {
      id: p.employeeId,
      name: p.name,
      role: ideal?.group ?? 'service',
      hoursWorked: ideal?.hours ?? 0,
      idealShareInCents: p.idealAmountInCents,
      actualShareInCents: p.actualAmountInCents,
      deviationInCents: p.deviationInCents,
    };
  });

  // Track which denominations were used
  const denomUsageMap = new Map<string, number>();
  for (const payout of matchResult.payouts) {
    for (const assignment of payout.assignments) {
      const current = denomUsageMap.get(assignment.denominationId) ?? 0;
      denomUsageMap.set(assignment.denominationId, current + assignment.count);
    }
  }
  const denominationsUsed = Array.from(denomUsageMap.entries()).map(
    ([denominationId, quantity]) => ({ denominationId, quantity }),
  );

  // Calculate remaining cents
  const totalDistributed = personShares.reduce((s, p) => s + p.actualShareInCents, 0);
  const totalInput = denominations.reduce((s, d) => {
    const denom = DENOMINATIONS.find((dd) => dd.id === d.denominationId);
    return s + (denom ? denom.valueInCents * d.quantity : 0);
  }, 0);
  const remainingCents = Math.max(0, totalInput - totalDistributed);

  // Calculate transfers if deviations exceed threshold
  const differences = calculateTransfers(personShares, thresholdInCents);

  return {
    distribution: {
      personShares,
      remainingCents,
      fairnessScore: matchResult.fairness.score,
      denominationsUsed,
    },
    differences,
    payoutPlans: matchResult.payouts,
    durationMs: performance.now() - startTime,
  };
}

/**
 * Converts DenominationQuantity array to AvailableDenomination array
 * for the matching algorithm.
 *
 * @internal
 */
export function buildAvailablePool(denominations: DenominationQuantity[]): AvailableDenomination[] {
  return denominations
    .filter((d) => d.quantity > 0)
    .map((d) => {
      const denom = DENOMINATIONS.find((dd) => dd.id === d.denominationId);
      return {
        denominationId: d.denominationId,
        available: d.quantity,
        valueInCents: denom?.valueInCents ?? 0,
      };
    })
    .filter((d) => d.valueInCents > 0);
}

/**
 * Calculates transfer suggestions between over- and under-paid employees.
 *
 * Only suggests transfers when absolute deviation exceeds the threshold.
 * Pairs overpaid people with underpaid people, concentrating surplus in as few
 * senders as possible to minimize the number of transactions.
 *
 * @param personShares - Per-person shares with deviations
 * @param thresholdInCents - Minimum deviation to trigger a transfer suggestion
 * @returns Array of suggested transfers
 *
 * @example
 * const transfers = calculateTransfers(shares, 500)
 * // [{ fromPerson: { id: 'e1', name: 'Anna' }, toPerson: { id: 'e2', name: 'Bob' }, amountInCents: 300, ... }]
 */
export function calculateTransfers(
  personShares: PersonShare[],
  thresholdInCents: number,
): DifferenceLine[] {
  // Find overpaid and underpaid people exceeding threshold
  const overpaid = personShares
    .filter((p) => p.deviationInCents > thresholdInCents)
    .map((p) => ({ ...p, remaining: p.deviationInCents }))
    .sort((a, b) => b.remaining - a.remaining);

  const underpaid = personShares
    .filter((p) => p.deviationInCents < -thresholdInCents)
    .map((p) => ({ ...p, remaining: Math.abs(p.deviationInCents) }))
    .sort((a, b) => b.remaining - a.remaining);

  if (overpaid.length === 0 || underpaid.length === 0) return [];

  const differences: DifferenceLine[] = [];

  // Pair overpaid with underpaid, largest overpaid first to minimize senders
  for (const over of overpaid) {
    for (const under of underpaid) {
      if (over.remaining <= 0 || under.remaining <= 0) continue;

      const transferAmount = Math.min(over.remaining, under.remaining);
      if (transferAmount <= 0) continue;

      differences.push({
        fromPerson: { id: over.id, name: over.name },
        toPerson: { id: under.id, name: under.name },
        amountInCents: transferAmount,
        method: 'paypal',
        reason: 'Denomination constraint optimization',
      });

      over.remaining -= transferAmount;
      under.remaining -= transferAmount;
    }
  }

  return differences;
}
