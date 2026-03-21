/**
 * @file src/layouts/ScreenContainer/ScreenContainer.tsx
 * @description ScreenContainer layout — wraps screen content with consistent padding/width.
 *
 * @example
 * <ScreenContainer title="Mitarbeiter einrichten" subtitle="...">
 *   <EmployeeForm />
 * </ScreenContainer>
 */

import type { ReactNode } from 'react'

export interface ScreenContainerProps {
  /** Main heading for this screen. */
  title: string
  /** Optional subheading. */
  subtitle?: string
  children: ReactNode
}

/**
 * Consistent screen wrapper with title, subtitle, and centered content.
 *
 * @param props - ScreenContainerProps
 * @returns main element
 *
 * @example
 * <ScreenContainer title="Bargeld eingeben">
 *   <DenominationGrid />
 * </ScreenContainer>
 */
export function ScreenContainer({ title, subtitle, children }: ScreenContainerProps) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {children}
    </main>
  )
}
