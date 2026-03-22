/**
 * @file src/test/setup.ts
 * @description Global Vitest test setup.
 *
 * Runs before every test file. Sets up:
 * - @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
 * - import.meta.env mock with test defaults
 * - window.matchMedia mock (required by theme dark mode detection)
 * - i18next mock (returns key as-is — avoids JSON file loading in unit tests)
 *
 * @see vitest.config.ts where this file is registered as setupFiles
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

/* ----------------------------------------------------------
   import.meta.env mock
   Provides defaults for all VITE_* variables.
   Override per-test with vi.stubEnv() if needed.
---------------------------------------------------------- */
vi.stubEnv('VITE_APP_DOMAIN', 'test.tipsy.local');
vi.stubEnv('VITE_APP_NAME', 'Tipsy Test');
vi.stubEnv('VITE_DEFAULT_THEME', 'tipsy');
vi.stubEnv('VITE_DEFAULT_LANG', 'de');

/* ----------------------------------------------------------
   window.matchMedia mock
   jsdom does not implement matchMedia. ThemeContext uses it
   to detect the OS dark mode preference.
---------------------------------------------------------- */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/* ----------------------------------------------------------
   i18next mock
   Returns the translation key as-is so tests do not depend
   on locale file loading. Components receive the key string,
   which is stable and readable in test assertions.

   Example: t('actions.next') → "actions.next"
---------------------------------------------------------- */
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        language: 'de',
        changeLanguage: vi.fn(),
      },
    }),
    Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
    initReactI18next: { type: '3rdParty', init: vi.fn() },
  };
});
