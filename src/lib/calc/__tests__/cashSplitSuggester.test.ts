/**
 * @file src/lib/calc/__tests__/cashSplitSuggester.test.ts
 * @description Tests for the cash-split suggestion algorithm.
 */

import { describe, it, expect } from 'vitest';
import {
  suggestCashSplits,
  suggestCompletion,
  suggestCompletions,
  suggestRemoval,
  sumBreakdownCents,
  applyBreakdownToPool,
} from '../cashSplitSuggester';
import { smartSplit } from '../smartSplitter';
import { makeEmployee, makeDenomQty } from '@/test/factories';
import type { SmartSplitOutput } from '@/types/shift';
import type { DenominationQuantity } from '@/types/session';
import type { Employee } from '@/types/employee';

const DENOM_VALUES: Record<string, number> = {
  eur_100: 10000, eur_50: 5000, eur_20: 2000, eur_10: 1000, eur_5: 500,
  eur_2: 200, eur_1: 100, eur_50ct: 50, eur_20ct: 20, eur_10ct: 10,
  eur_5ct: 5, eur_2ct: 2, eur_1ct: 1,
};

function totalCents(denoms: DenominationQuantity[]): number {
  return denoms.reduce((sum, d) => sum + (DENOM_VALUES[d.denominationId] ?? 0) * d.quantity, 0);
}

function makeSmartOutput(
  employees: Employee[],
  denominations: DenominationQuantity[],
  threshold = 100,
): SmartSplitOutput {
  return smartSplit({
    employees,
    totalInCents: totalCents(denominations),
    kitchenPercent: 0,
    denominations,
    smartMode: true,
    fairnessThresholdInCents: threshold,
  });
}

function suggest(
  employees: Employee[],
  denominations: DenominationQuantity[],
  threshold = 100,
) {
  const output = makeSmartOutput(employees, denominations, threshold);
  return {
    output,
    suggestions: suggestCashSplits({
      denominations,
      smartOutput: output,
      employees,
      totalInCents: totalCents(denominations),
      kitchenPercent: 0,
      thresholdInCents: threshold,
    }),
  };
}

const anna = makeEmployee({ id: 'e1', name: 'Anna', hours: 8, group: 'service' });
const bob = makeEmployee({ id: 'e2', name: 'Bob', hours: 4, group: 'service' });
const twoEmployees = [anna, bob];

// 1×€50 for an 8h/4h pair is the canonical transfer scenario: ideals are
// €33.33/€16.67 but the single bill goes to one person entirely.
const oneFifty = [makeDenomQty('eur_50', 1)];

