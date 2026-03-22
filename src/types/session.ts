/**
 * @file src/types/session.ts
 * @description Core session types for a single tip distribution round.
 *
 * A session flows through three steps:
 *   1. Setup: add employees, configure split
 *   2. Cash input: enter denomination quantities
 *   3. Results: view DistributionResult per employee
 *
 * @see src/types/employee.ts for Employee type
 * @see src/lib/tipCalculator.ts for the calculation logic
 * @see src/context/TipSessionContext.tsx for runtime state
 */

import type { Employee } from './employee';

/**
 * A quantity of a specific EUR denomination.
 *
 * @example
 * const fiver: DenominationQuantity = { denominationId: 'eur_5', quantity: 3 }
 * // Represents 3× €5 = €15 total
 */
export interface DenominationQuantity {
  /** References a denomination id from DENOMINATIONS in src/config/currency.ts */
  denominationId: string;
  /** How many of this denomination were counted. Must be ≥ 0. */
  quantity: number;
}

/**
 * Kitchen/service percentage split configuration.
 * The two values must sum to 100.
 *
 * @example
 * const split: TipSplit = { kitchenPercent: 30, servicePercent: 70 }
 */
export interface TipSplit {
  /** Percentage of total tips going to kitchen staff (0–100). */
  kitchenPercent: number;
  /** Percentage of total tips going to service staff (0–100). */
  servicePercent: number;
}

/**
 * The calculated tip amount for a single employee.
 *
 * @example
 * const result: DistributionResult = {
 *   employeeId: 'e1',
 *   name: 'Anna',
 *   group: 'service',
 *   hours: 8,
 *   amountInCents: 4500,
 * }
 */
export interface DistributionResult {
  /** References Employee.id */
  employeeId: string;
  /** Copied from Employee for display without needing a lookup */
  name: string;
  /** @see EmployeeGroup */
  group: 'kitchen' | 'service';
  /** Hours worked, for display */
  hours: number;
  /** Calculated tip amount in euro cents */
  amountInCents: number;
}

/**
 * The complete state of one tip distribution session.
 *
 * Created at the start of a session and populated step by step.
 * Results is null until the calculation has been run.
 *
 * @example
 * const session: TipSession = {
 *   employees: [{ id: 'e1', name: 'Anna', hours: 8, group: 'service' }],
 *   split: { kitchenPercent: 30, servicePercent: 70 },
 *   denominations: [{ denominationId: 'eur_10', quantity: 5 }],
 *   results: null,
 * }
 */
export interface TipSession {
  /** Staff members participating in this round. */
  employees: Employee[];
  /** How to split the total between kitchen and service pools. */
  split: TipSplit;
  /** Cash amounts entered in the denomination grid. */
  denominations: DenominationQuantity[];
  /** Calculated results, or null if not yet computed. */
  results: DistributionResult[] | null;
}
