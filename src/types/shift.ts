/**
 * @file src/types/shift.ts
 * @description Types for shift records, smart splitting, and transfer calculations.
 *
 * A Shift is a single completed tip distribution, persisted for history/export.
 * PersonShare extends the base DistributionResult with deviation tracking.
 * DifferenceLine describes inter-person transfers needed to reconcile deviations.
 *
 * @see src/lib/smartSplitter.ts for the algorithm
 * @see src/hooks/useShifts.ts for shift persistence
 */

import type { Employee } from './employee'
import type { DenominationQuantity } from './session'
import type { EmployeePayoutPlan } from './calculation'

/**
 * Per-person share with deviation tracking for smart splitting.
 *
 * Extends the concept of DistributionResult by adding ideal vs actual amounts
 * so the UI can show how much each person deviates from their fair share.
 *
 * @example
 * const share: PersonShare = {
 *   id: 'e1', name: 'Anna', role: 'service', hoursWorked: 8,
 *   idealShareInCents: 5000, actualShareInCents: 4800, deviationInCents: -200,
 * }
 */
export interface PersonShare {
  /** References Employee.id */
  id: string
  /** Display name. */
  name: string
  /** Role (kitchen/service). */
  role: 'kitchen' | 'service'
  /** Hours worked. */
  hoursWorked: number
  /** What this person should ideally receive, in cents. */
  idealShareInCents: number
  /** What this person actually receives (with denomination constraints), in cents. */
  actualShareInCents: number
  /** actual − ideal (positive = overpaid, negative = underpaid), in cents. */
  deviationInCents: number
}

/**
 * Complete distribution result including smart splitting details.
 *
 * @example
 * const result: SmartDistributionResult = {
 *   personShares: [...],
 *   remainingCents: 3,
 *   fairnessScore: 95.2,
 *   denominationsUsed: [{ denominationId: 'eur_10', quantity: 3 }],
 * }
 */
export interface SmartDistributionResult {
  /** Per-person distribution with deviation tracking. */
  personShares: PersonShare[]
  /** Cents remaining that couldn't be distributed. */
  remainingCents: number
  /** 0–100 fairness score (100 = perfect distribution). */
  fairnessScore: number
  /** Which denominations were used in the distribution. */
  denominationsUsed: { denominationId: string; quantity: number }[]
}

/** Method for reconciling deviations between persons. */
export type TransferMethod = 'direct' | 'paypal' | 'transfer'

/**
 * A suggested transfer between two people to reconcile deviations.
 *
 * @example
 * const diff: DifferenceLine = {
 *   fromPerson: { id: 'e1', name: 'Anna' },
 *   toPerson: { id: 'e2', name: 'Marco' },
 *   amountInCents: 200,
 *   method: 'paypal',
 *   reason: 'Denomination constraint optimization',
 * }
 */
export interface DifferenceLine {
  /** Person who should pay. */
  fromPerson: { id: string; name: string }
  /** Person who should receive. */
  toPerson: { id: string; name: string }
  /** Transfer amount in cents. */
  amountInCents: number
  /** Suggested transfer method. */
  method: TransferMethod
  /** Human-readable reason for this transfer. */
  reason: string
}

/**
 * A complete shift record, persisted in localStorage.
 *
 * @example
 * const shift: Shift = {
 *   id: 'shift-abc123',
 *   profileId: 'p-abc123',
 *   date: '2026-03-21T18:00:00.000Z',
 *   kitchenPercent: 30,
 *   employees: [...],
 *   totalTipsInCents: 15000,
 *   denominationInput: [...],
 *   distribution: { personShares: [...], remainingCents: 0, fairnessScore: 98, denominationsUsed: [...] },
 *   smartSplitting: true,
 *   differences: [...],
 *   savedAt: '2026-03-21T18:05:00.000Z',
 * }
 */
export interface Shift {
  /** Unique identifier (for import/export dedup). */
  id: string
  /** References Profile.id, or null for guest sessions. */
  profileId: string | null
  /** ISO 8601 date of the shift. */
  date: string
  /** Kitchen percentage used (0–100). */
  kitchenPercent: number
  /** Employees participating in this shift. */
  employees: Employee[]
  /** Total tip amount in cents. */
  totalTipsInCents: number
  /** Denomination quantities entered. */
  denominationInput: DenominationQuantity[]
  /** The distribution results (basic or smart). */
  distribution: SmartDistributionResult
  /** Whether smart splitting was used. */
  smartSplitting: boolean
  /** Suggested transfers to reconcile deviations. */
  differences: DifferenceLine[]
  /** ISO 8601 timestamp when this shift was saved. */
  savedAt: string
}

/**
 * Result of importing shifts from JSON backup.
 *
 * @example
 * const result: ImportResult = { added: 5, skipped: 2, errors: ['Invalid shift at index 3'] }
 */
export interface ImportResult {
  /** Number of shifts successfully added. */
  added: number
  /** Number of shifts skipped (already exist by ID). */
  skipped: number
  /** Error messages for invalid entries. */
  errors: string[]
}

/**
 * Input for the smart splitter algorithm.
 *
 * @example
 * const input: SmartSplitInput = {
 *   employees: [...],
 *   totalInCents: 15000,
 *   kitchenPercent: 30,
 *   denominations: [...],
 *   smartMode: true,
 *   fairnessThresholdInCents: 500,
 * }
 */
export interface SmartSplitInput {
  /** Employees to distribute tips among. */
  employees: Employee[]
  /** Total tip amount in cents. */
  totalInCents: number
  /** Kitchen percentage (0–100). */
  kitchenPercent: number
  /** Available denominations with quantities. */
  denominations: DenominationQuantity[]
  /** Whether to use smart splitting (true) or normal splitting (false). */
  smartMode: boolean
  /** Max acceptable deviation per person in cents. Transfers suggested above this. */
  fairnessThresholdInCents: number
}

/**
 * Complete output of the smart splitter, including transfers.
 *
 * @example
 * const output: SmartSplitOutput = {
 *   distribution: { personShares: [...], remainingCents: 0, fairnessScore: 95, denominationsUsed: [...] },
 *   differences: [...],
 *   durationMs: 2.5,
 * }
 */
export interface SmartSplitOutput {
  /** The distribution result. */
  distribution: SmartDistributionResult
  /** Suggested transfers to reconcile deviations above threshold. */
  differences: DifferenceLine[]
  /** Per-employee payout plans with denomination assignments (smart mode only). */
  payoutPlans?: EmployeePayoutPlan[]
  /** Algorithm execution time in milliseconds. */
  durationMs: number
}
