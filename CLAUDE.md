# CLAUDE.md

**tipsy** — PWA for splitting cash tips among restaurant staff.
Stack: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Vitest.
Deployment: Docker via Dokploy → `tipsy.emsr.cc`

## Commands

```bash
npm run dev           # Vite dev server (port 5173, HMR)
npm run build         # Type-check + production bundle
npm run type-check    # Standalone TypeScript check
npm run lint          # ESLint (strict, max-warnings 0)
npm run format        # Prettier write
npm test              # Vitest single-run (CI)
```

## Docs

- [Architecture](docs/architecture.md) — component layers, state, calculation flow
- [Styling](docs/styling.md) — Material Design 3, Tailwind conventions, theming
- [i18n](docs/i18n.md) — translations, namespaces, adding new strings
- [Data Model](docs/data-model.md) — all TypeScript types (Employee, Session, Shift, Profile, …)
- [Testing](docs/testing.md) — Vitest setup, renderWithProviders, factories, what to test
- [Smart Split](docs/smart-split.md) — algorithm, fairness score, transfers, threshold logic

**Docs must be kept up to date.** When making changes that affect architecture, styling conventions, or i18n patterns, update the relevant doc file in the same step.

**JSDoc must be kept up to date.** When changing a function's signature, behaviour, or purpose, update its JSDoc comment in the same step.
