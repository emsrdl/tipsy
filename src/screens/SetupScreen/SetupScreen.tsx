/**
 * @file src/screens/SetupScreen/SetupScreen.tsx
 * @description Setup screen — add employees, configure split, select profile.
 *
 * Step 1 of 3 in the calculation flow.
 * Includes: profile selector, employee list, split slider, smart split toggle.
 *
 * @example
 * // Rendered via React Router at route "/calculate"
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer'
import { EmployeeForm } from '@/components/organisms/EmployeeForm/EmployeeForm'
import { ProfileSelector } from '@/components/organisms/ProfileSelector/ProfileSelector'
import { Button } from '@/components/atoms/Button/Button'
import { Icon } from '@/components/atoms/Icon/Icon'
import { useTipCalculator } from '@/hooks/useTipCalculator'
import { useToast } from '@/context/ToastContext'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { SMART_SPLIT_ENABLED, SMART_SPLIT_THRESHOLD_KEY, DEFAULT_FAIRNESS_THRESHOLD } from '@/config/smartSplit'
import { formatEurFromCents } from '@/config/currency'
import { cn } from '@/lib/utils'

/**
 * Setup screen — step 1 of 3.
 */
export function SetupScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors'])
  const navigate = useNavigate()
  const { session } = useTipCalculator()
  const { showToast } = useToast()
  const [showSmartHelp, setShowSmartHelp] = useState(false)

  const [isSmartMode, setIsSmartMode] = useLocalStorage('tipsy_smart_mode', SMART_SPLIT_ENABLED)
  const [threshold, setThreshold] = useLocalStorage<number>(
    SMART_SPLIT_THRESHOLD_KEY,
    DEFAULT_FAIRNESS_THRESHOLD
  )

  const hasEmployees = session.employees.length > 0
  const splitValid = session.split.kitchenPercent + session.split.servicePercent === 100
  const canContinue = hasEmployees && splitValid

  function handleNext() {
    if (!canContinue) {
      if (!hasEmployees) showToast(t('errors:validation.noEmployees'), 'error')
      return
    }
    void navigate('/calculate/cash')
  }

  return (
    <ScreenContainer
      title={t('screens:setup.title')}
      subtitle={t('screens:setup.subtitle')}
      step={1}
      totalSteps={3}
    >
      {/* Profile selector */}
      <div className="mb-4">
        <ProfileSelector />
      </div>

      {/* Employee form */}
      <EmployeeForm />

      {/* Smart Split toggle */}
      <div className="mt-4 rounded-xl bg-surface-raised shadow-elevation-1 p-4 space-y-3">
        <button
          type="button"
          onClick={() => { setIsSmartMode(!isSmartMode); setShowSmartHelp(false) }}
          className="w-full flex items-center justify-between gap-3 min-h-12"
          aria-pressed={isSmartMode}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
              isSmartMode ? 'bg-accent/10' : 'bg-surface-overlay'
            )}>
              <Icon name="zap" size={18} className={isSmartMode ? 'text-accent' : 'text-text-secondary'} />
            </div>
            <div className="text-left">
              <p className={cn('text-sm font-semibold', isSmartMode ? 'text-accent' : 'text-text-primary')}>
                {t('common:smartSplit.modeLabel')} — {isSmartMode ? t('common:smartSplit.smart') : t('common:smartSplit.normal')}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {isSmartMode
                  ? 'Optimiert Münzen & Scheine Nutzung'
                  : 'Proportionale Verteilung'}
              </p>
            </div>
          </div>
          <Icon
            name={isSmartMode ? 'toggle-right' : 'toggle-left'}
            size={32}
            className={isSmartMode ? 'text-accent' : 'text-text-secondary'}
          />
        </button>

        {/* Threshold (shown when smart mode is on) */}
        {isSmartMode && (
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                {t('common:smartSplit.threshold')}: {formatEurFromCents(threshold, 'de-DE')}
              </span>
              <button
                type="button"
                onClick={() => setShowSmartHelp(!showSmartHelp)}
                className="text-xs text-accent underline"
              >
                {showSmartHelp ? 'Schließen' : 'Was ist das?'}
              </button>
            </div>
            {showSmartHelp && (
              <p className="text-xs text-text-secondary bg-surface-overlay rounded-lg p-3">
                Ausgleichszahlungen werden vorgeschlagen, wenn die Abweichung diesen Betrag überschreitet.
              </p>
            )}
            {/* Threshold quick-select */}
            <div className="flex gap-2 flex-wrap">
              {[200, 500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setThreshold(val)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    threshold === val
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-overlay text-text-secondary hover:bg-accent-subtle'
                  )}
                >
                  {formatEurFromCents(val, 'de-DE')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <Button
          type="button"
          disabled={!canContinue}
          onClick={handleNext}
          className="w-full min-h-14 text-base font-semibold"
        >
          {t('common:actions.next')}
          <Icon name="chevron-right" size={18} />
        </Button>
      </div>
    </ScreenContainer>
  )
}
