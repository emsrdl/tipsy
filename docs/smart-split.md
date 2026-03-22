# Smart Split

Core domain logic in `src/lib/smartSplitter.ts`. Config in `src/config/smartSplit.ts`.

## Constants

```typescript
DEFAULT_FAIRNESS_THRESHOLD = 500        // cents (€5) — hardcoded fallback
SMART_SPLIT_THRESHOLD_KEY               // localStorage: active session threshold
SMART_SPLIT_DEFAULT_THRESHOLD_KEY       // localStorage: user default (set only in Settings)
MAX_TRANSFER_CHAINS = 3                 // max transfer suggestions shown
SMART_SPLIT_ENABLED = true              // default mode on new session
```

The active threshold resets to the Settings default whenever a calculation is saved or reset.

## Two Modes

**Normal mode** (`smartMode: false`) — proportional distribution only, no denomination optimization. All deviations are 0, fairness score is 100, no transfers.

**Smart mode** (`smartMode: true`) — optimizes denomination assignment to minimize deviations, then suggests transfers to settle remaining imbalances.

## Algorithm (Smart Mode)

### Step 1 — Ideal Proportional Shares

`calculateDistribution()` in `src/lib/tipCalculator.ts`:
1. Split total into kitchen pool and service pool by `kitchenPercent`
2. Within each pool, distribute proportionally by hours worked
3. Remainder cents → employee with largest fractional part

### Step 2 — Denomination Matching

`matchDenominations()` in `src/hooks/useDenominationMatcher.ts`:
- **Greedy phase:** assign denominations largest-first toward each employee's ideal
- **Swap phase:** try swapping denominations between employees to reduce deviations

Output: `EmployeePayoutPlan[]` — physical bills/coins assigned per employee.

### Step 3 — Fairness Score

```
meanDeviation = sum(|deviationInCents|) / employeeCount
score = 100 − min(100, (meanDeviation / totalInCents) × 10000)
```

Score 100 = perfect. A 1% mean deviation yields score 0.

### Step 4 — Transfer Suggestions

`calculateTransfers(personShares, thresholdInCents)`:
1. Collect overpaid employees (`deviation > threshold`) and underpaid (`deviation < -threshold`)
2. Sort both by absolute deviation descending
3. Pair largest overpaid ↔ largest underpaid, up to `MAX_TRANSFER_CHAINS` (3)
4. Transfer amount = `min(overpaid.remaining, underpaid.remaining)`

## Example

```
Employees: Anna (8h, service), Bob (4h, service)
Total: €100, Kitchen 0%
Denominations: 2 × €50

Ideal:  Anna 6667¢, Bob 3333¢
Actual: Anna 5000¢, Bob 5000¢  (one €50 each)
Deviations: Anna −1667¢, Bob +1667¢

Threshold 500¢ → both exceed → suggest: Bob pays Anna €16.67
Fairness score: 100 − min(100, (1667/10000) × 10000) ≈ 83
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
