# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project

**tipsy** — a Progressive Web App for splitting cash tips among restaurant staff.

Stack: **Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Vitest** Deployment: Docker via
Dokploy → `tipsy.emsr.cc`

## Commands

```bash
npm run dev           # Vite dev server (port 5173, HMR)
npm run build         # Type-check + production bundle
npm run preview       # Serve dist/ locally
npm run type-check    # Standalone TypeScript check
npm run lint          # ESLint (strict, max-warnings 0)
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier write
npm run format:check  # Prettier check (CI)
npm test              # Vitest single-run (CI)
npm run test:watch    # Vitest interactive watch
npm run test:coverage # Coverage report to coverage/
```

## Architecture

### Component Layers (Atomic Design)

- `src/components/ui/` — shadcn/ui output. **Do not edit directly.**
- `src/components/atoms/` — wrap shadcn primitives with app-specific behavior
- `src/components/molecules/` — compose atoms
- `src/components/organisms/` — complex, compose molecules
- `src/layouts/` — AppLayout, ScreenContainer
- `src/screens/` — SetupScreen, CashInputScreen, ResultsScreen

### Key Conventions

- **No hardcoded values**: colors via CSS variables, strings via i18n, domain via `env.ts`
- **All colors** in `src/styles/globals.css` via CSS custom properties; theme switched via
  `data-theme`/`data-mode` on `<html>`
- **i18n**: 3 namespaces per language (`common`, `screens`, `errors`); default DE, fallback EN
- **Money**: always integer euro cents; `formatEurFromCents()` for display
- **Border radius**: `rounded-md` = 12px everywhere (set in `tailwind.config.ts`)

### Themes

- `tipsy`: 5 selectable accent colors (blue/purple/pink/orange/green)
- `katzentempel`: fixed primary #6BA644, no accent picker

### Docker

```bash
docker compose --profile dev up   # dev server with HMR
docker compose up --build         # production nginx preview
```
