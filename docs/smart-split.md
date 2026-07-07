# Smart Split

Core domain logic in `src/lib/calc/smartSplitter.ts`. Config in `src/config/smartSplit.ts`.

## Constants

```typescript
DEFAULT_FAIRNESS_THRESHOLD = 100        // cents (€1) — hardcoded fallback
SMART_SPLIT_THRESHOLD_KEY               // localStorage: active session threshold
SMART_SPLIT_DEFAULT_THRESHOLD_KEY       // localStorage: user default (set only in Settings)
SMART_SPLIT_ENABLED = true              // default mode on new session
```

The active threshold resets to the Settings default whenever a calculation is saved or reset.

## Two Modes

**Normal mode** (`smartMode: false`) — proportional distribution only, no denomination optimization. All deviations are 0, fairness score is 100, no transfers.

**Smart mode** (`smartMode: true`) — optimizes denomination assignment to minimize deviations, then suggests transfers to settle remaining imbalances.

## Algorithm (Smart Mode)

### Step 1 — Ideal Proportional Shares

`calculateDistribution()` in `src/lib/calc/tipCalculator.ts`:
1. Split total into kitchen pool and service pool by `kitchenPercent`
2. Within each pool, distribute proportionally by hours worked
3. Remainder cents → employee with largest fractional part

### Step 2 — Denomination Matching

`matchDenominations()` in `src/hooks/useDenominationMatcher.ts`:
- **Greedy phase:** assign denominations largest-first toward each employee's ideal
- **Sweep phase:** improve pairs (overpaid A, underpaid B) with two operations — *moving* one unit from A to B, or *exchanging* one unit each (e.g. A's €20 for B's €10, shifting the €10 difference). An operation is accepted if it reduces the sum of squared deviations; exchanges can settle imbalances smaller than A's smallest piece, which moves alone cannot.
- **Mop-up phase:** assign all remaining denominations to the most underpaid employee, ensuring no leftover cash
- **Safety net (best-effort):** if any working employee has €0, try to move the smallest denomination from an overpaid employee to them. The move only happens when the donor keeps a non-zero payout, the sum of squared deviations decreases, **and** the donor's deviation isn't pushed across the transfer threshold (that would create a brand-new transfer). With a too-coarse pool (e.g. a single €50 for two people), a €0 payout plus one transfer is preferred over shifting the €0 and doubling the deviations.

Output: `EmployeePayoutPlan[]` — physical bills/coins assigned per employee. All available cash is always distributed.

### Step 3 — Fairness Score

```
meanDeviation = sum(|deviationInCents|) / employeeCount
meanIdeal = totalIdeal / employeeCount
score = max(0, round(100 × (1 − meanDeviation / meanIdeal)))
```

Score 100 = perfect. Off by 50% of individual ideal share → score 50. Off by 10% → score 90.

### Step 4 — Transfer Suggestions

`calculateTransfers(personShares, thresholdInCents)`:
1. Collect overpaid employees (`deviation > threshold`) and underpaid (`deviation < -threshold`)
2. Sort both by absolute deviation descending
3. Pair largest overpaid ↔ largest underpaid (no limit on number of transfers)
4. Transfer amount = `min(overpaid.remaining, underpaid.remaining)`

The algorithm concentrates surplus in as few senders as possible — the most overpaid person handles all their transfers before moving to the next.

## Example

```
Employees: Anna (8h, service), Bob (4h, service)
Total: €100, Kitchen 0%
Denominations: 2 × €50

Ideal:  Anna 6667¢, Bob 3333¢
Actual: Anna 5000¢, Bob 5000¢  (one €50 each)
Deviations: Anna −1667¢, Bob +1667¢

Threshold 100¢ → both exceed → suggest: Bob pays Anna €16.67
Fairness score: round(100 × (1 − 1667/5000)) = 67
```

## Hook

```typescript
const { output, isSmartMode, toggleSmartMode, thresholdInCents, setThreshold } =
  useSmartSplitter(employees, totalInCents, kitchenPercent, denominations);

output.distribution.personShares   // per-person shares with deviations
output.differences                 // transfer suggestions
output.distribution.fairnessScore  // 0–100
output.payoutPlans                 // denomination assignments (smart mode only)
```

The hook is used in both `SetupScreen` (preview) and `ResultsScreen` (final display).

---

## Cash split suggestions

Core logic in `src/lib/calc/cashSplitSuggester.ts`. Hook in `src/hooks/useCashSplitSuggestions.ts`. UI in `src/components/organisms/CashSplitSuggestions/`.

### Motivation

Transfers exist because the denomination pool is too coarse for the matcher to land each person exactly on their ideal share. If any bill in the pool can be exchanged for smaller denominations, the matcher gains more granularity and may eliminate one or more transfers entirely.

### Algorithm

```
suggestCashSplits(denominations, smartOutput, employees, totalInCents, kitchenPercent, thresholdInCents)
```

