/**
 * @file src/hooks/useCashSplitGuidance.ts
 * @description Selection state + dynamic guidance for the cash-split picker.
 *
 * Owns the per-denomination quantity state the user builds up in the dialog
 * and derives, on every change, the guidance the grid renders — all verified
 * by simulation, nothing prescribed up front:
 *
 *   - green ("add n")   — the best completion from the current selection,
 *   - orange (tappable)  — alternative routes / other full variants,
 *   - red ("remove n")   — the smallest step back out of a dead end.
 *
 * @see src/components/molecules/CashSplitDialog for the consumer
 * @see src/lib/calc/cashSplitSuggester for the completion/removal searches
 */

import { useMemo, useState } from 'react';
import { DENOMINATIONS, getDenominationValue } from '@/config/currency';
import {
  sumBreakdownCents,
  simulateBreakdown,
  suggestCompletions,
  suggestRemoval,
  type CashSplitPoolInput,
} from '@/lib/calc/cashSplitSuggester';
import type { CashPieces, CashSplitSuggestion } from '@/types/cashSplit';

/** Per-row orange badge: count + the action that follows that route. */
export interface AltBadge {
  count: number;
  apply: () => void;
}

export interface CashSplitGuidance {
  /** Current per-denomination quantities. */
  quantities: Record<string, number>;
  /** Non-zero selection as a piece multiset. */
  currentPieces: CashPieces;
  currentTotalCents: number;
  /** Total matches the source bill's value exactly. */
  isExact: boolean;
  /**
   * Predicted transfer count for the current primary path: when exact it
   * mirrors the actual selection; when still in progress it simulates
   * currentPieces + best completion so the forecast is visible from the
   * start and updates whenever the user follows an alternative route.
   */
  pathTransferCount: number | null;
  /** Exact and no worse than the suggester's predicted outcome. */
  goalReached: boolean;
  /** Best completion from here (green "add n"), or null. */
  completion: CashPieces | null;
  /** Per-denomination green "add n" counts. */
  addCounts: Record<string, number>;
  /** Per-denomination red "remove n" counts. */
  removeCounts: Record<string, number>;
  /** Per-denomination orange alternative-route pointers. */
  altBadges: Record<string, AltBadge>;
  /** Selection is on a verified path — active rows render green subtotals. */
  rowsValid: boolean;
  /** Sets a denomination's quantity, clamped so the total never exceeds source. */
  setQty: (id: string, qty: number) => void;
  /** Adds pieces on top of the current selection. */
  addPieces: (pieces: CashPieces) => void;
  /** Highest count a denomination can reach without exceeding the source. */
  maxQtyFor: (id: string) => number;
}

function piecesToQuantities(pieces: CashPieces): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of pieces) map[p.denominationId] = (map[p.denominationId] ?? 0) + p.count;
  return map;
}

/**
 * Drives the cash-split dialog: holds the selection and recomputes the
 * verified guidance for it. Resets to `initialPieces` (or empty) whenever
 * `suggestion` changes.
 *
 * @param initialPieces - Optional pre-fill for review/edit mode (e.g. an
 *   already-applied split the user wants to review or modify).
 */
