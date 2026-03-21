/**
 * @file src/components/organisms/HeaderBar/HeaderBar.tsx
 * @description HeaderBar organism — top navigation bar.
 *
 * Contains: Logo, app name, LanguageToggle, dark mode toggle, ThemeSwitcher trigger.
 * Sticks to the top of the viewport.
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
 * Top navigation bar with logo, controls, and theme switcher.
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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        {/* Left: Logo + App Name */}
        <div className="flex items-center gap-2">
          <Logo size={28} className="text-accent" />
          <span className="font-semibold text-text-primary">{t('app.name')}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <LanguageToggle />

          {/* Dark mode toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleColorMode}
            aria-label={colorMode === 'light' ? t('theme.dark') : t('theme.light')}
          >
            <Icon name={colorMode === 'light' ? 'moon' : 'sun'} size={16} />
          </Button>

          {/* Theme switcher */}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
