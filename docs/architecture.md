# Architecture

## Component Layers (Atomic Design)

| Layer | Path | Purpose |
|---|---|---|
| `ui/` | `src/components/ui/` | shadcn/ui output — **do not edit** |
| `atoms/` | `src/components/atoms/` | shadcn primitives + app-specific behavior |
| `molecules/` | `src/components/molecules/` | compose atoms |
| `organisms/` | `src/components/organisms/` | complex, compose molecules |
| `layouts/` | `src/layouts/` | AppLayout, ScreenContainer |
| `screens/` | `src/screens/` | SetupScreen, CashInputScreen, ResultsScreen |

## State Management

| Store | Mechanism | Persists to | What |
|---|---|---|---|
| `TipSessionContext` | React context | `sessionStorage` | Active calculation (employees, split, denominations, results) |
| `ProfileContext` | React context + `useLocalStorage` | `localStorage` | User profiles, active profile, guest mode |
| `ThemeContext` | React context + `useLocalStorage` | `localStorage` | Theme, accent color, light/dark mode |
| `useShifts` | `useLocalStorage` | `localStorage` | Shift history |
| `useLocale` | i18next + `useLocalStorage` | `localStorage` (`tipsy-lang`) | Current language |
| Smart split threshold | `useLocalStorage` | `localStorage` | Active: `tipsy_smart_split_threshold`, Default: `tipsy_smart_split_default_threshold` |

**Provider order** (in `main.tsx`):
```
BrowserRouter → ThemeProvider → AuthProvider → ProfileProvider → TipSessionProvider → ToastProvider → App
```

## 3-Step Calculation Flow

```
/calculate       SetupScreen      → employees + kitchen/service split + smart mode
/calculate/cash  CashInputScreen  → denomination quantities
/calculate/results ResultsScreen  → run calculate(), show distribution, save shift
```

- Any edit in step 1–2 nullifies `session.results` (forces recalculation)
- `reset()` clears sessionStorage and resets to `DEFAULT_SESSION`
- On save/reset: active smart split threshold resets to the Settings default

## Money

- All monetary values are **integer euro cents** — never floats
- Display: `formatEurFromCents(cents, locale)` from `src/lib/formatCurrency.ts`
- Input parsing: `parseCentsFromInput(str)` from the same file
- Locale strings: `'de-DE'` or `'en-US'` derived from `useLocale()`

## Key Hooks

- `useTipCalculator()` — thin wrapper over TipSessionContext
- `useProfiles()` — thin wrapper over ProfileContext
- `useSmartSplitter(employees, total, kitchenPct, denominations)` — runs smart split algorithm, manages threshold state
- `useLocalStorage<T>(key, initialValue)` — typed localStorage state with cross-tab sync
- `useToast()` — show toast notifications
