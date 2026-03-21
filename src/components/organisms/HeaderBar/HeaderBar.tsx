/**
 * @file src/components/organisms/HeaderBar/HeaderBar.tsx
 * @description HeaderBar organism — Material AppBar (56px, elevation, safe area).
 *
 * Touch-first: 48px icon buttons, safe area top padding for notched devices.
 * Uses Material elevation shadow instead of border.
 *
 * @example
 * // Used inside AppLayout
 * <HeaderBar />
 */

import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/atoms/Logo/Logo'
import { Button } from '@/components/atoms/Button/Button'
import { Icon } from '@/components/atoms/Icon/Icon'
import { LanguageToggle } from '@/components/molecules/LanguageToggle/LanguageToggle'
import { ThemeSwitcher } from '../ThemeSwitcher/ThemeSwitcher'
import { useTheme } from '@/hooks/useTheme'

/**
 * Material AppBar: sticky, 56px tall, elevation shadow, safe-area aware.
 *
 * @returns header element
 *
 * @example
 * <HeaderBar />
 */
export function HeaderBar() {
  const { t } = useTranslation('common')
  const { colorMode, toggleColorMode } = useTheme()

  return (
    <header className="sticky top-0 z-40 bg-surface shadow-elevation-2 pt-safe">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        {/* Left: Logo + App Name */}
        <div className="flex items-center gap-2.5">
          <Logo size={28} className="text-accent" />
          <span className="text-title-md text-text-primary">{t('app.name')}</span>
        </div>

        {/* Right: Controls (48px touch targets) */}
        <div className="flex items-center gap-1">
          <LanguageToggle />

          {/* Dark mode toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleColorMode}
            aria-label={colorMode === 'light' ? t('theme.dark') : t('theme.light')}
            className="h-12 w-12"
          >
            <Icon name={colorMode === 'light' ? 'moon' : 'sun'} size={18} />
          </Button>

          {/* Theme switcher */}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