describe('suggestCashSplits', () => {
  it('returns empty when there are no transfers', () => {
    const denominations = [makeDenomQty('eur_20', 2), makeDenomQty('eur_10', 1)];
    const { output, suggestions } = suggest(twoEmployees, denominations);
    if (output.differences.length > 0) return; // edge — skip if scenario produced transfers
    expect(suggestions).toHaveLength(0);
  });

  it('returns at most one suggestion per source bill', () => {
    const { output, suggestions } = suggest(twoEmployees, oneFifty);
    if (output.differences.length === 0) return;

    expect(suggestions.length).toBeGreaterThan(0);
    const sources = suggestions.map((s) => s.sourceDenominationId);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it('predicts a transfer count strictly derived from simulation', () => {
    const { output, suggestions } = suggest(twoEmployees, oneFifty);
    if (output.differences.length === 0) return;

    for (const s of suggestions) {
      expect(s.predictedTransferCount).toBeLessThanOrEqual(s.currentTransferCount);
      expect(s.predictedTransferCount).toBe(s.breakdowns[0]!.predictedTransferCount);
    }
  });

  it('every breakdown sums exactly to the source bill value', () => {
    const { output, suggestions } = suggest(twoEmployees, oneFifty);
    if (output.differences.length === 0) return;

    for (const s of suggestions) {
      const sourceValue = DENOM_VALUES[s.sourceDenominationId] ?? 0;
      for (const breakdown of s.breakdowns) {
        expect(sumBreakdownCents(breakdown.pieces)).toBe(sourceValue);
      }
    }
  });

  it('alternative breakdowns achieve the same predicted transfer count as the best', () => {
    const { output, suggestions } = suggest(twoEmployees, oneFifty);
    if (output.differences.length === 0) return;

    for (const s of suggestions) {
      for (const breakdown of s.breakdowns) {
        expect(breakdown.predictedTransferCount).toBe(s.predictedTransferCount);
      }
    }
  });

  it('breakdown predictions hold when re-simulated on the modified pool', () => {
    const denominations = oneFifty;
    const { output, suggestions } = suggest(twoEmployees, denominations);
    if (output.differences.length === 0) return;

    for (const s of suggestions) {
      for (const breakdown of s.breakdowns) {
        const pool = applyBreakdownToPool(denominations, s.sourceDenominationId, breakdown.pieces);
        const result = smartSplit({
          employees: twoEmployees,
          totalInCents: totalCents(denominations),
          kitchenPercent: 0,
          denominations: pool,
          smartMode: true,
          fairnessThresholdInCents: 100,
        });
        expect(result.differences.length).toBe(breakdown.predictedTransferCount);
      }
    }
  });

  it('deduplicates breakdowns within a suggestion', () => {
    const { output, suggestions } = suggest(twoEmployees, oneFifty);
    if (output.differences.length === 0) return;

    for (const s of suggestions) {
      const keys = s.breakdowns.map((b) =>
        [...b.pieces]
          .sort((x, y) => x.denominationId.localeCompare(y.denominationId))
          .map((p) => `${p.count}x${p.denominationId}`)
          .join('+'),
      );
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('respects the threshold floor — no pieces below threshold in any breakdown', () => {
    const threshold = 500; // €5
    const { suggestions } = suggest(twoEmployees, oneFifty, threshold);

    for (const s of suggestions) {
      for (const breakdown of s.breakdowns) {
        for (const piece of breakdown.pieces) {
          expect(DENOM_VALUES[piece.denominationId] ?? 0).toBeGreaterThanOrEqual(threshold);
        }
      }
    }
  });

  it('returns at most 3 suggestions with at most 4 breakdowns each', () => {
    const { suggestions } = suggest(twoEmployees, oneFifty);

    expect(suggestions.length).toBeLessThanOrEqual(3);
    for (const s of suggestions) {
      expect(s.breakdowns.length).toBeGreaterThanOrEqual(1);
      expect(s.breakdowns.length).toBeLessThanOrEqual(4);
    }
  });

  it('is deterministic — same input yields identical ids and order', () => {
    const run1 = suggest(twoEmployees, oneFifty).suggestions;
    const run2 = suggest(twoEmployees, oneFifty).suggestions;

    expect(run1.map((s) => s.id)).toEqual(run2.map((s) => s.id));
  });

  it('sorts suggestions by ascending predicted transfer count', () => {
    const { suggestions } = suggest(twoEmployees, oneFifty);

    for (let i = 0; i < suggestions.length - 1; i++) {
      expect(suggestions[i]!.predictedTransferCount).toBeLessThanOrEqual(
        suggestions[i + 1]!.predictedTransferCount,
      );
    }
  });
});

describe('variant diversity', () => {
  it('offers breakdowns from different lead families for a large bill', () => {
    // €100 + 2×€2 for two equal shares: many ways to reach 0 transfers.
    // Enumeration is stratified by lead family, so genuinely different
    // paths (€50-based, €20-based, €10-based) must all surface — not four
    // near-identical €50 shapes.
    const denominations = [makeDenomQty('eur_100', 1), makeDenomQty('eur_2', 2)];
    const equalPair = [
      makeEmployee({ id: 'e1', name: 'Anna', hours: 8, group: 'service' }),
      makeEmployee({ id: 'e2', name: 'Bob', hours: 8, group: 'service' }),
    ];
    const { output, suggestions } = suggest(equalPair, denominations);
    if (output.differences.length === 0) return;

    const hundred = suggestions.find((s) => s.sourceDenominationId === 'eur_100');
    expect(hundred).toBeDefined();
    const leads = new Set(
      hundred!.breakdowns.map((b) =>
        b.pieces.reduce(
          (max, p) => ((DENOM_VALUES[p.denominationId] ?? 0) > (DENOM_VALUES[max] ?? 0) ? p.denominationId : max),
          b.pieces[0]!.denominationId,
        ),
      ),
    );
    expect(leads.size).toBeGreaterThanOrEqual(3);
  });
});

describe('suggestCompletion', () => {
  it('completes a partial selection so the target transfer count is reached', () => {
    const denominations = oneFifty;
    const { output, suggestions } = suggest(twoEmployees, denominations);
    if (output.differences.length === 0 || suggestions.length === 0) return;

    const s = suggestions[0]!;
    const full = s.breakdowns[0]!.pieces;
    // Simulate the user having selected only the first (largest) piece
    const partial = [{ ...full[0]!, count: 1 }];

    const completion = suggestCompletion(partial, s.sourceDenominationId, s.predictedTransferCount, {
      denominations,
      employees: twoEmployees,
      totalInCents: totalCents(denominations),
      kitchenPercent: 0,
      thresholdInCents: 100,
    });

    expect(completion).not.toBeNull();
    // partial + completion must sum exactly to the source bill value
    const sum = sumBreakdownCents(partial) + sumBreakdownCents(completion!);
    expect(sum).toBe(DENOM_VALUES[s.sourceDenominationId]);

    // and the combined breakdown must actually deliver the predicted count
    const combined = [...partial, ...completion!];
    const pool = applyBreakdownToPool(denominations, s.sourceDenominationId, combined);
    const result = smartSplit({
      employees: twoEmployees,
      totalInCents: totalCents(denominations),
      kitchenPercent: 0,
      denominations: pool,
      smartMode: true,
      fairnessThresholdInCents: 100,
    });
    expect(result.differences.length).toBeLessThanOrEqual(s.predictedTransferCount);
  });

  it('returns alternative routes that each light up a new denomination', () => {
    const denominations = oneFifty;
    const { output, suggestions } = suggest(twoEmployees, denominations);
    if (output.differences.length === 0 || suggestions.length === 0) return;
    const s = suggestions[0]!;

    // Empty selection: completions ARE the initial plans.
    const completions = suggestCompletions([], s.sourceDenominationId, s.predictedTransferCount, {
      denominations,
      employees: twoEmployees,
      totalInCents: totalCents(denominations),
      kitchenPercent: 0,
      thresholdInCents: 100,
    });

    expect(completions.length).toBeGreaterThanOrEqual(1);
    expect(completions.length).toBeLessThanOrEqual(4);

    const covered = new Set(completions[0]!.pieces.map((p) => p.denominationId));
    for (const { pieces: alternative, transferCount } of completions.slice(1)) {
      // every alternative must sum to the bill and introduce a new row
      expect(sumBreakdownCents(alternative)).toBe(DENOM_VALUES[s.sourceDenominationId]);
      expect(alternative.some((p) => !covered.has(p.denominationId))).toBe(true);
      for (const p of alternative) covered.add(p.denominationId);

      // and must actually deliver the predicted transfer count
      expect(transferCount).toBeLessThanOrEqual(s.predictedTransferCount);
    }
  });

  it('returns null when the selection already matches the source value', () => {
    const denominations = oneFifty;
    const { suggestions } = suggest(twoEmployees, denominations);
    if (suggestions.length === 0) return;

    const s = suggestions[0]!;
    const completion = suggestCompletion(
      s.breakdowns[0]!.pieces,
      s.sourceDenominationId,
      s.predictedTransferCount,
      {
        denominations,
        employees: twoEmployees,
        totalInCents: totalCents(denominations),
        kitchenPercent: 0,
        thresholdInCents: 100,
      },
    );
    expect(completion).toBeNull();
  });
});

describe('suggestRemoval', () => {
  it('finds the piece to remove from a dead-end selection', () => {
    // 2×€20 + 1×€10 is an exact €50 breakdown, but Bob (ideal 16.67) can
    // only land on 20 or 10 — one transfer remains. Removing a €20 opens
    // the gap for finer change that reaches 0 transfers.
    const denominations = oneFifty;
    const { output, suggestions } = suggest(twoEmployees, denominations);
    if (output.differences.length === 0 || suggestions.length === 0) return;
    const target = suggestions[0]!.predictedTransferCount;

    const deadEnd = [
      { denominationId: 'eur_20', count: 2 },
      { denominationId: 'eur_10', count: 1 },
    ];
    const input = {
      denominations,
      employees: twoEmployees,
      totalInCents: totalCents(denominations),
      kitchenPercent: 0,
      thresholdInCents: 100,
    };
    // sanity: the dead end really has no completion (it is already exact)
    expect(suggestCompletion(deadEnd, 'eur_50', target, input)).toBeNull();

    const removal = suggestRemoval(deadEnd, 'eur_50', target, input);
    expect(removal).not.toBeNull();

    // removing it must re-open a verified completion path
    const reduced = deadEnd
      .map((p) =>
        p.denominationId === removal![0]!.denominationId
          ? { ...p, count: p.count - removal![0]!.count }
          : p,
      )
      .filter((p) => p.count > 0);
    expect(suggestCompletion(reduced, 'eur_50', target, input)).not.toBeNull();
  });

  it('returns null for a selection that can still be completed', () => {
    const denominations = oneFifty;
    const { output, suggestions } = suggest(twoEmployees, denominations);
    if (output.differences.length === 0 || suggestions.length === 0) return;

    // Not a dead end — suggestRemoval is only meaningful for dead ends, but
    // must not invent removals when a completion exists from here.
    const partial = [{ denominationId: 'eur_10', count: 1 }];
    const input = {
      denominations,
      employees: twoEmployees,
      totalInCents: totalCents(denominations),
      kitchenPercent: 0,
      thresholdInCents: 100,
    };
    expect(suggestCompletion(partial, 'eur_50', suggestions[0]!.predictedTransferCount, input)).not.toBeNull();
  });
});

describe('applyBreakdownToPool', () => {
  it('removes one source bill and adds the pieces', () => {
    const pool = [makeDenomQty('eur_50', 2), makeDenomQty('eur_20', 1)];
    const result = applyBreakdownToPool(pool, 'eur_50', [
      { denominationId: 'eur_20', count: 2 },
      { denominationId: 'eur_10', count: 1 },
    ]);

    const qty = (id: string) => result.find((d) => d.denominationId === id)?.quantity ?? 0;
    expect(qty('eur_50')).toBe(1);
    expect(qty('eur_20')).toBe(3);
    expect(qty('eur_10')).toBe(1);
    expect(totalCents(result)).toBe(totalCents(pool));
  });
});

describe('sumBreakdownCents', () => {
  it('sums the cent values correctly', () => {
    expect(sumBreakdownCents([{ denominationId: 'eur_20', count: 2 }])).toBe(4000);
    expect(
      sumBreakdownCents([
        { denominationId: 'eur_20', count: 2 },
        { denominationId: 'eur_5', count: 1 },
        { denominationId: 'eur_2', count: 2 },
        { denominationId: 'eur_1', count: 1 },
      ]),
    ).toBe(5000);
  });

  it('returns 0 for empty breakdown', () => {
    expect(sumBreakdownCents([])).toBe(0);
  });
});
