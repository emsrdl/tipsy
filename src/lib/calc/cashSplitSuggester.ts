/**
 * @file src/lib/calc/cashSplitSuggester.ts
 * @description Cash-split suggestion algorithm.
 *
 * Transfers exist because the denomination pool is too coarse for the
 * matcher to land each person exactly on their ideal share. Breaking a big
 * bill into smaller pieces gives the matcher more granularity and can
 * eliminate transfers entirely.
 *
 * For each bill in the pool worth breaking, this module returns ONE
 * suggestion carrying a ranked list of complete breakdowns:
 *   - `breakdowns[0]` — the recommended breakdown (fewest pieces),
 *   - further entries — equally good alternatives (same predicted transfer
 *     count) the user can switch to in the picker dialog.
 *
 * Every breakdown is fully simulated via `smartSplit`, so its
 * `predictedTransferCount` is exact — no estimates, no heuristics.
 *
 * ## Pipeline
 * 1. Transfer-targeted enumeration: for each transfer of amount X, propose
 *    splits of bills > X with at least one piece ≤ X.
 * 2. Fallback tier-down for the biggest bills if pass 1 yields too little.
 * 3. Simulate each candidate; discard those that don't reduce transfers or
 *    improve fairness.
 * 4. Group by source bill: best breakdown first, then up to
 *    MAX_ALTERNATIVES equally good alternatives.
 * 5. Sort suggestions by (predictedTransferCount ASC, bill value DESC);
 *    return up to MAX_SUGGESTIONS.
 *
 * ## Threshold-awareness
 * No piece smaller than the fairness threshold is ever proposed —
 * sub-threshold deviations don't produce transfers anyway.
 *
 * @see src/types/cashSplit.ts for CashSplitSuggestion
 */

import { smartSplit } from './smartSplitter';
import { DENOMINATIONS, getDenominationValue } from '@/config/currency';
import type { DenominationQuantity } from '@/types/session';
import type { Employee } from '@/types/employee';
import type { SmartSplitOutput } from '@/types/shift';
import type { CashPieces, CashSplitBreakdown, CashSplitSuggestion } from '@/types/cashSplit';

const MAX_SPLITS_PER_BILL = 120;
const MAX_FALLBACK_CANDIDATES = 12;
const MAX_SUGGESTIONS = 3;
/** Alternatives offered per suggestion in addition to the best breakdown. */
const MAX_ALTERNATIVES = 3;
/** Cap distinct denominations per generated split — keeps splits "clean" and ensures DFS reaches diverse leading-denom variants. */
const MAX_TIERS_PER_SPLIT = 5;
/** Per-denomination count cap — rules out unrealistic splits like 50×€1. */
const MAX_COUNT_PER_DENOM = 10;

interface SuggestInput {
  denominations: DenominationQuantity[];
  smartOutput: SmartSplitOutput;
  employees: Employee[];
  totalInCents: number;
  kitchenPercent: number;
  thresholdInCents: number;
}

/**
 * The pool + payout context the completion/removal searches simulate against.
 * Same as {@link SuggestInput} minus the already-computed smart-split output.
 */
export type CashSplitPoolInput = Omit<SuggestInput, 'smartOutput'>;