export function useCashSplitGuidance(
  suggestion: CashSplitSuggestion | null,
  input: CashSplitPoolInput,
  initialPieces?: CashPieces,
): CashSplitGuidance {
  const { denominations, employees, totalInCents, kitchenPercent, thresholdInCents } = input;

  const sourceValueCents = suggestion ? getDenominationValue(suggestion.sourceDenominationId) : 0;

  // Starts from initialPieces if provided (review mode), otherwise empty.
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => (initialPieces ? piecesToQuantities(initialPieces) : {}),
  );

  const breakdowns = useMemo(() => suggestion?.breakdowns ?? [], [suggestion]);

  const currentPieces = useMemo<CashPieces>(
    () =>
      Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([denominationId, count]) => ({ denominationId, count })),
    [quantities],
  );

  const currentTotalCents = useMemo(() => sumBreakdownCents(currentPieces), [currentPieces]);
  const isExact = currentTotalCents === sourceValueCents && sourceValueCents > 0;

  // Live transfer-count preview — simulates the user's ACTUAL selection.
  // Only meaningful when the breakdown total equals the source bill's value;
  // a partial selection shows no prediction.
  const previewTransferCount = useMemo<number | null>(() => {
    if (!suggestion || !isExact) return null;
    return simulateBreakdown(currentPieces, suggestion.sourceDenominationId, { denominations, employees, totalInCents, kitchenPercent, thresholdInCents });
  }, [suggestion, isExact, currentPieces, denominations, employees, totalInCents, kitchenPercent, thresholdInCents]);

  const goalReached =
    isExact &&
    previewTransferCount !== null &&
    suggestion !== null &&
    previewTransferCount <= suggestion.predictedTransferCount;

  // Best completion + alternative routes from the current selection. The
  // suggestion's stored variants act as seeds: while the selection is a
  // subset of one, its remainder outranks all generated completions — so the
  // route being followed stays primary until the user actually deviates.
  const completions = useMemo(() => {
    if (!suggestion || isExact) return [];
    return suggestCompletions(
      currentPieces,
      suggestion.sourceDenominationId,
      suggestion.predictedTransferCount,
      { denominations, employees, totalInCents, kitchenPercent, thresholdInCents },
      breakdowns.map((b) => b.pieces),
    );
  }, [suggestion, isExact, currentPieces, denominations, employees, totalInCents, kitchenPercent, thresholdInCents, breakdowns]);

  const completion = completions[0]?.pieces ?? null;

  // Transfer count for the current primary path.
  // When exact: use the already-computed previewTransferCount.
  // When in progress: read from the best completion's already-simulated result
  // (suggestCompletions carries transferCount alongside pieces so we don't
  // re-simulate). When dead end (no completion): null.
  const pathTransferCount = isExact ? previewTransferCount : (completions[0]?.transferCount ?? null);

  // Dead end: exact but worse than predicted, or partial with no completion.
  // The removal search finds the smallest step back onto a working path.
  const removal = useMemo<CashPieces | null>(() => {
    if (!suggestion) return null;
    const deadEnd = isExact
      ? previewTransferCount !== null && previewTransferCount > suggestion.predictedTransferCount
      : currentTotalCents > 0 && completion === null;
    if (!deadEnd) return null;
    return suggestRemoval(
      currentPieces,
      suggestion.sourceDenominationId,
      suggestion.predictedTransferCount,
      { denominations, employees, totalInCents, kitchenPercent, thresholdInCents },
    );
  }, [suggestion, isExact, previewTransferCount, currentTotalCents, completion, currentPieces, denominations, employees, totalInCents, kitchenPercent, thresholdInCents]);

  const addCounts = useMemo(() => piecesToQuantities(completion ?? []), [completion]);
  const removeCounts = useMemo(() => piecesToQuantities(removal ?? []), [removal]);
  const rowsValid = goalReached || completion !== null;

  function addPieces(pieces: CashPieces) {
    setQuantities((prev) => {
      const next = { ...prev };
      for (const p of pieces) next[p.denominationId] = (next[p.denominationId] ?? 0) + p.count;
      return next;
    });
  }

  // Orange badges.
  //
  // While editing: rows the best completion doesn't use but an alternative
  // route does — tapping finishes via that route. At the goal: pointers to
  // whole other variants ("what else would have worked"), tapping replaces
  // the selection with that variant.
  const altBadges = useMemo<Record<string, AltBadge>>(() => {
    const result: Record<string, AltBadge> = {};
    if (goalReached) {
      for (const denom of DENOMINATIONS) {
        if ((quantities[denom.id] ?? 0) > 0) continue;
        for (const breakdown of breakdowns) {
          const count = breakdown.pieces.find((p) => p.denominationId === denom.id)?.count ?? 0;
          if (count > 0) {
            const pieces = breakdown.pieces;
            result[denom.id] = {
              count,
              apply: () => setQuantities(piecesToQuantities(pieces)),
            };
            break;
          }
        }
      }
      return result;
    }
    for (const { pieces: alternative } of completions.slice(1)) {
      for (const piece of alternative) {
        if ((addCounts[piece.denominationId] ?? 0) > 0) continue;
        if (result[piece.denominationId]) continue;
        result[piece.denominationId] = {
          count: piece.count,
          apply: () => addPieces(alternative),
        };
      }
    }
    return result;
  }, [goalReached, quantities, breakdowns, completions, addCounts]);

  /**
   * Clamps the new quantity so the total breakdown never exceeds the source.
   * Returning the previous state when over-budget effectively blocks the plus
   * button at the boundary.
   */
  function setQty(id: string, newQty: number) {
    setQuantities((prev) => {
      const oldQty = prev[id] ?? 0;
      if (newQty === oldQty || newQty < 0) return prev;

      const denomVal = getDenominationValue(id);
      const totalNow = Object.entries(prev).reduce(
        (sum, [k, v]) => sum + getDenominationValue(k) * v,
        0,
      );
      if (totalNow + (newQty - oldQty) * denomVal > sourceValueCents) return prev;

      return { ...prev, [id]: newQty };
    });
  }

  function maxQtyFor(id: string): number {
    const denomVal = getDenominationValue(id);
    if (denomVal <= 0) return 0;
    const currentQty = quantities[id] ?? 0;
    const headroom = sourceValueCents - (currentTotalCents - currentQty * denomVal);
    return Math.max(0, Math.floor(headroom / denomVal));
  }

  return {
    quantities,
    currentPieces,
    currentTotalCents,
    isExact,
    pathTransferCount,
    goalReached,
    completion,
    addCounts,
    removeCounts,
    altBadges,
    rowsValid,
    setQty,
    addPieces,
    maxQtyFor,
  };
}
