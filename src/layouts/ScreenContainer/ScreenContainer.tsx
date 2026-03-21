/**
 * @file src/layouts/ScreenContainer/ScreenContainer.tsx
 * @description ScreenContainer — Material page layout with step indicator.
 *
 * Adds:
 * - Optional step indicator (1/3 → 2/3 → 3/3) as Material pill progress
 * - Material headline typography for title
 * - Consistent 16px horizontal, 24px vertical padding
 * - Bottom padding accounts for bottom nav + safe area
 *
 * @example
 * <ScreenContainer title="Mitarbeiter" step={1} totalSteps={3}>
 *   <EmployeeForm />
 * </ScreenContainer>
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ScreenContainerProps {
  title: string
  subtitle?: string
  /** Current step number (1-based) for progress indicator. */
  step?: number
  /** Total number of steps. */
  totalSteps?: number
  children: ReactNode
}

/**
 * Consistent screen wrapper with Material typography and step progress.
 *
 * @param props - ScreenContainerProps
 * @returns main element with title, optional step indicator, and content
 *
 * @example
 * <ScreenContainer title="Bargeld" step={2} totalSteps={3}>
 *   <DenominationGrid />
 * </ScreenContainer>
 */
export function ScreenContainer({ title, subtitle, step, totalSteps, children }: ScreenContainerProps) {
  const showSteps = step !== undefined && totalSteps !== undefined

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-8">
      {/* Step indicator */}
      {showSteps && (
        <div className="flex items-center gap-2 mb-5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i < step ? 'bg-accent' : 'bg-surface-overlay'
              )}
            />
          ))}
        </div>
      )}

      {/* Title area */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-text-primary leading-tight">{title}</h1>
          {showSteps && (
            <span className="text-sm text-text-secondary ml-4 flex-shrink-0">
              {step}/{totalSteps}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{subtitle}</p>
        )}
      </div>

      {children}
    </main>
  )
}
