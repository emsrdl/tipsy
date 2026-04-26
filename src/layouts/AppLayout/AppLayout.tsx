/**
 * @file src/layouts/AppLayout/AppLayout.tsx
 * @description AppLayout — 3-tab Material bottom navigation.
 *
 * Tabs:
 *   1. "Berechnen" (/calculate) — calculation stepper flow
 *   2. "Verlauf"   (/history)   — history + graphs
 *   3. "Einstellungen" (/settings) — profile & preferences
 *
 * Touch-first:
 * - 56px bottom nav with 48px touch targets per tab
 * - Active tab: full element highlight (bg-accent-subtle, rounded-xl)
 * - Safe area bottom padding (notch-aware via pb-safe)
 * - Backdrop blur for Material "tonal surface" effect
 *
 * @example
 * <AppLayout><Outlet /></AppLayout>
 */

import { type ReactNode, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { saveScrollPosition } from '@/hooks/usePreserveScroll';
import { useTranslation } from 'react-i18next';
import { HeaderBar } from '@/components/organisms/HeaderBar/HeaderBar';
import { Icon } from '@/components/atoms/Icon/Icon';
import { cn } from '@/lib/utils';

export interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Root layout with Material AppBar and 3-tab bottom navigation.
 *
 * @param props - AppLayoutProps
 * @returns full-height layout with header, scrollable content, and bottom nav
 *
 * @example
 * <AppLayout><Outlet /></AppLayout>
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation('common');
  const location = useLocation();

  // Updated during render — safe because AppLayout re-renders on every location change.
  const lastCalculateRoute = useRef('/calculate');
  if (location.pathname.startsWith('/calculate')) {
    lastCalculateRoute.current = location.pathname;
  }

  const navItems = [
    {
      to: lastCalculateRoute.current,
      label: t('nav.calculate'),
      icon: 'calculator' as const,
      matchPrefix: '/calculate',
    },
    { to: '/history', label: t('nav.history'), icon: 'history' as const, matchPrefix: '/history' },
    {
      to: '/settings',
      label: t('nav.settings'),
      icon: 'settings' as const,
      matchPrefix: '/settings',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <HeaderBar />

      {/* Scrollable content with bottom nav clearance */}
      <div className="flex-1 pb-20">{children}</div>

      {/* Material Bottom Navigation Bar */}
      <nav
        className="bg-surface/95 pb-safe fixed bottom-0 left-0 right-0 z-40 shadow-elevation-4 backdrop-blur-md"
        role="navigation"
        aria-label={t('nav.main')}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2">
          {navItems.map(({ to, label, icon, matchPrefix }) => {
            const isActive = location.pathname.startsWith(matchPrefix);
            return (
              <NavLink
                key={matchPrefix}
                to={to}
                onClick={() => saveScrollPosition(location.pathname)}
                className={cn(
                  'flex w-24 flex-col items-center gap-1 py-3 transition-colors',
                  isActive ? 'text-accent' : 'text-text-secondary',
                )}
              >
                {/* MD3 active indicator pill — ripple stays within the pill */}
                <div
                  className={cn(
                    'ripple flex h-8 items-center justify-center rounded-full transition-all',
                    isActive ? 'w-16 bg-accent-subtle' : 'w-16',
                  )}
                >
                  <Icon name={icon} size={20} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
