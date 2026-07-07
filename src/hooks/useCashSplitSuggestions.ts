/**
 * @file src/hooks/useCashSplitSuggestions.ts
 * @description Memoized wrapper around the cash-split suggestion algorithm.
 *
 * Returns one suggestion per source bill, each with a recommended breakdown,
 * equally good alternatives, and the predicted transfer reduction.
 *
 * @see src/lib/calc/cashSplitSuggester.ts for the algorithm
 */

import { useMemo } from 'react';
import { suggestCashSplits } from '@/lib/calc/cashSplitSuggester';
import type { SmartSplitOutput } from '@/types/shift';
import type { DenominationQuantity } from '@/types/session';
import type { Employee } from '@/types/employee';
import type { CashSplitSuggestion } from '@/types/cashSplit';

interface UseCashSplitSuggestionsInput {
  smartOutput: SmartSplitOutput | null;
  denominations: DenominationQuantity[];
  employees: Employee[];
  totalInCents: number;
  kitchenPercent: number;
  thresholdInCents: number;
  isSmartMode: boolean;
}

/** Returns up to 3 cash-split suggestions, one per source bill. */
export function useCashSplitSuggestions(
  input: UseCashSplitSuggestionsInput,
): { suggestions: CashSplitSuggestion[] } {
  const { smartOutput, denominations, employees, totalInCents, kitchenPercent, thresholdInCents, isSmartMode } = input;

  const suggestions = useMemo<CashSplitSuggestion[]>(() => {
    if (!isSmartMode || !smartOutput || smartOutput.differences.length === 0) return [];
    return suggestCashSplits({ denominations, smartOutput, employees, totalInCents, kitchenPercent, thresholdInCents });
  }, [isSmartMode, smartOutput, denominations, employees, totalInCents, kitchenPercent, thresholdInCents]);

  return { suggestions };
}