1. **Piece-size floor** — compute `pieceFloor = smallest standard denomination ≥ thresholdInCents`. Splits that produce pieces below this floor are skipped: sub-threshold deviations don't trigger transfers, so finer change adds noise rather than value.

2. **Pass 1 — Transfer-targeted** — for each transfer `(from → to, amount X)`:
   - Find pool bills with `value > X` (too coarse to hand over as-is).
   - Generate splits of those bills into smaller standard denominations where every piece ≥ `pieceFloor` and at least one piece ≤ `X` (so it can flow to the underpaid person).
   - Splits are capped at 5 distinct denominations and 10 units per denomination (no `50×€1` absurdities).
   - Enumeration is *stratified by lead family* (largest piece in the split): each family (€50-based, €20-based, €10-based, …) gets its own budget, so genuinely different paths surface even for big bills where a single search would exhaust the budget inside the largest family.

3. **Pass 2 — Fallback** — additionally generate canonical tier-down splits for the largest bills in the pool (no transfer-amount constraint).

4. **Simulation** — for each candidate, build a hypothetical pool (source bill −1, target pieces +count), re-run `smartSplit(...)` on it. Discard candidates that don't reduce transfers or improve fairness. Predictions are always exact simulation results, never estimates.

5. **Group per source bill** — the best candidate (fewest transfers, then fewest total pieces, then fewest distinct denominations, then highest fairness) becomes `breakdowns[0]`; up to 3 further candidates with the *same* predicted transfer count are kept as alternative breakdowns. Alternatives with a distinct leading denomination are preferred (a "€10-based" variant is more useful next to a "€20-based" one than a third near-identical €20 shape). Every breakdown sums exactly to the source bill's value.

6. **Rank** — sort suggestions by `(predictedTransferCount ASC, sourceBillValue DESC)`. Return top 3.

### Dialog behaviour

The suggestion card names only **which bill to break** and how the transfers shrink (`1 → 0`) — no breakdown is prescribed. Tapping it opens the picker dialog (`CashSplitDialog`). The dialog is presentation only; the selection state and all guidance derivation below live in `useCashSplitGuidance` (`src/hooks/useCashSplitGuidance.ts`).

The dialog opens **empty** on purpose: the user counts real money out of the till and the guidance follows along, recomputed from the actual selection on every change via simulation. Nothing is pre-selected; the stored variants only *seed* the guidance (see below). The live transfer preview simulates the actual selection once the total equals the source bill's value (partial selections show "—"); Confirm is disabled until the total matches exactly.

**Row guidance** — one corner badge per row, three mutually exclusive modes:

- **On a path** (a verified completion of the current selection exists, `suggestCompletions`): green badges show the per-denomination counts of the best completion — "add n more" — and re-anchor instantly when the user takes a different piece. Orange badges mark denominations that only *alternative routes* use (up to 3 alternatives are computed alongside; each must light up at least one denomination no earlier route uses, otherwise it carries no visible information). Tapping an orange badge finishes via that route. The summary bar shows the best completion as a tappable "Complete with + …" shortcut. Selected rows render green subtotals ("keep these").
- **Goal reached** (total exact and simulated transfers ≤ predicted): no add/remove badges — this holds for any proven path, including fully custom ones. Orange badges remain as pointers to whole other variants ("what else would have worked"); tapping replaces the selection.
- **Dead end** (exact but worse than predicted, or partial with no completion): a red badge shows the smallest removal (`−n`, via `suggestRemoval`: 1–3 units of one denomination, largest first) after which a verified completion exists again.

**Seeding**: the suggestion's stored variants are passed to `suggestCompletions` as known-good breakdowns — while the selection is still a subset of one, its remainder *outranks* every freshly generated completion (seeds sort first, in variant order, primary before alternatives). The route the user is following therefore stays primary until they actually deviate from all known variants — a same-value generated reshuffle can never demote it to an orange alternative mid-route — and the initial (empty-selection) guidance always equals the suggester's best plan instead of depending on search budgets.

Performance: each recomputation is ~30–50 `smartSplit` simulations (a few ms); the removal search runs only in dead ends and early-exits on the first witness.

### Threshold interaction

Setting a higher fairness threshold reduces the effective piece-size floor, which means fewer and larger suggested splits. At threshold €5, for example, only bills above €5 are candidates and the smallest suggested piece is €5.

### Session state

`TipSession.appliedCashSplits: AppliedCashSplit[]` records every accepted split (with the user's actual pieces and a unique id) so each can be reversed individually.

- **Apply** (`applyCashSplit(suggestion, actualPieces)`) — decrements the source denomination by 1, increments the chosen pieces, appends to `appliedCashSplits`. The smart split output recalculates automatically from the changed pool.
- **Revert** (`revertCashSplit(splitId)`) — reverses the denomination change, removes the entry from `appliedCashSplits`.

Applied splits persist through sessionStorage with the rest of the session and are cleared on `reset()`.
