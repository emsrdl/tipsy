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
- **Swap phase:** try swapping denominations between employees to reduce deviations
- **Mop-up phase:** assign all remaining denominations to the most underpaid employee, guaranteeing no leftover cash
- **Safety net:** if any working employee has €0, move the smallest denomination from the most overpaid employee to them

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
