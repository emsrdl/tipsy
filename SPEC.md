# SPEC — tipsy

Distilled from code at `02621ae` (v0.7.0). `?` = inferred, confirm.

## §G — goal

Offline-capable PWA. Split night's cash tips among restaurant staff by hours worked and
kitchen/service ratio, then say which physical bills each person takes and who owes whom.

## §C — constraints

- money = integer euro cents. never float. never `Number.toFixed` arithmetic.
- cash is physical. distribution limited by denominations actually in till.
- EUR only. 13 denominations, €100 → 1ct. no €200/€500.
- no backend. no accounts. all state in browser: `sessionStorage` (active session), `localStorage`
  (rest).
- offline-first. PWA, `registerType: 'autoUpdate'`, workbox precache,
  `navigateFallback: /index.html`.
- phone-first. touch targets ≥ 40px, primary actions ≥ 56px. Material Design 3 tokens.
- bilingual DE/EN. DE default, DE fallback (`fallbackLng: 'de'`, `src/lib/i18n.ts:52`). no
  hardcoded user-facing strings.
- stack fixed: Vite 6 + React 18 + TS 5.6 + Tailwind 4 + shadcn/ui + Vitest. bun ≥ 1.1.
- `bun run lint` = eslint `--max-warnings 0`. `bun run build` = `tsc --noEmit` then bundle. both
  gate CI.
- Conventional Commits enforced by commitlint + PR-title check. semantic-release owns version.
- ship: Docker multi-stage (bun build → nginx alpine), Dokploy → `tipsy.emsr.cc`.
- docs in `docs/` + JSDoc must move with the code that changes them (CLAUDE.md).

## §I — surfaces

### routes (`src/App.tsx`)

| path                 | screen                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `/`                  | → `/calculate`                                                          |
| `/calculate`         | `SetupScreen` — employees, kitchen/service split, smart toggle          |
| `/calculate/cash`    | `CashInputScreen` — denomination counts                                 |
| `/calculate/results` | `ResultsScreen` — distribution, transfers, cash-split suggestions, save |
| `/history`           | `HistoryScreen` — shift list, charts, import/export                     |
| `/settings`          | `SettingsScreen` — profiles, theme, language, default threshold/split   |
| `*`                  | → `/calculate`                                                          |

### calc core

- `calculateDistribution(input): DistributionResult[]` — `src/lib/calc/tipCalculator.ts`
- `smartSplit(input: SmartSplitInput): SmartSplitOutput` — `src/lib/calc/smartSplitter.ts`
- `calculateTransfers(personShares, thresholdInCents)` — same file
- `buildAvailablePool(denominations): AvailableDenomination[]` — same file
- `matchDenominations(input): DenominationMatchResult` — `src/hooks/useDenominationMatcher.ts`
- `suggestCashSplits(input): CashSplitSuggestion[]` — `src/lib/calc/cashSplitSuggester.ts`
- `suggestCompletions` / `suggestCompletion` / `suggestRemoval` / `simulateBreakdown` — same file
- `applyBreakdownToPool` / `revertBreakdownFromPool` / `mergePieces` / `sumBreakdownCents` /
  `piecesKey` — same file
- `percentageOf` `roundToNearest` `clampInt` `proportionalSplit` `mean` `tipPerHour` `rmsd`
  `fairnessScoreFromMeanDev` `postTransferFairnessScore` `fairnessScoreColor` —
  `src/lib/calc/calculations.ts`
- `sumDenominations(quantities, denominations)` — `src/lib/calc/denominationParser.ts`
- `validateEmployees` `validateSplit` `validateDenominations` `validateSession` —
  `src/lib/validators.ts`
- `formatEurFromCents` `formatSignedEurFromCents` `parseCentsFromInput` `toFmtLocale` —
  `src/lib/format/formatCurrency.ts`

### io

- `exportShiftsCsv` `downloadShiftsCsv` `exportShiftsPdf` `exportBackupJson` `downloadBackupJson`
  `importShiftsJson` — `src/lib/io/importExport.ts`
- `formatResultsForExport` `buildCsvString` `buildExportSummary` `formatPayoutDetails` —
  `src/lib/io/export.ts`
- `exportTipsCsv` — `src/lib/io/exportCsv.ts`. `exportTipsPdf` — `src/lib/io/exportPdf.ts`

### contexts (provider order in `src/main.tsx`)

`BrowserRouter → ThemeProvider → AuthProvider → ProfileProvider → TipSessionProvider → ToastProvider → App`

- `TipSessionContextValue` — `session`, `totalInCents`, `addEmployee`, `removeEmployee`,
  `updateEmployee`, `setSplit`, `setDenominationQuantity`, `calculate`, `reset`, `applyCashSplit`,
  `revertCashSplit`, `wasRestored`
- `ProfileContextValue` — `profiles`, `activeProfile`, `createProfile`, `switchProfile`,
  `updateProfile`, `updateProfileStats`, `deleteProfile`, `resetProfileStats`, `signOut`
