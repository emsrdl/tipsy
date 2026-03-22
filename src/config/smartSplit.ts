/**
 * @file src/config/smartSplit.ts
 * @description Configuration constants for the smart splitting algorithm.
 *
 * @see src/lib/smartSplitter.ts for the algorithm implementation
 * @see src/types/shift.ts for related types
 */

/** Default fairness threshold in cents. Transfers suggested when deviation exceeds this. */
export const DEFAULT_FAIRNESS_THRESHOLD = 500;

/** Maximum number of transfer chains to suggest. Prevents excessive transfer complexity. */
export const MAX_TRANSFER_CHAINS = 3;

/** Whether smart splitting is enabled by default. */
export const SMART_SPLIT_ENABLED = true;

/** localStorage key for the user's fairness threshold preference. */
export const SMART_SPLIT_THRESHOLD_KEY = 'tipsy_smart_split_threshold';
