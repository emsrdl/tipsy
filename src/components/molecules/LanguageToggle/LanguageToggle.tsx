/**
 * @file src/components/molecules/LanguageToggle/LanguageToggle.tsx
 * @description Language toggle molecule — switches between DE and EN.
 *
 * @example
 * <LanguageToggle />
 */

import { useLocale } from '@/hooks/useLocale'
import { Button } from '@/components/atoms/Button/Button'

/**
 * Renders DE/EN toggle buttons. Active locale is visually highlighted.
 *
 * @returns div with two locale buttons
 *
 * @example
 * <LanguageToggle />
 */
export function LanguageToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center rounded-md border border-border" role="group" aria-label="Sprache">
      <Button
        type="button"
        variant={locale === 'de' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-r-none border-r border-border px-3"
        onClick={() => setLocale('de')}
        aria-pressed={locale === 'de'}
      >
        DE
      </Button>
      <Button
        type="button"
        variant={locale === 'en' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-l-none px-3"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </Button>
    </div>
  )
}
