/**
 * @file src/layouts/AppLayout/AppLayout.tsx
 * @description AppLayout — Material bottom navigation with safe area support.
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
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HeaderBar } from '@/components/organisms/HeaderBar/HeaderBar'
import { Icon } from '@/components/atoms/Icon/Icon'
import { cn } from '@/lib/utils'

export interface AppLayoutProps {
  children: ReactNode
}

/**
 * Root layout with Material AppBar and bottom navigation bar.
 * Bottom nav uses pill-style active indicators (Material Nav Bar).
 *
 * @param props - AppLayoutProps
 * @returns full-height layout with header, scrollable content, and bottom nav
 *
 * @example
 * <AppLayout><Outlet /></AppLayout>
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation('common')

  const navItems = [
    { to: '/',        label: t('nav.setup'),     icon: 'users' as const },
    { to: '/cash',    label: t('nav.cashInput'), icon: 'banknote' as const },
    { to: '/results', label: t('nav.results'),   icon: 'file-text' as const },
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
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'ripple flex flex-col items-center gap-1 min-w-[4rem] py-2 px-3 rounded-xl transition-all',
                  isActive
                    ? 'text-accent'
                    : 'text-text-secondary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Pill indicator for active tab */}
                  <div className={cn(
                    'flex items-center justify-center h-8 rounded-full transition-all px-4',
                    isActive ? 'bg-accent-subtle min-w-[4rem]' : 'w-8'
                  )}>
                    <Icon name={icon} size={20} />
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
