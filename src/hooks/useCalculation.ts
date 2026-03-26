/**
 * @file src/hooks/useCalculation.ts
 * @description React hooks for tip calculation with history persistence.
 *
 * Provides a high-level hook that wraps the core {@link calculateDistribution}
 * function with:
 * - Memoized calculation (recalculates only when inputs change)
 * - History persistence via {@link useLocalStorage}
 * - Session snapshot creation for the history log
 *
 * @see src/lib/calc/tipCalculator.ts for the core distribution algorithm
 * @see src/hooks/useLocalStorage.ts for persistence
 * @see src/types/calculation.ts for HistoryEntry type
 *
 * @example
 * import { useCalculation } from '@/hooks/useCalculation'
 *
 * function ResultsScreen() {
 *   const { results, history, saveToHistory, clearHistory } = useCalculation({
 *     totalInCents: 10000,
 *     employees: [{ id: 'e1', name: 'Anna', hours: 8, group: 'service' }],
 *     split: { kitchenPercent: 0, servicePercent: 100 },
 *   })
 *
 *   return (
 *     <div>
 *       {results.map(r => <div key={r.employeeId}>{r.name}: {r.amountInCents}ct</div>)}
 *       <button onClick={saveToHistory}>Save</button>
 *     </div>
 *   )
 * }
 */

import { useMemo, useCallback } from 'react';
import { calculateDistribution, type CalculateDistributionInput } from '@/lib/calc/tipCalculator';
import type { DistributionResult } from '@/types/session';
import type { HistoryEntry } from '@/types/calculation';
import { useLocalStorage } from '@/hooks/useLocalStorage';

/** localStorage key for persisted history entries. */
const HISTORY_STORAGE_KEY = 'tipsy-history';

/** Maximum number of history entries retained. Oldest entries are pruned on save. */
const MAX_HISTORY_ENTRIES = 50;

/**
 * Return value of the {@link useCalculation} hook.
 *
 * @property results - Current calculation results (empty array if inputs are null)
 * @property history - Persisted history entries
 * @property saveToHistory - Saves current results as a new history entry
 * @property clearHistory - Removes all history entries
 * @property removeHistoryEntry - Removes a single history entry by id
 */
export interface UseCalculationResult {
  /** Current distribution results. Empty array if input is null. */
  results: DistributionResult[];
  /** Persisted history of past calculations. */
  history: HistoryEntry[];
  /** Saves current results as a new history entry. No-op if results are empty. */
  saveToHistory: () => void;
  /** Removes all history entries from localStorage. */
  clearHistory: () => void;
  /** Removes a single history entry by its id. */
  removeHistoryEntry: (id: string) => void;
}

/**
 * React hook for tip calculation with automatic history persistence.
 *
 * When `input` is provided, calculates the distribution and makes the results
 * available. The `saveToHistory` callback snapshots the current results into
 * localStorage-backed history.
 *
 * History is capped at {@link MAX_HISTORY_ENTRIES} entries.
 * Entries are ordered newest-first.
 *
 * @param input - Calculation input, or null to skip calculation
 * @returns {@link UseCalculationResult} with results, history, and actions
 *
 * @example
 * // Basic usage
 * const { results, saveToHistory } = useCalculation({
 *   totalInCents: 10000,
 *   employees: [
 *     { id: 'e1', name: 'Anna', hours: 8, group: 'service' },
 *     { id: 'e2', name: 'Bob',  hours: 4, group: 'kitchen' },
 *   ],
 *   split: { kitchenPercent: 30, servicePercent: 70 },
 * })
 *
 * @example
 * // Access history
 * const { history, clearHistory, removeHistoryEntry } = useCalculation(null)
 * history.forEach(entry => console.log(entry.timestamp, entry.totalInCents))
 */
export function useCalculation(input: CalculateDistributionInput | null): UseCalculationResult {
  // Memoized calculation — only recalculates when input reference changes
  const results = useMemo<DistributionResult[]>(() => {
    if (!input) return [];
    return calculateDistribution(input);
  }, [input]);

  // History persistence
  const [history, setHistory, clearHistoryStorage] = useLocalStorage<HistoryEntry[]>(
    HISTORY_STORAGE_KEY,
    [],
  );

  const saveToHistory = useCallback(() => {
    if (results.length === 0 || !input) return;

    const entry: HistoryEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      totalInCents: input.totalInCents,
      employeeCount: input.employees.length,
      results: [...results],
    };

    setHistory((prev) => {
      const next = [entry, ...prev];
      // Prune to max entries
      return next.slice(0, MAX_HISTORY_ENTRIES);
    });
  }, [results, input, setHistory]);

  const clearHistory = useCallback(() => {
    clearHistoryStorage();
  }, [clearHistoryStorage]);

  const removeHistoryEntry = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((e) => e.id !== id));
    },
    [setHistory],
  );

  return {
    results,
    history,
    saveToHistory,
    clearHistory,
    removeHistoryEntry,
  };
}

/**
 * Generates a unique-enough id for history entries.
 * Uses timestamp + random suffix to avoid collisions.
 *
 * @internal
 * @returns A string id like "hist-1711036200000-a1b2c3"
 */
function generateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `hist-${timestamp}-${random}`;
}
