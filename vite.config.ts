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
 * 2. `git describe --tags --always` (local dev)
 * 3. `version` from package.json (fallback when git is unavailable)
 *
 * @see tsconfig.json for matching path alias declarations
 * @see vitest.config.ts which extends this config via mergeConfig
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { execSync } from 'node:child_process';
import { version } from './package.json';

function gitDescribe(): string {
  try {
    return execSync('git describe --tags --always', { encoding: 'utf8' }).trim();
  } catch {
    return version;
  }
}

function r(path: string) {
  return fileURLToPath(new URL(path, import.meta.url));
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION ?? gitDescribe()),
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
