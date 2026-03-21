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
 * - Active tab: pill indicator (Material Navigation Bar style)
 * - Safe area bottom padding (notch-aware via pb-safe)
 * - Backdrop blur for Material "tonal surface" effect
 *
 * @example
 * <AppLayout><Outlet /></AppLayout>
 */

import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HeaderBar } from '@/components/organisms/HeaderBar/HeaderBar'
import { Icon } from '@/components/atoms/Icon/Icon'
import { cn } from '@/lib/utils'

export interface AppLayoutProps {
  children: ReactNode
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
  const { t } = useTranslation('common')
  const location = useLocation()

  const navItems = [
    { to: '/calculate', label: t('nav.calculate'), icon: 'calculator' as const, matchPrefix: '/calculate' },
    { to: '/history',   label: t('nav.history'),   icon: 'history'    as const, matchPrefix: '/history' },
    { to: '/settings',  label: t('nav.settings'),  icon: 'settings'   as const, matchPrefix: '/settings' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <HeaderBar />

      {/* Scrollable content with bottom nav clearance */}
      <div className="flex-1 pb-20">{children}</div>

      {/* Material Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md shadow-elevation-4 pb-safe"
        role="navigation"
        aria-label={t('nav.main')}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2">
          {navItems.map(({ to, label, icon, matchPrefix }) => {
            const isActive = location.pathname.startsWith(matchPrefix)
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'ripple flex flex-col items-center gap-1 min-w-[4rem] py-2 px-3 rounded-xl transition-all',
                  isActive ? 'text-accent' : 'text-text-secondary'
                )}
              >
                {/* Pill indicator for active tab */}
                <div className={cn(
                  'flex items-center justify-center h-8 rounded-full transition-all px-4',
                  isActive ? 'bg-accent-subtle min-w-[4rem]' : 'w-8'
                )}>
                  <Icon name={icon} size={20} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
