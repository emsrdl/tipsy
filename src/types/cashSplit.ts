/**
 * @file src/types/cashSplit.ts
 * @description Types for cash-split suggestions — bill exchanges that reduce
 * balance transfers between staff.
 *
 * A suggestion describes one source bill worth breaking, together with a
 * ranked list of complete breakdowns (best first). Every breakdown sums
 * exactly to the source bill's value and carries its own fully simulated
 * transfer prediction — nothing is estimated.
 *
 * @see src/lib/calc/cashSplitSuggester.ts for the algorithm
 * @see src/context/TipSessionContext.tsx for applyCashSplit / revertCashSplit
 * @see src/components/molecules/CashSplitDialog for the picker dialog
 */

/** A multiset of denominations, e.g. `2×€20 + 1×€10`. */
export type CashPieces = { denominationId: string; count: number }[];

/**
 * One complete way to break the source bill. `pieces` sums exactly to the
 * source bill's value; `predictedTransferCount` is the simulated transfer
 * count after applying exactly these pieces.
 */
export interface CashSplitBreakdown {
  pieces: CashPieces;
  predictedTransferCount: number;
}

/**
 * One bill the user can break to reduce transfers.
 *
 * `breakdowns[0]` is the recommended breakdown; any further entries are
 * equally good alternatives (same predicted transfer count) the user can
 * switch to in the picker dialog.
 *
 * @example
 * // "Break the €50 — 3 transfers become 0."
 * const suggestion: CashSplitSuggestion = {
 *   id: 'eur_50:2xeur_20+1xeur_10',
 *   sourceDenominationId: 'eur_50',
 *   breakdowns: [
 *     { pieces: [{ denominationId: 'eur_20', count: 2 }, { denominationId: 'eur_10', count: 1 }], predictedTransferCount: 0 },
 *     { pieces: [{ denominationId: 'eur_10', count: 5 }], predictedTransferCount: 0 },
 *   ],
 *   currentTransferCount: 3,
 *   predictedTransferCount: 0,
 * }
 */
export interface CashSplitSuggestion {
  /** Stable deterministic id — source bill + best-breakdown multiset. */
  id: string;
  /** Bill to be broken (one unit consumed). */
  sourceDenominationId: string;
  /** Complete breakdowns, best first. Never empty. */
  breakdowns: CashSplitBreakdown[];
  /** Transfer count before applying this suggestion. */
  currentTransferCount: number;
  /** Predicted transfer count of the best breakdown (`breakdowns[0]`). */
  predictedTransferCount: number;
}

/**
 * A split the user has accepted and applied to the session.
 * Records the *actual* breakdown chosen by the user (not necessarily the
 * recommended one) so the operation can be reversed exactly.
 */
export interface AppliedCashSplit {
  /** Unique id generated at apply time (a bill can be split more than once). */
  id: string;
  /** Source bill consumed. */
  sourceDenominationId: string;
  /** The breakdown the user picked — sums to the source bill's value. */
  actualPieces: CashPieces;
  /** ISO 8601 timestamp. */
  appliedAt: string;
}
