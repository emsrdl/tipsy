/**
 * @file src/screens/SetupScreen/SetupScreen.tsx
 * @description Setup screen — add employees and configure the tip split.
 *
 * Step 1 of 3 in the tip distribution flow.
 *
 * @example
 * // Rendered via React Router in App.tsx at route "/"
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer'
import { EmployeeForm } from '@/components/organisms/EmployeeForm/EmployeeForm'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Icon } from '@/components/atoms/Icon/Icon'
import { useTipCalculator } from '@/hooks/useTipCalculator'

/**
 * Setup screen — add employees and configure kitchen/service split.
 *
 * @returns ScreenContainer with EmployeeForm and navigation actions
 *
 * @example
 * // Via router: <Route path="/" element={<SetupScreen />} />
 */
export function SetupScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors'])
  const navigate = useNavigate()
  const { session } = useTipCalculator()

  const hasEmployees = session.employees.length > 0
  const splitValid = session.split.kitchenPercent + session.split.servicePercent === 100
  const canContinue = hasEmployees && splitValid

  return (
    <ScreenContainer
      title={t('screens:setup.title')}
      subtitle={t('screens:setup.subtitle')}
      step={1}
      totalSteps={3}
    >
      <EmployeeForm />

      {!hasEmployees && session.employees.length === 0 && false /* only show after first attempt */ && (
        <Alert status="error" message={t('errors:validation.noEmployees')} className="mt-4" />
      )}

      {/* Navigation */}
      <div className="mt-8">
        <Button
          type="button"
          disabled={!canContinue}
          onClick={() => void navigate('/cash')}
          className="w-full min-h-14 text-base font-semibold"
        >
          {t('common:actions.next')}
          <Icon name="chevron-right" size={18} />
        </Button>
      </div>
    </ScreenContainer>
  )
}
