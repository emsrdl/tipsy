# tipsy

Progressive Web App to split cash tips among restaurant staff.
Stack: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Vitest
Live: `tipsy.emsr.cc`

## Quick start

```bash
bun install
bun run dev      # dev server at localhost:5173
bun run build    # type-check + production bundle
bun test         # run tests
```

## Docker

```bash
docker compose --profile dev up   # dev server with HMR
docker compose up --build         # production nginx preview
```

## Project structure

```
src/
  components/   atoms, molecules, organisms, ui (shadcn)
  screens/      SetupScreen, CashInputScreen, ResultsScreen
  context/      TipSessionContext, ProfileContext, ThemeContext, ToastContext
  hooks/        consumer hooks and utilities
  lib/          algorithms (tipCalculator, smartSplitter, …)
  locales/      de/ and en/ translation files
  types/        all TypeScript types
  styles/       globals.css with CSS custom properties
docs/           architecture, styling, i18n, data model, testing, smart split
```

## Releases

`semantic-release` runs on pushes to `main` via `.github/workflows/release.yml` — analyzes Conventional Commits and creates tags + GitHub Releases automatically.
`version-build.yml` builds artifacts on tag pushes and injects `VITE_APP_VERSION`.
