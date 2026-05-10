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
import { THEMES, THEME_IDS } from './src/config/themes';
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

const camelToKebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/**
 * Generate the per-theme/mode CSS variable blocks from THEMES.
 * Accent vars are emitted as fallbacks (the active accent is overridden at
 * runtime by ThemeContext for themes with `hasAccentPicker`).
 */
function generatePaletteCss(): string {
  const blocks: string[] = [];
  for (const theme of Object.values(THEMES)) {
    const accent = theme.accentColors.find((a) => a.id === theme.defaultAccentId)!;
    for (const isDark of [false, true]) {
      const selector = `[data-theme='${theme.id}']${isDark ? `[data-mode='dark']` : ''}`;
      const tokens: Record<string, string> = {
        ...theme.palette[isDark ? 'dark' : 'light'],
        accent: accent.hex,
        accentHover: accent.hoverHex,
        accentSubtle: isDark ? accent.subtleDarkHex : accent.subtleHex,
        accentForeground: '#ffffff',
      };
      const lines = Object.entries(tokens).map(
        ([key, value]) => `  --color-${camelToKebab(key)}: ${value};`,
      );
      blocks.push(`${selector} {\n${lines.join('\n')}\n}`);
    }
  }
  return blocks.join('\n');
}

/** Surface-only subset for the pre-paint boot script in index.html. */
function generateSurfacePaletteJson(): string {
  const out: Record<string, Record<string, string>> = {};
  for (const t of Object.values(THEMES)) {
    out[t.id] = { light: t.palette.light.surface, dark: t.palette.dark.surface };
  }
  return JSON.stringify(out);
}

/**
 * Per-theme accent map for the pre-paint boot script — lets it apply the
 * user's stored accent before React mounts, eliminating the default-accent
 * flicker on initial load. Mirrors the AccentColor shape so the boot script
 * reads the same field names ThemeContext.injectAccentVars uses.
 */
function generateAccentMapJson(): string {
  const out: Record<string, Record<string, Record<string, string>>> = {};
  for (const t of Object.values(THEMES)) {
    out[t.id] = Object.fromEntries(
      t.accentColors.map((a) => [
        a.id,
        { hex: a.hex, hoverHex: a.hoverHex, subtleHex: a.subtleHex, subtleDarkHex: a.subtleDarkHex },
      ]),
    );
  }
  return JSON.stringify(out);
}

/**
 * Static `theme-color` for the meta tag in index.html — covers the
 * pre-paint window before the boot script runs, plus the no-JS case.
 * Uses the first theme's dark surface as a sensible default.
 */
function generateBootSurface(): string {
  return THEMES[THEME_IDS[0]]!.palette.dark.surface;
}

const isDevServer =
  process.argv.some((a) => /[/\\]vite$/.test(a)) && !process.argv.includes('build');

export default defineConfig({
  plugins: [
    {
      name: 'tipsy:theme-palette',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) =>
          html
            .replace('__SURFACES__', generateSurfacePaletteJson())
            .replace('__ACCENTS__', generateAccentMapJson())
            .replace('__BOOT_SURFACE__', generateBootSurface())
            .replace('/*__PALETTE_CSS__*/', generatePaletteCss()),
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
