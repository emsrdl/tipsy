/**
 * @file src/types/i18n.ts
 * @description Types for the internationalization system.
 *
 * @see src/locales/ for translation files
 */

/** Supported locale identifiers. */
export type LocaleId = 'de' | 'en'

/** Available i18next namespaces. */
export type I18nNamespace = 'common' | 'screens' | 'errors'
