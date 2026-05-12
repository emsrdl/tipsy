/**
 * @file src/components/organisms/HeaderBar/HeaderBar.tsx
 * @description Material AppBar — 56px, safe-area aware, 48px touch targets.
 *
 * Separator is a 1px border rather than an elevation shadow: drop-shadow blur
 * bleeds ~3px above the element, producing a visible band against the iOS-drawn
 * status-bar tint that overlays `pt-safe` in PWA `black-translucent` mode.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/atoms/Logo/Logo';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { ProfileAvatar } from '@/components/molecules/ProfileAvatar/ProfileAvatar';
import { useTheme } from '@/hooks/useTheme';

/** Material AppBar: 56px tall, safe-area aware. Logo navigates to `/`. */
export function HeaderBar() {
  const { t } = useTranslation('common');
  const { colorMode, toggleColorMode } = useTheme();

  return (
    <header className="pt-safe z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        {/* Left: Logo + App Name as single home link */}
        <Link
          to="/"
          aria-label={t('app.name')}
          className="flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-surface-overlay"
        >
          <Logo size={28} className="text-accent" />
          <span className="text-title-md text-text-primary">{t('app.name')}</span>
        </Link>

        {/* Right: Controls (48px touch targets, MD3 gap) */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleColorMode}
            aria-label={colorMode === 'light' ? t('theme.dark') : t('theme.light')}
            className="h-12 w-12"
          >
            <Icon name={colorMode === 'light' ? 'moon' : 'sun'} size={24} />
          </Button>

          {/* Profile avatar with dropdown */}
          <ProfileAvatar />
        </div>
      </div>
    </header>
  );
}
