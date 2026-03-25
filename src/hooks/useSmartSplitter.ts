/**
 * @file src/hooks/useSmartSplitter.ts
 * @description Hook for running the smart splitting algorithm.
 *
 * Wraps the smartSplit function with memoization and integrates with
 * the tip session context for input data.
 *
 * @see src/lib/calc/smartSplitter.ts for the algorithm
 * @see src/types/shift.ts for SmartSplitInput, SmartSplitOutput
 *
 * @example
 * const { output, isSmartMode, toggleSmartMode } = useSmartSplitter()
 */

import { useMemo, useState, useCallback } from 'react';
import { smartSplit } from '@/lib/calc/smartSplitter';
import { useLocalStorage } from './useLocalStorage';
import {
  DEFAULT_FAIRNESS_THRESHOLD,
  SMART_SPLIT_ENABLED,
  SMART_SPLIT_THRESHOLD_KEY,
} from '@/config/smartSplit';
import type { SmartSplitInput, SmartSplitOutput } from '@/types/shift';
import type { Employee } from '@/types/employee';
import type { DenominationQuantity } from '@/types/session';

export interface UseSmartSplitterReturn {
  /** The smart split result, or null if input is insufficient. */
  output: SmartSplitOutput | null;
  /** Whether smart mode is enabled. */
  isSmartMode: boolean;
  /** Toggle between smart and normal mode. */
  toggleSmartMode: () => void;
  /** Set smart mode explicitly. */
  setSmartMode: (enabled: boolean) => void;
  /** Current fairness threshold in cents. */
  thresholdInCents: number;
  /** Update the fairness threshold. */
  setThreshold: (cents: number) => void;
}

/**
 * Hook for smart tip splitting.
 *
 * @param employees - Current employees
 * @param totalInCents - Total tip amount in cents
 * @param kitchenPercent - Kitchen percentage (0-100)
 * @param denominations - Current denomination quantities
 * @returns Smart split output and mode controls
 */
export function useSmartSplitter(
  employees: Employee[],
  totalInCents: number,
  kitchenPercent: number,
  denominations: DenominationQuantity[],
): UseSmartSplitterReturn {
  const [isSmartMode, setIsSmartMode] = useState(SMART_SPLIT_ENABLED);
  const [thresholdInCents, setThresholdInCents] = useLocalStorage<number>(
    SMART_SPLIT_THRESHOLD_KEY,
    DEFAULT_FAIRNESS_THRESHOLD,
  );

  const toggleSmartMode = useCallback(() => {
    setIsSmartMode((prev) => !prev);
  }, []);

  const setSmartMode = useCallback((enabled: boolean) => {
    setIsSmartMode(enabled);
  }, []);

  const setThreshold = useCallback(
    (cents: number) => {
      setThresholdInCents(cents);
    },
    [setThresholdInCents],
  );

  const output = useMemo<SmartSplitOutput | null>(() => {
    if (employees.length === 0 || totalInCents <= 0) return null;

    const input: SmartSplitInput = {
      employees,
      totalInCents,
      kitchenPercent,
      denominations,
      smartMode: isSmartMode,
      fairnessThresholdInCents: thresholdInCents,
    };

    return smartSplit(input);
  }, [employees, totalInCents, kitchenPercent, denominations, isSmartMode, thresholdInCents]);

  return {
    output,
    isSmartMode,
    toggleSmartMode,
    setSmartMode,
    thresholdInCents,
    setThreshold,
  };
}
