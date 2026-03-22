/**
 * @file vite.config.ts
 * @description Vite build configuration.
 *
 * Configures:
 * - React plugin with Fast Refresh
 * - Path aliases matching tsconfig.json (must be kept in sync)
 * - Dev server settings
 *
 * @see tsconfig.json for matching path alias declarations
 * @see vitest.config.ts which extends this config via mergeConfig
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

function r(path: string) {
  return fileURLToPath(new URL(path, import.meta.url));
}

export default defineConfig({
  plugins: [react()],
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
