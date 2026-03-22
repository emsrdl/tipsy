/**
 * @file src/types/calculation.ts
 * @description Types for the denomination matching and distribution calculation system.
 *
 * The denomination matcher solves a constrained optimization problem:
 * given physical bills/coins available and ideal per-employee amounts,
 * find the best assignment of physical denominations to people.
 *
 * @see src/hooks/useDenominationMatcher.ts for the matching algorithm
 * @see src/utils/calculations.ts for pure math utilities
 * @see src/types/session.ts for DistributionResult used as input
 */

import type { DistributionResult } from './session';

/**
 * Available physical denominations that can be handed out.
 * Tracks how many of each denomination we have to distribute.
 *
 * @property denominationId - References Denomination.id from currency.ts
 * @property available - How many of this denomination are physically present
 * @property valueInCents - Cached value per unit for fast lookups
 *
 * @example
 * const pool: AvailableDenomination = {
 *   denominationId: 'eur_10',
 *   available: 5,
 *   valueInCents: 1000,
 * }
 */
export interface AvailableDenomination {
  /** References Denomination.id from src/config/currency.ts */
  denominationId: string;
  /** Count of this denomination physically available. Must be ≥ 0. */
  available: number;
  /** Value per unit in euro cents. */
  valueInCents: number;
}

/**
 * A single denomination assigned to an employee as part of their payout.
 *
 * @property denominationId - Which denomination
 * @property count - How many of that denomination
 * @property totalCents - count × valueInCents (precomputed for convenience)
 *
 * @example
 * const assignment: DenominationAssignment = {
 *   denominationId: 'eur_10',
 *   count: 3,
 *   totalCents: 3000,
 * }
 */
export interface DenominationAssignment {
  /** References Denomination.id from src/config/currency.ts */
  denominationId: string;
  /** How many of this denomination to give. */
  count: number;
  /** count × valueInCents — precomputed for display and summing. */
  totalCents: number;
}

/**
 * The physical payout plan for a single employee.
 *
 * Contains the list of denominations to hand them, the actual total
 * (which may differ slightly from the ideal due to rounding to physical
 * denominations), and the deviation from ideal.
 *
 * @property employeeId - References Employee.id
 * @property idealAmountInCents - What the employee should ideally receive
 * @property actualAmountInCents - What they actually receive (sum of assignments)
 * @property deviationInCents - actual − ideal (positive = overpaid, negative = underpaid)
 * @property assignments - The list of bills/coins to hand out
 *
 * @example
 * const payout: EmployeePayoutPlan = {
 *   employeeId: 'e1',
 *   name: 'Anna',
 *   idealAmountInCents: 3334,
 *   actualAmountInCents: 3350,
 *   deviationInCents: 16,
 *   assignments: [
 *     { denominationId: 'eur_20', count: 1, totalCents: 2000 },
 *     { denominationId: 'eur_10', count: 1, totalCents: 1000 },
 *     { denominationId: 'eur_2', count: 1, totalCents: 200 },
 *     { denominationId: 'eur_1', count: 1, totalCents: 100 },
 *     { denominationId: 'eur_50ct', count: 1, totalCents: 50 },
 *   ],
 * }
 */
export interface EmployeePayoutPlan {
  /** References Employee.id */
  employeeId: string;
  /** Copied from DistributionResult for display */
  name: string;
  /** The ideal amount the employee should receive (from calculateDistribution). */
  idealAmountInCents: number;
  /** The actual amount they receive in physical cash. */
  actualAmountInCents: number;
  /** actual − ideal. Positive = overpaid, negative = underpaid. */
  deviationInCents: number;
  /** The list of physical bills/coins to hand them. */
  assignments: DenominationAssignment[];
}

