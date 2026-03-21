/**
 * @file src/layouts/AppLayout/AppLayout.tsx
 * @description AppLayout — root layout with HeaderBar and bottom navigation.
 *
 * @example
 * // Used in App.tsx
 * <AppLayout>
 *   <Outlet />
 * </AppLayout>
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
 * Root app layout with sticky header and bottom tab navigation.
 *
 * @param props - AppLayoutProps
 * @returns div with header, content area, and bottom nav
 *
 * @example
 * <AppLayout><Outlet /></AppLayout>
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation('common')

  const navItems = [
    { to: '/',      label: t('nav.setup'),     icon: 'plus' as const },
    { to: '/cash',  label: t('nav.cashInput'), icon: 'banknote' as const },
    { to: '/results', label: t('nav.results'), icon: 'file-text' as const },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <HeaderBar />

      <div className="flex-1">{children}</div>

      {/* Bottom tab navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-2">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors',
                  isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                )
              }
            >
              <Icon name={icon} size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