- `ThemeContextValue`, `ToastContextValue` (`useToast`), `AuthContextValue` (v1 stub, always signed
  out)

### persistence keys

| key                                                    | store            | holds                                                     |
| ------------------------------------------------------ | ---------------- | --------------------------------------------------------- |
| `tipsy_session`                                        | `sessionStorage` | active `TipSession`                                       |
| `tipsy_shifts`                                         | `localStorage`   | `Shift[]` history                                         |
| `tipsy-history`                                        | `localStorage`   | `useCalculation` history — separate from `tipsy_shifts` ? |
| `tipsy_smart_mode`                                     | `localStorage`   | smart mode on/off                                         |
| `tipsy_smart_split_threshold`                          | `localStorage`   | active session threshold                                  |
| `tipsy_smart_split_default_threshold`                  | `localStorage`   | user default, set in Settings only                        |
| `tipsy_default_split_kitchen_percent`                  | `localStorage`   | default kitchen %                                         |
| `tipsy-theme` `tipsy-accent` `tipsy-mode` `tipsy-lang` | `localStorage`   | appearance + language                                     |
| `tipsy_profiles` `tipsy_active_profile_id`             | `localStorage`   | `Profile[]` + active id                                   |

### build-time env (`src/config/env.ts`)

`VITE_APP_DOMAIN` (or `auto` → `window.location.hostname`), `VITE_APP_NAME`, `VITE_DEFAULT_THEME`,
`VITE_DEFAULT_LANG`, `VITE_APP_VERSION`, `VITE_OIDC_AUTHORITY|CLIENT_ID|REDIRECT_URI|SCOPE`. All
four OIDC vars or none — partial config warns and stays inactive.

### other

- i18n files `src/locales/{de,en}/{common,errors,screens}.json`. namespaced
  `t('common:actions.save')`.
- theme palette: `src/config/themes.ts` is single source. Vite plugin `tipsy:theme-palette` emits
  CSS vars into `index.html`. `data-theme` + `data-mode` on `<html>`.
- PWA manifest `public/manifest.webmanifest` (hand-written, `manifest: false` in VitePWA).
- CI `.github/workflows/`: `ci.yml` (build|lint|test), `pr-check.yml` (title/label), `release.yml`.

## §V — invariants

- **V1.** All monetary values are integer cents. No float euros cross a function boundary.
- **V2.** `proportionalSplit(total, weights)` sums exactly to `total`. Remainder → largest
  fractional part.
- **V3.** `calculateDistribution` output sums exactly to `totalInCents`, for any split and any hour
  mix. (VIOLATED — see B1. invariant is correct, code is not. do not weaken to match.)
- **V4.** Employees with no counterpart group absorb the whole pot (0 kitchen staff → service gets
  100%).
- **V5.** Normal mode (`smartMode: false`): every deviation is 0, fairness score is 100, transfers
  empty.
- **V6.** Smart mode distributes every available denomination. No leftover cash in the pool.
- **V7.** Matcher never assigns more units of a denomination than the pool holds.
- **V8.** `deviationInCents === actualShareInCents − idealShareInCents` for every `PersonShare`.
- **V9.** Fairness score ∈ [0, 100], integer.
- **V10.** Transfer suggested only between a person over `+threshold` and one under `−threshold`.
- **V11.** Zero-payout fix is best-effort only: never applied if it raises the squared-deviation
  sum, or zeroes the donor, or pushes the donor across the transfer threshold (new transfer).
- **V12.** Every cash-split breakdown sums exactly to its source bill's value.
- **V13.** Cash-split predicted transfer counts come from a real `smartSplit` simulation. Never
  estimated.
- **V14.** No breakdown piece is smaller than `pieceFloor` = smallest standard denomination ≥
  threshold.
- **V15.** `suggestCashSplits` is deterministic — same input, same ids, same order.
- **V16.** ≤ 3 suggestions returned, ≤ 4 breakdowns each, sorted by (predicted transfers ASC, bill
  value DESC).
- **V17.** `applyCashSplit` then `revertCashSplit` restores the denomination pool exactly.
- **V18.** `buildAvailablePool` drops zero-quantity entries and unknown denomination ids.
- **V19.** `sumDenominations` ignores unknown ids and floors fractional quantities. Never throws.
- **V20.** `parseCentsFromInput` returns `null` for empty, non-numeric, and negative input.
- **V21.** `validateSplit`: `kitchenPercent + servicePercent === 100`, both non-negative, neither
  `NaN`.
- **V22.** `validateEmployees`: name trimmed 1–50 chars, hours > 0 and not `NaN`, list non-empty.
  (V21+V22 hold as unit facts but guard nothing — validators have no callers. see B2.)
- **V23.** Any edit in step 1 or 2 nullifies `session.results`. Stale results never shown.
- **V24.** — retired, superseded by V36 (was true only of `ResultsScreen`).
- **V25.** `useLocalStorage` falls back to its initial value on unparseable JSON, and syncs across
  tabs via `storage` events for its own key only.
- **V26.** `importShiftsJson` deduplicates by `Shift.id` and skips malformed entries instead of
  aborting.
