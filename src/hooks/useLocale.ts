/**
 * @file src/hooks/useLocale.ts
 * @description Hook for reading and switching the active locale.
 *
 * @see src/lib/i18n.ts for i18n initialization
 *
 * @example
 * const { locale, setLocale } = useLocale()
 * setLocale('en')
 */

import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import type { LocaleId } from '@/types/i18n'

export interface UseLocaleReturn {
  /** Current active locale. */
  locale: LocaleId
  /** Switch to a different locale. */
  setLocale: (locale: LocaleId) => void
}

/**
 * Returns the current locale and a setter.
 *
 * @example
 * const { locale, setLocale } = useLocale()
 * // locale === 'de'
 * setLocale('en')
 */
export function useLocale(): UseLocaleReturn {
  const { i18n } = useTranslation()

  const setLocale = useCallback(
    (locale: LocaleId) => {
      void i18n.changeLanguage(locale)
      localStorage.setItem('tipsy-lang', locale)
    },
    [i18n]
  )

  const locale = (i18n.language?.slice(0, 2) ?? 'de') as LocaleId

  return { locale, setLocale }
}