interface ScoredCandidate {
  sourceDenominationId: string;
  pieces: CashPieces;
  transferDelta: number;
  fairnessDelta: number;
  finalTransferCount: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns up to MAX_SUGGESTIONS cash-split suggestions — one per source
 * bill — each with a recommended breakdown and equally good alternatives.
 */
export function suggestCashSplits(input: SuggestInput): CashSplitSuggestion[] {
  const { smartOutput } = input;
  const initialTransferCount = smartOutput.differences.length;
  if (initialTransferCount === 0) return [];

  const all = collectScoredCandidates(input);
  if (all.length === 0) return [];

  // Group candidates by source bill; rank within each group.
  const bySource = new Map<string, ScoredCandidate[]>();
  for (const c of all) {
    const group = bySource.get(c.sourceDenominationId);
    if (group) group.push(c);
    else bySource.set(c.sourceDenominationId, [c]);
  }

  const suggestions: CashSplitSuggestion[] = [];
  for (const group of bySource.values()) {
    group.sort((a, b) => (isBetterCandidate(a, b) ? -1 : isBetterCandidate(b, a) ? 1 : 0));
    const best = group[0]!;

    // Best breakdown first, then alternatives with the same predicted
    // outcome — deduped by piece multiset. Alternatives with a *different
    // leading denomination* than the ones already picked go first: the user
    // exchanges at a till with limited stock, so "€10-based" vs "€20-based"
    // variants are more useful than three near-identical €20 shapes.
    const equivalents = group
      .slice(1)
      .filter((c) => c.finalTransferCount === best.finalTransferCount);

    const breakdowns: CashSplitBreakdown[] = [
      { pieces: best.pieces, predictedTransferCount: best.finalTransferCount },
    ];
    const seenKeys = new Set<string>([piecesKey(best.pieces)]);
    const seenLeads = new Set<string>([leadDenomination(best.pieces)]);

    const addAlternative = (c: ScoredCandidate) => {
      const key = piecesKey(c.pieces);
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      seenLeads.add(leadDenomination(c.pieces));
      breakdowns.push({ pieces: c.pieces, predictedTransferCount: c.finalTransferCount });
    };

    // Pass 1: distinct leading denominations
    for (const c of equivalents) {
      if (breakdowns.length > MAX_ALTERNATIVES) break;
      if (!seenLeads.has(leadDenomination(c.pieces))) addAlternative(c);
    }
    // Pass 2: fill remaining slots with the next-best equivalents
    for (const c of equivalents) {
      if (breakdowns.length > MAX_ALTERNATIVES) break;
      addAlternative(c);
    }

    suggestions.push({
      id: `${best.sourceDenominationId}:${piecesKey(best.pieces)}`,
      sourceDenominationId: best.sourceDenominationId,
      breakdowns,
      currentTransferCount: initialTransferCount,
      predictedTransferCount: best.finalTransferCount,
    });
  }

  suggestions.sort((a, b) => {
    if (a.predictedTransferCount !== b.predictedTransferCount) {
      return a.predictedTransferCount - b.predictedTransferCount;
    }
    return denomValue(b.sourceDenominationId) - denomValue(a.sourceDenominationId);
  });

  return suggestions.slice(0, MAX_SUGGESTIONS);
}

// ---------------------------------------------------------------------------
// Candidate collection (transfer-targeted + fallback)
// ---------------------------------------------------------------------------

function collectScoredCandidates(input: SuggestInput): ScoredCandidate[] {
  const { denominations, smartOutput, employees, totalInCents, kitchenPercent, thresholdInCents } = input;
  const transfers = smartOutput.differences;
  if (transfers.length === 0) return [];

  const currentTransferCount = transfers.length;
  const currentFairnessScore = smartOutput.distribution.fairnessScore;
  const pieceFloor = computePieceFloor(thresholdInCents);

  const seenIds = new Set<string>();
  const candidates: ScoredCandidate[] = [];

  // Pass 1: transfer-targeted
  for (const transfer of transfers) {
    const targetAmount = transfer.amountInCents;
    for (const dq of denominations) {
      if (dq.quantity < 1) continue;
      const sourceDenom = DENOMINATIONS.find((d) => d.id === dq.denominationId);
      if (!sourceDenom || sourceDenom.valueInCents <= targetAmount) continue;

      for (const targetPieces of generateSplits(
        sourceDenom.valueInCents,
        pieceFloor,
        MAX_SPLITS_PER_BILL,
        targetAmount,
      )) {
        const id = `${dq.denominationId}:${piecesKey(targetPieces)}`;
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        const scored = scoreCandidate(
          dq.denominationId, targetPieces,
          denominations, employees, totalInCents, kitchenPercent, thresholdInCents,
          currentTransferCount, currentFairnessScore,
        );
        if (scored) candidates.push(scored);
      }
    }
  }

  // Pass 2: fallback tier-down for the biggest bills
  const sortedDenoms = [...denominations]
    .filter((dq) => dq.quantity >= 1)
    .sort((a, b) => denomValue(b.denominationId) - denomValue(a.denominationId));

  let fallback = 0;
  for (const dq of sortedDenoms) {
    if (fallback >= MAX_FALLBACK_CANDIDATES) break;
    const sourceDenom = DENOMINATIONS.find((d) => d.id === dq.denominationId);
    if (!sourceDenom || sourceDenom.valueInCents <= pieceFloor) continue;

    for (const targetPieces of generateSplits(sourceDenom.valueInCents, pieceFloor, 3, null)) {
      const id = `${dq.denominationId}:${piecesKey(targetPieces)}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      fallback++;
      const scored = scoreCandidate(
        dq.denominationId, targetPieces,
        denominations, employees, totalInCents, kitchenPercent, thresholdInCents,
        currentTransferCount, currentFairnessScore,
      );
      if (scored) candidates.push(scored);
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

const denomValue = getDenominationValue;

/** Id of the largest denomination in a breakdown — its "lead". */
function leadDenomination(pieces: CashPieces): string {
  let lead = '';
  let leadValue = -1;
  for (const p of pieces) {
    const v = denomValue(p.denominationId);
    if (v > leadValue) {
      leadValue = v;
      lead = p.denominationId;
    }
  }
  return lead;
}

/** Total number of individual coin/bill units in a breakdown. */
function pieceCount(pieces: CashPieces): number {
  return pieces.reduce((sum, p) => sum + p.count, 0);
}

/**
 * True when `a` is a strictly better candidate than `b`. Ranking is tuned to
 * minimise the actual *exchange effort* — fewer bills/coins to physically
 * swap — once the transfer reduction is comparable:
 *   1. Fewer transfers (lower transferDelta).
 *   2. Fewer TOTAL pieces — primary measure of exchange effort.
 *   3. Fewer distinct denominations — simpler to communicate at the till.
 *   4. Higher fairness (tiebreaker only; doesn't dominate).
 */
function isBetterCandidate(a: ScoredCandidate, b: ScoredCandidate): boolean {
  if (a.transferDelta !== b.transferDelta) return a.transferDelta < b.transferDelta;
  const aPieces = pieceCount(a.pieces);
  const bPieces = pieceCount(b.pieces);
  if (aPieces !== bPieces) return aPieces < bPieces;
  if (a.pieces.length !== b.pieces.length) return a.pieces.length < b.pieces.length;
  return a.fairnessDelta > b.fairnessDelta;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

/**
 * Reverses a breakdown in the pool: adds back one source bill, removes the
 * pieces. The inverse of {@link applyBreakdownToPool} — used to restore the
 * denomination state before a split was applied.
 */
export function revertBreakdownFromPool(
  denominations: DenominationQuantity[],
  sourceDenominationId: string,
  pieces: CashPieces,
): DenominationQuantity[] {
  const pieceMap = new Map<string, number>();
  for (const p of pieces) {
    if (p.count > 0) pieceMap.set(p.denominationId, (pieceMap.get(p.denominationId) ?? 0) + p.count);
  }
  return denominations.map((d) => {
    if (d.denominationId === sourceDenominationId) return { ...d, quantity: d.quantity + 1 };
    const remove = pieceMap.get(d.denominationId);
    if (remove !== undefined) return { ...d, quantity: Math.max(0, d.quantity - remove) };
    return d;
  });
}

/**
 * Applies a breakdown to the pool: removes one source bill, adds the pieces.
 * Used for both candidate simulation and the dialog's live preview.
 */
export function applyBreakdownToPool(
  denominations: DenominationQuantity[],
  sourceDenominationId: string,
  pieces: CashPieces,
): DenominationQuantity[] {
  // Decrement source
  const denomMap = new Map<string, number>();
  for (const d of denominations) denomMap.set(d.denominationId, d.quantity);

  const sourceQty = denomMap.get(sourceDenominationId) ?? 0;
  if (sourceQty < 1) return denominations;
  denomMap.set(sourceDenominationId, sourceQty - 1);

  for (const piece of pieces) {
    denomMap.set(piece.denominationId, (denomMap.get(piece.denominationId) ?? 0) + piece.count);
  }

  // Preserve original ordering, add missing
  const result: DenominationQuantity[] = [];
  const seen = new Set<string>();
  for (const d of denominations) {
    result.push({ denominationId: d.denominationId, quantity: denomMap.get(d.denominationId) ?? 0 });
    seen.add(d.denominationId);
  }
  for (const [id, qty] of denomMap) {
    if (!seen.has(id) && qty > 0) {
      result.push({ denominationId: id, quantity: qty });
    }
  }
  return result;
}

function scoreCandidate(
  sourceDenominationId: string,
  targetPieces: CashPieces,
  denominations: DenominationQuantity[],
  employees: Employee[],
  totalInCents: number,
  kitchenPercent: number,
  thresholdInCents: number,
  currentTransferCount: number,
  currentFairnessScore: number,
): ScoredCandidate | null {
  const newDenominations = applyBreakdownToPool(denominations, sourceDenominationId, targetPieces);
  const result = smartSplit({
    employees, totalInCents, kitchenPercent, denominations: newDenominations,
    smartMode: true, fairnessThresholdInCents: thresholdInCents,
  });
  const transferDelta = result.differences.length - currentTransferCount;
  const fairnessDelta = result.distribution.fairnessScore - currentFairnessScore;
  if (transferDelta > 0) return null;
  if (transferDelta === 0 && fairnessDelta <= 0) return null;
  return {
    sourceDenominationId,
    pieces: targetPieces,
    transferDelta,
    fairnessDelta,
    finalTransferCount: result.differences.length,
  };
}

// ---------------------------------------------------------------------------
// Split enumeration
// ---------------------------------------------------------------------------

function computePieceFloor(thresholdInCents: number): number {
  if (thresholdInCents <= 0) return 1;
  const sorted = [...DENOMINATIONS].sort((a, b) => a.valueInCents - b.valueInCents);
  return sorted.find((d) => d.valueInCents >= thresholdInCents)?.valueInCents ?? 1;
}

/** How many lead-denomination families to enumerate per split target. */
const MAX_LEAD_FAMILIES = 4;

/**
 * Enumerates splits of `target`, stratified by *lead family*: one search per
 * "largest piece in the split" (€50-based, €20-based, €10-based, …), each
 * with its own share of the budget. Without stratification a single DFS
 * exhausts the whole budget inside the largest family (for a €100 bill all
 * candidates start with €50) and genuinely different paths — e.g. `4×€20 +
 * …` — never surface as alternatives.
 */
function generateSplits(
  target: number,
  pieceFloor: number,
  maxResults: number,
  mustIncludePieceAtMost: number | null,
): CashPieces[] {
  const leadTiers = DENOMINATIONS.filter(
    (d) => d.valueInCents < target && d.valueInCents >= pieceFloor,
  ).sort((a, b) => b.valueInCents - a.valueInCents);
  if (leadTiers.length === 0) return [];

  const familyCount = Math.min(leadTiers.length, MAX_LEAD_FAMILIES);
  const perFamily = Math.max(8, Math.ceil(maxResults / familyCount));

  const results: CashPieces[] = [];
  const seen = new Set<string>();
  for (const tier of leadTiers.slice(0, MAX_LEAD_FAMILIES)) {
    for (const pieces of enumerateFamily(target, tier, pieceFloor, perFamily, mustIncludePieceAtMost)) {
      const key = piecesKey(pieces);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(pieces);
      if (results.length >= maxResults) return results;
    }
  }
  return results;
}

/**
 * Enumerates splits whose largest piece is exactly `lead` (at least one unit
 * of it, nothing bigger) — one stratified family of {@link generateSplits}.
 */
function enumerateFamily(
  target: number,
  lead: { id: string; valueInCents: number },
  pieceFloor: number,
  maxResults: number,
  mustIncludePieceAtMost: number | null,
): CashPieces[] {
  const eligible = DENOMINATIONS.filter(
    (d) => d.valueInCents <= lead.valueInCents && d.valueInCents < target && d.valueInCents >= pieceFloor,
  ).sort((a, b) => b.valueInCents - a.valueInCents);
  if (eligible.length === 0 || eligible[0]!.id !== lead.id) return [];

  const results: CashPieces[] = [];

  function dfs(remaining: number, idx: number, current: CashPieces) {
    if (results.length >= maxResults) return;
    if (remaining === 0) {
      if (mustIncludePieceAtMost !== null) {
        const hasSmall = current.some((p) => denomValue(p.denominationId) <= mustIncludePieceAtMost);
        if (!hasSmall) return;
      }
      results.push([...current]);
      return;
    }
    if (idx >= eligible.length) return;
    if (current.length >= MAX_TIERS_PER_SPLIT) {
      dfs(remaining, idx + 1, current);
      return;
    }
    const denom = eligible[idx]!;
    // Cap counts so we never propose absurd breakdowns like 50×€1. The cap
    // is per-denomination and intentionally small — realistic cash drawers
    // rarely hold more than ~10 of any single piece.
    const maxCount = Math.min(
      Math.floor(remaining / denom.valueInCents),
      MAX_COUNT_PER_DENOM,
    );
    // The family is defined by its lead: the first denomination must appear
    // at least once, so families partition the search space.
    const minCount = idx === 0 ? 1 : 0;
    // Explore counts DESCENDING, "skip this denom" last. Larger counts of
    // larger denominations first means low-piece-count breakdowns — the
    // ones the ranking prefers — fill the result cap before the search
    // sinks into many-coin shapes.
    for (let count = maxCount; count >= 1; count--) {
      if (results.length >= maxResults) return;
      dfs(remaining - denom.valueInCents * count, idx + 1, [
        ...current,
        { denominationId: denom.id, count },
      ]);
    }
    if (minCount === 0) dfs(remaining, idx + 1, current);
  }

  dfs(target, 0, []);
  return results;
}

function piecesKey(pieces: CashPieces): string {
  return [...pieces]
    .sort((a, b) => a.denominationId.localeCompare(b.denominationId))
    .map((p) => `${p.count}x${p.denominationId}`)
    .join('+');
}

// ---------------------------------------------------------------------------
// Helpers exported for the dialog / context
// ---------------------------------------------------------------------------

/**
 * Sums the total value (in cents) of a breakdown.
 * Used by the dialog to validate that the user's chosen breakdown equals
 * the source bill's value.
 */
export function sumBreakdownCents(pieces: CashPieces): number {
  return pieces.reduce((sum, p) => sum + denomValue(p.denominationId) * p.count, 0);
}

/**
 * Returns `a − b` as a piece multiset, or null when `b` is not a subset
 * of `a` (some denomination of `b` exceeds its count in `a`).
 */
function subtractPieces(a: CashPieces, b: CashPieces): CashPieces | null {
  const counts = new Map<string, number>();
  for (const p of a) counts.set(p.denominationId, (counts.get(p.denominationId) ?? 0) + p.count);
  for (const p of b) {
    const remaining = (counts.get(p.denominationId) ?? 0) - p.count;
    if (remaining < 0) return null;
    counts.set(p.denominationId, remaining);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort((x, y) => denomValue(y[0]) - denomValue(x[0]))
    .map(([denominationId, count]) => ({ denominationId, count }));
}

/** Merges two piece multisets into one. */
export function mergePieces(a: CashPieces, b: CashPieces): CashPieces {
  const counts = new Map<string, number>();
  for (const p of a) counts.set(p.denominationId, (counts.get(p.denominationId) ?? 0) + p.count);
  for (const p of b) counts.set(p.denominationId, (counts.get(p.denominationId) ?? 0) + p.count);
  return [...counts.entries()]
    .sort((x, y) => denomValue(y[0]) - denomValue(x[0]))
    .map(([denominationId, count]) => ({ denominationId, count }));
}

const MAX_COMPLETION_CANDIDATES = 24;
/** Alternative completions computed alongside the best one. */
const MAX_COMPLETION_ALTERNATIVES = 3;

/** Candidate ways to fill `gap`: exact single piece + stratified splits. */
function completionCandidates(gap: number, sourceValue: number, pieceFloor: number): CashPieces[] {
  const candidates: CashPieces[] = [];
  const exactSingle = DENOMINATIONS.find(
    (d) => d.valueInCents === gap && d.valueInCents < sourceValue,
  );
  if (exactSingle) candidates.push([{ denominationId: exactSingle.id, count: 1 }]);
  candidates.push(...generateSplits(gap, pieceFloor, MAX_COMPLETION_CANDIDATES, null));
  if (pieceFloor > 1) {
    candidates.push(...generateSplits(gap, 1, MAX_COMPLETION_CANDIDATES, null));
  }
  return candidates;
}

/** Simulated transfer count for a complete breakdown of the source bill. */
export function simulateBreakdown(
  pieces: CashPieces,
  sourceDenominationId: string,
  input: CashSplitPoolInput,
): number {
  const pool = applyBreakdownToPool(input.denominations, sourceDenominationId, pieces);
  const result = smartSplit({
    employees: input.employees,
    totalInCents: input.totalInCents,
    kitchenPercent: input.kitchenPercent,
    denominations: pool,
    smartMode: true,
    fairnessThresholdInCents: input.thresholdInCents,
  });
  return result.differences.length;
}

/**
 * Guides the user toward a working breakdown while they count money out of
 * the till: given a *partial* selection (possibly empty), returns verified
 * completions of the remaining gap that still achieve the suggestion's
 * predicted transfer count — best first (fewest pieces), followed by up to
 * MAX_COMPLETION_ALTERNATIVES alternative routes.
 *
 * Every alternative must light up at least one denomination that no
 * earlier-returned completion uses — an alternative that only re-shuffles
 * counts of the same rows carries no visible information in the grid.
 *
 * Every returned completion is verified by simulation, consistent with the
 * rest of this module: no estimates.
 *
 * @param currentPieces - The user's current (incomplete) selection
 * @param sourceDenominationId - Bill being broken
 * @param targetTransferCount - Transfer count the completions must reach
 * @param input - Same pool/employee context used for the suggestions
 * @param seedBreakdowns - Known-good full breakdowns (the suggestion's
 *   variants); whenever the selection is still a subset of one, its
 *   remainder is tried first — so the initial guidance equals the
 *   suggester's best plan instead of depending on search budgets.
 */
/** A verified completion alongside the transfer count it achieves. */
export interface CompletionResult {
  pieces: CashPieces;
  transferCount: number;
}

export function suggestCompletions(
  currentPieces: CashPieces,
  sourceDenominationId: string,
  targetTransferCount: number,
  input: CashSplitPoolInput,
  seedBreakdowns: CashPieces[] = [],
): CompletionResult[] {
  const sourceValue = denomValue(sourceDenominationId);
  const gap = sourceValue - sumBreakdownCents(currentPieces);
  if (gap <= 0 || sourceValue <= 0) return [];

  const pieceFloor = computePieceFloor(input.thresholdInCents);
  const seen = new Set<string>();
  const passing: CompletionResult[] = [];

  const seedRemainders = seedBreakdowns
    .map((b) => subtractPieces(b, currentPieces))
    .filter((diff): diff is CashPieces => diff !== null && diff.length > 0);

  for (const completion of [...seedRemainders, ...completionCandidates(gap, sourceValue, pieceFloor)]) {
    const key = piecesKey(completion);
    if (seen.has(key)) continue;
    seen.add(key);

    const combined = mergePieces(currentPieces, completion);
    const transferCount = simulateBreakdown(combined, sourceDenominationId, input);
    if (transferCount > targetTransferCount) continue;
    passing.push({ pieces: completion, transferCount });
  }
  if (passing.length === 0) return [];

  passing.sort((a, b) => pieceCount(a.pieces) - pieceCount(b.pieces) || a.pieces.length - b.pieces.length);

  const result: CompletionResult[] = [passing[0]!];
  const coveredRows = new Set(passing[0]!.pieces.map((p) => p.denominationId));
  for (const candidate of passing.slice(1)) {
    if (result.length > MAX_COMPLETION_ALTERNATIVES) break;
    if (!candidate.pieces.some((p) => !coveredRows.has(p.denominationId))) continue;
    result.push(candidate);
    for (const p of candidate.pieces) coveredRows.add(p.denominationId);
  }
  return result;
}

/** Best verified completion only — see {@link suggestCompletions}. */
export function suggestCompletion(
  currentPieces: CashPieces,
  sourceDenominationId: string,
  targetTransferCount: number,
  input: CashSplitPoolInput,
): CashPieces | null {
  return suggestCompletions(currentPieces, sourceDenominationId, targetTransferCount, input)[0]?.pieces ?? null;
}

/**
 * True when SOME completion of the (possibly empty) gap reaches the target
 * transfer count — an early-exit existence check used by the removal search.
 */
function canComplete(
  pieces: CashPieces,
  sourceDenominationId: string,
  targetTransferCount: number,
  input: CashSplitPoolInput,
): boolean {
  const sourceValue = denomValue(sourceDenominationId);
  const gap = sourceValue - sumBreakdownCents(pieces);
  if (gap < 0 || sourceValue <= 0) return false;
  if (gap === 0) {
    return simulateBreakdown(pieces, sourceDenominationId, input) <= targetTransferCount;
  }

  const pieceFloor = computePieceFloor(input.thresholdInCents);
  const seen = new Set<string>();
  for (const completion of completionCandidates(gap, sourceValue, pieceFloor)) {
    const key = piecesKey(completion);
    if (seen.has(key)) continue;
    seen.add(key);
    const combined = mergePieces(pieces, completion);
    if (simulateBreakdown(combined, sourceDenominationId, input) <= targetTransferCount) return true;
  }
  return false;
}

/** Most units of a single denomination the removal search will suggest. */
const MAX_REMOVAL_UNITS = 3;

/**
 * Dead-end guidance: when NO completion of the current selection can reach
 * the target, finds the smallest removal (1–3 units of one denomination,
 * largest value first) after which a working completion exists again.
 * Returns the pieces to remove, or null if no single-denomination removal
 * unblocks the selection.
 */
export function suggestRemoval(
  currentPieces: CashPieces,
  sourceDenominationId: string,
  targetTransferCount: number,
  input: CashSplitPoolInput,
): CashPieces | null {
  const held = [...currentPieces]
    .filter((p) => p.count > 0)
    .sort((a, b) => denomValue(b.denominationId) - denomValue(a.denominationId));

  for (let units = 1; units <= MAX_REMOVAL_UNITS; units++) {
    for (const piece of held) {
      if (piece.count < units) continue;
      const reduced = currentPieces
        .map((p) =>
          p.denominationId === piece.denominationId ? { ...p, count: p.count - units } : p,
        )
        .filter((p) => p.count > 0);
      if (canComplete(reduced, sourceDenominationId, targetTransferCount, input)) {
        return [{ denominationId: piece.denominationId, count: units }];
      }
    }
  }
  return null;
}