- **V27.** Shift CSV export starts with a UTF-8 BOM. Backup JSON is a versioned envelope, not a bare
  array.
- **V28.** Creating an active profile deactivates the previous one. Deleting the active profile
  clears it.
- **V29.** `src/locales/de/*.json` and `src/locales/en/*.json` hold identical key sets. (holds,
  untested)
- **V30.** Every user-initiated commit action (save, delete, import, reset) surfaces a toast.
  Continuous edits (hours, denomination counts, name) do not. Destructive actions go through
  `ConfirmDialog`.
- **V31.** Colors come from `src/config/themes.ts`. No hex literal in component markup —
  `ColorSwatch` takes `hex` as a prop, that is the one legitimate carrier.
- **V32.** `bun run lint` and `bun run build` pass clean. Zero warnings.
- **V33.** Coverage ≥ 80% lines, 80% functions, 75% branches. (VIOLATED — see T2)
- **V34.** A group holding employees but zero total hours is allocated no pool. Cash never leaves
  the distribution because nobody in a group logged time. Guards B1.
- **V35.** Employee ids are unique within a session. `calculateDistribution` over-allocates on
  duplicate ids — callers not going through `addEmployee` must guarantee uniqueness.
- **V36.** Every reset path restores the active threshold to the Settings default. Not only
  `ResultsScreen`.
- **V37.** `remainingCents` never clamps a negative. Over-distribution is a hard failure, not a 0.

## §T — tasks

| id  | st  | task                                                                                                                                                    | cites   |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| T1  | .   | coverage is 38.52% lines / 32.55% fn / 28.38% br — `bun run test:coverage` exits 1                                                                      | V33     |
| T2  | .   | zero component/screen tests exist; every `src/screens/**` and `src/components/**` file is 0%                                                            | V33     |
| T3  | .   | add coverage job to `ci.yml` — thresholds only fail locally today, so drift went unseen                                                                 | V33     |
| T4  | .   | add de/en locale key-parity test — parity holds now, nothing guards it                                                                                  | V29     |
| T5  | .   | `denominationParser.test.ts:63` named "covers all 15 denominations", asserts 13                                                                         | V19     |
| T6  | .   | `docs/testing.md` paths stale: calc tests live in `src/lib/calc/__tests__`, io in `src/lib/io/__tests__`, `src/utils/__tests__` does not exist          | —       |
| T7  | .   | `docs/architecture.md:45` cites `src/lib/formatCurrency.ts`; real path `src/lib/format/formatCurrency.ts`                                               | I       |
| T8  | .   | `docs/architecture.md` screen table omits `HistoryScreen` and `SettingsScreen`                                                                          | I       |
| T9  | .   | screens are oversized: `SettingsScreen` 691 lines, `ResultsScreen` 562, `HistoryScreen` 551 — extract organisms ?                                       | —       |
| T10 | .   | two history stores coexist: `useCalculation`→`tipsy-history`, `useShifts`→`tipsy_shifts`. one is likely dead ?                                          | I       |
| T11 | x   | `FORMAT.md` absent at repo root — spec skill expects it for caveman encoding rules                                                                      | —       |
| T12 | .   | `AuthContext` is a v1 stub; OIDC config plumbed but no provider. decide v2 or delete ?                                                                  | I       |
| T13 | .   | BLOCK — `distributePool` drops a group's pool when its total hours are 0 (`tipCalculator.ts:115`). €40 lost on a 10000¢ / 40-60 / 0h-kitchen input      | V3,V34  |
| T14 | .   | BLOCK — wire `validateSession` into the step gate or delete the validators. `canContinue = hasEmployees` (`SetupScreen.tsx:57`) is the only check today | V21,V22 |
| T15 | .   | `SetupScreen.tsx:125` resets the session without restoring the threshold; `ResultsScreen.tsx:161,169` does                                              | V36     |
| T16 | .   | no test covers `revertCashSplit` / `revertBreakdownFromPool` round-trip                                                                                 | V17     |
| T17 | .   | drop the `Math.max(0, …)` clamp on `remainingCents` (`smartSplitter.ts:193`) — it hides over-distribution                                               | V37     |
| T18 | .   | `matchDenominations` is a pure algorithm living in `src/hooks/useDenominationMatcher.ts`; `lib/calc/` is where algorithms go                            | I       |

## §B — bugs

| id  | date       | cause                                                                                                                                                                                                                                        | fix |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| B1  | 2026-08-16 | `distributePool` carves a pool for a group, then returns all-zero when that group's `totalHours === 0` (`tipCalculator.ts:90` vs `:115`). Cash assigned to nobody. Reachable: hours stepper has `min={0}` (`EmployeeRow.tsx:157`)            | V34 |
| B2  | 2026-08-16 | `validateEmployees` / `validateSplit` / `validateDenominations` / `validateSession` have no callers — only a JSDoc example (`src/types/calculation.ts:231`). Invalid input reaches the algorithm unchecked. Root cause of B1 being reachable | V22 |
