/**
 * @file src/lib/i18n.ts
 * @description i18next initialization for Tipsy.
 *
 * Configures i18next with:
 * - react-i18next integration
 * - Browser language detection (with localStorage persistence)
 * - Three namespaces: common, screens, errors
 * - German default, English fallback
 * - Lazy-loaded locale resources
 *
 * Import this module once in src/main.tsx before rendering.
 *
 * @see src/locales/ for translation JSON files
 * @see src/types/i18n.ts for LocaleId and I18nNamespace types
 *
 * @example
 * // In main.tsx:
 * import '@/lib/i18n'
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Locale imports
import deCommon from '@/locales/de/common.json';
import deScreens from '@/locales/de/screens.json';
import deErrors from '@/locales/de/errors.json';
import enCommon from '@/locales/en/common.json';
import enScreens from '@/locales/en/screens.json';
import enErrors from '@/locales/en/errors.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: {
        common: deCommon,
        screens: deScreens,
        errors: deErrors,
      },
      en: {
        common: enCommon,
        screens: enScreens,
        errors: enErrors,
      },
    },
    defaultNS: 'common',
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tipsy-lang',
    },
  });

export default i18n;
