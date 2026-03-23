/**
 * @file src/layouts/ScreenContainer/ScreenContainer.tsx
 * @description ScreenContainer — Material page layout with step indicator.
 *
 * Adds:
 * - Optional step indicator (1/3 → 2/3 → 3/3) as Material pill progress
 * - Clickable step pills when `onStepClick` + `maxReachableStep` are provided
 * - Material headline typography for title
 * - Consistent 16px horizontal, 24px vertical padding
 * - Bottom padding accounts for bottom nav + safe area
 *
 * @example
 * <ScreenContainer title="Mitarbeiter" step={1} totalSteps={3}
 *   maxReachableStep={2} onStepClick={(s) => navigate(stepRoutes[s])}>
 *   <EmployeeForm />
 * </ScreenContainer>
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface ScreenContainerProps {
  title: string;
  subtitle?: string;
  /** Current step number (1-based) for progress indicator. */
  step?: number;
  /** Total number of steps. */
  totalSteps?: number;
  /**
   * Highest step number the user may navigate to (inclusive).
   * Steps 1..maxReachableStep render as clickable buttons.
   */
  maxReachableStep?: number;
  /** Called with the 1-based step number when a clickable step pill is tapped. */
  onStepClick?: (step: number) => void;
  children: ReactNode;
}

/**
 * Consistent screen wrapper with Material typography and step progress.
 *
 * When `onStepClick` and `maxReachableStep` are supplied, step pills up to
 * `maxReachableStep` become interactive buttons with enlarged touch targets.
 *
 * @param props - ScreenContainerProps
 * @returns main element with title, optional step indicator, and content
 *
 * @example
 * <ScreenContainer title="Bargeld" step={2} totalSteps={3}
 *   maxReachableStep={3} onStepClick={handleStepClick}>
 *   <DenominationGrid />
 * </ScreenContainer>
 */
export function ScreenContainer({
  title,
  subtitle,
  step,
  totalSteps,
  maxReachableStep,
  onStepClick,
  children,
}: ScreenContainerProps) {
  const { t } = useTranslation('common');
  const showSteps = step !== undefined && totalSteps !== undefined;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-8">
      {/* Step indicator */}
      {showSteps && (
        <nav
          className="mb-5 flex items-center gap-2"
          aria-label={t('navigation.steps')}
        >
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum <= step;
            const isClickable =
              onStepClick !== undefined &&
              maxReachableStep !== undefined &&
              stepNum <= maxReachableStep &&
              stepNum !== step;

            const pill = (
              <div
                className={cn(
                  'h-2 w-full rounded-full transition-all duration-300',
                  isActive ? 'bg-accent' : 'bg-surface-overlay',
                )}
              />
            );

            if (isClickable) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onStepClick(stepNum)}
                  className="flex flex-1 items-center py-3 -my-3 cursor-pointer"
                  aria-label={t('navigation.goToStep', { step: stepNum, total: totalSteps })}
                >
                  {pill}
                </button>
              );
            }

            return (
              <div key={i} className="flex-1">
                {pill}
              </div>
            );
          })}
        </nav>
      )}

      {/* Title area */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold leading-tight text-text-primary">{title}</h1>
          {showSteps && (
            <span className="ml-4 flex-shrink-0 text-sm text-text-secondary">
              {step}/{totalSteps}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{subtitle}</p>
        )}
      </div>

      {children}
    </main>
  );
}
