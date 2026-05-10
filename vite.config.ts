/**
 * @file vite.config.ts
 * @description Vite build configuration.
 *
 * Configures:
 * - React plugin with Fast Refresh
 * - Path aliases matching tsconfig.json (must be kept in sync)
 * - Dev server settings
 *
 * Version resolution order:
 * 1. `VITE_APP_VERSION` env var (set by CI, release, and Dokploy preview builds)
 * 2. `git describe --tags --long --always` (dev server — always includes commit count + hash)
 * 3. `git describe --tags --always` (builds — clean tag at release, hash when ahead of tag)
 * 4. `version` from package.json (fallback when git is unavailable)
 *
 * @see tsconfig.json for matching path alias declarations
 * @see vitest.config.ts which extends this config via mergeConfig
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { version } from './package.json';

function r(path: string) {
  return fileURLToPath(new URL(path, import.meta.url));
}

function gitDescribe(long: boolean): string {
  try {
    const cmd = long ? 'git describe --tags --long --always' : 'git describe --tags --always';
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return version;
  }
}

/**
 * Extract per-theme/mode `--color-surface` values from themes.css so the
 * pre-paint boot script in index.html can tint the status bar without
 * duplicating the palette. Skips non-`#hex` values (e.g. `var()`, `rgb()`).
 */
function readSurfacePalette(): string {
  const css = readFileSync(r('src/styles/themes.css'), 'utf8');
  const blockRe = /\[data-theme='([^']+)'\](?:\[data-mode='([^']+)'\])?\s*\{([^}]+)\}/g;
  const palette: Record<string, Record<string, string>> = {};
  for (const [, theme, modeRaw, body] of css.matchAll(blockRe)) {
    const surface = body.match(/--color-surface:\s*(#[0-9a-fA-F]+)/)?.[1];
    if (!surface) continue;
    (palette[theme] ??= {})[modeRaw ?? 'light'] = surface;
  }
  return JSON.stringify(palette);
}

let cachedPalette: string | undefined;
const getSurfacePalette = () => (cachedPalette ??= readSurfacePalette());

const isDevServer =
  process.argv.some((a) => /[/\\]vite$/.test(a)) && !process.argv.includes('build');

export default defineConfig({
  plugins: [
    {
      name: 'tipsy:inject-surface-palette',
      configureServer(server) {
        server.watcher.add(r('src/styles/themes.css')).on('change', (file) => {
          if (file.endsWith('themes.css')) {
            cachedPalette = undefined;
            server.ws.send({ type: 'full-reload' });
          }
        });
      },
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => html.replace('__SURFACES__', getSurfacePalette()),
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // use the existing public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: isDevServer && process.env.VITE_PWA_DEV === 'true',
        type: 'module',
      },
    }),
  ],
  base: '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.VITE_APP_VERSION ?? gitDescribe(isDevServer),
    ),
  },
  resolve: {
    alias: {
      '@/components': r('src/components'),
      '@/screens': r('src/screens'),
      '@/layouts': r('src/layouts'),
      '@/config': r('src/config'),
      '@/context': r('src/context'),
      '@/hooks': r('src/hooks'),
      '@/lib': r('src/lib'),
      '@/locales': r('src/locales'),
      '@/styles': r('src/styles'),
      '@/types': r('src/types'),
      '@/utils': r('src/utils'),
      '@/test': r('src/test'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
