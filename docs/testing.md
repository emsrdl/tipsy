# Testing

**Runner:** Vitest + jsdom. **Coverage:** v8, 80% lines/functions, 75% branches.

```bash
npm test              # single run (CI)
npm run test:watch    # interactive watch
npm run test:coverage # coverage report → coverage/
```

## Test File Locations

```
src/hooks/__tests__/   — hook tests (useSmartSplitter, useProfiles, useLocalStorage, …)
src/lib/__tests__/     — algorithm & utility tests (smartSplitter, tipCalculator, …)
src/utils/__tests__/   — math, export, validation helpers
```

Naming: `*.test.ts` for logic, `*.test.tsx` for components.

## Utilities

### `renderWithProviders`

Use instead of RTL's `render()` for any component that depends on app contexts (theme, session, i18n, router).

```typescript
import { renderWithProviders } from '@/test/renderWithProviders';

renderWithProviders(<MyComponent />, {
  initialSession: { /* partial TipSession overrides */ }
});
```

### Factories

Typed factories with sensible defaults — all accept partial overrides.

```typescript
import {
  makeEmployee, makeSplit, makeSession,
  makeResult, makeProfile, makeShift,
  makePersonShare, makeSmartDistribution, makeDifferenceLine,
  makeDenomQty,
} from '@/test/factories';

const emp = makeEmployee({ name: 'Anna', hours: 6 });
const session = makeSession({ employees: [emp] });
const shift = makeShift({ profileId: 'p1' });
```

## Global Setup (`src/test/setup.ts`)

Runs before every test automatically:
- `@testing-library/jest-dom` matchers (`toBeInTheDocument()` etc.)
- `import.meta.env` mocked with test defaults (`VITE_APP_DOMAIN`, `VITE_DEFAULT_THEME`, …)
- `window.matchMedia` stubbed (jsdom doesn't implement it)
- **i18next returns the key as-is** — `t('actions.next')` → `"actions.next"` — no locale files loaded

## Standard Imports

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { makeEmployee, makeSession } from '@/test/factories';
```

## What to Test

| Area | Test what |
|---|---|
| Lib functions | Correctness, edge cases (zero, negative, empty) |
| Hooks | State changes, side effects, memoization |
| Organisms/Screens | Rendering, context wiring, user interactions |

**Do not test:** shadcn/ui components (`src/components/ui/`), type definitions, trivial getters.

## Coverage Exclusions

- `src/components/ui/**` (shadcn output)
- `src/test/**`
- `*.types.ts`
