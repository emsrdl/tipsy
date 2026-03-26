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

/** localStorage key for the active session fairness threshold. Reset to default on calculation end. */
export const SMART_SPLIT_THRESHOLD_KEY = 'tipsy_smart_split_threshold';

/** localStorage key for the user's default fairness threshold (set only in Settings). */
export const SMART_SPLIT_DEFAULT_THRESHOLD_KEY = 'tipsy_smart_split_default_threshold';

/** Default kitchen percentage for the kitchen/service split (0–100). */
export const DEFAULT_KITCHEN_PERCENT = 40;

/** localStorage key for the user's default kitchen percentage (set only in Settings). */
export const DEFAULT_SPLIT_KEY = 'tipsy_default_split_kitchen_percent';

/**
 * Reads the user's configured default kitchen percentage from localStorage.
 * Falls back to {@link DEFAULT_KITCHEN_PERCENT} if not set or invalid.
 *
 * @returns Kitchen percentage (0–100).
 */
export function readDefaultKitchenPercent(): number {
  try {
    const raw = localStorage.getItem(DEFAULT_SPLIT_KEY);
    if (raw !== null) {
      const val = JSON.parse(raw) as number;
      if (typeof val === 'number' && val >= 0 && val <= 100) return val;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_KITCHEN_PERCENT;
}
