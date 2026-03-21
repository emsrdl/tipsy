/**
 * @file vitest.config.ts
 * @description Vitest test runner configuration.
 *
 * Extends vite.config.ts so all path aliases and plugins are available in tests.
 * Configures jsdom environment for React component tests.
 *
 * @see src/test/setup.ts for global test setup (jest-dom, mocks)
 * @see vite.config.ts which this config extends
 */
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['node_modules', 'dist'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.types.ts',
          'src/vite-env.d.ts',
          'src/test/**',
          'src/components/ui/**',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
        },
      },
    },
  })
)