/**
 * Measures how fair a denomination match result is.
 *
 * @property maxDeviationInCents - The largest absolute deviation of any single employee
 * @property meanDeviationInCents - The mean absolute deviation across all employees
 * @property totalUnallocatedCents - Cash remaining that couldn't be distributed
 * @property isPerfect - True when every employee gets exactly their ideal amount
 * @property score - 0–100 fairness score (100 = perfect, 0 = worst case)
 *
 * @example
 * const fairness: FairnessScore = {
 *   maxDeviationInCents: 5,
 *   meanDeviationInCents: 2,
 *   totalUnallocatedCents: 0,
 *   isPerfect: false,
 *   score: 98,
 * }
 */
export interface FairnessScore {
  /** Largest absolute deviation of any single employee, in cents. */
  maxDeviationInCents: number;
  /** Mean absolute deviation across all employees, in cents. */
  meanDeviationInCents: number;
  /** Cash remaining that couldn't be assigned to any employee. */
  totalUnallocatedCents: number;
  /** True when every employee receives exactly their ideal amount. */
  isPerfect: boolean;
  /**
   * 0–100 score. 100 = all employees get exactly their ideal amount.
   * Computed as: 100 − min(100, (meanDeviationInCents / totalInCents) × 10000).
   * The scale factor of 10000 means 1% mean deviation = score of 0.
   */
  score: number;
}

/**
 * Complete result of the denomination matching algorithm.
 *
 * @property payouts - Per-employee payout plans
 * @property fairness - Aggregate fairness metrics
 * @property unallocated - Denominations left over after distribution
 * @property durationMs - How long the matching algorithm took (for perf monitoring)
 *
 * @example
 * const result: DenominationMatchResult = matchDenominations(distributions, available)
 * if (result.fairness.isPerfect) {
 *   console.log('Everyone gets exactly their share!')
 * }
 */
export interface DenominationMatchResult {
  /** Per-employee payout plans with denomination assignments. */
  payouts: EmployeePayoutPlan[];
  /** Aggregate fairness metrics for the entire distribution. */
  fairness: FairnessScore;
  /** Denominations remaining after distribution. */
  unallocated: AvailableDenomination[];
  /** Wall-clock time the algorithm took, in milliseconds. */
  durationMs: number;
}

/**
 * A saved tip distribution session for history.
 *
 * @property id - Unique history entry id
 * @property timestamp - ISO 8601 timestamp of when the session was saved
 * @property totalInCents - Total distributed
 * @property employeeCount - Number of employees in this session
 * @property results - The distribution results (copied from TipSession)
 *
 * @example
 * const entry: HistoryEntry = {
 *   id: 'hist-1',
 *   timestamp: '2026-03-21T14:30:00.000Z',
 *   totalInCents: 10000,
 *   employeeCount: 3,
 *   results: [...],
 * }
 */
export interface HistoryEntry {
  /** Unique history entry id. */
  id: string;
  /** ISO 8601 timestamp of when the session was saved. */
  timestamp: string;
  /** Total amount distributed in euro cents. */
  totalInCents: number;
  /** Number of employees in this session. */
  employeeCount: number;
  /** Snapshot of the distribution results. */
  results: DistributionResult[];
}

/**
 * Input for the denomination matching algorithm.
 *
 * @property distributions - Per-employee ideal amounts from calculateDistribution
 * @property available - Physical denominations available
 *
 * @example
 * const input: DenominationMatchInput = {
 *   distributions: calculateDistribution({ totalInCents: 10000, ... }),
 *   available: buildAvailableFromSession(session),
 * }
 */
export interface DenominationMatchInput {
  /** Per-employee ideal amounts. */
  distributions: DistributionResult[];
  /** Physical denominations available to distribute. */
  available: AvailableDenomination[];
}

/**
 * Validation result for form inputs.
 *
 * @property valid - Whether the input is valid
 * @property errors - Map of field names to i18n error keys
 *
 * @example
 * const result = validateEmployees(employees)
 * if (!result.valid) {
 *   console.log(result.errors) // { 'employees[0].name': 'errors:validation.required' }
 * }
 */
export interface ValidationResult {
  /** Whether all validations passed. */
  valid: boolean;
  /** Map of field identifiers to i18n error key strings. Empty when valid. */
  errors: Record<string, string>;
}
