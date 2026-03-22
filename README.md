# tipsy

Progressive Web App to split cash tips among restaurant staff.

Quick start

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Tests: `npm test`

Layout

- `src/` — application source
- `public/` — static assets
- `styles/` — global CSS and theme variables

Docker

- `docker compose up --build` — preview production image

Automated releases

- `semantic-release` is configured to run on pushes to `main` via `.github/workflows/release.yml`
  and `.releaserc.json`. It will analyze Conventional Commits and create tags + GitHub Releases
  automatically.
- The `version-build.yml` workflow builds artifacts on tag pushes (and PRs) and injects
  `VITE_APP_VERSION`.
