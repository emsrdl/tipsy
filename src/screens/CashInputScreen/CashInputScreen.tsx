/**
 * @file src/screens/CashInputScreen/CashInputScreen.tsx
 * @description Cash input screen — enter denomination quantities.
 *
 * Step 2 of 3 in the tip distribution flow.
 *
 * @example
 * // Rendered via React Router in App.tsx at route "/cash"
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer'
import { DenominationGrid } from '@/components/organisms/DenominationGrid/DenominationGrid'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Icon } from '@/components/atoms/Icon/Icon'
import { useTipCalculator } from '@/hooks/useTipCalculator'

/**
 * Cash input screen with denomination grid and navigation.
 *
 * @returns ScreenContainer with DenominationGrid and navigation
 *
 * @example
 * // Via router: <Route path="/cash" element={<CashInputScreen />} />
 */
export function CashInputScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors'])
  const navigate = useNavigate()
  const { totalInCents, calculate } = useTipCalculator()

  const hasTotal = totalInCents > 0

  function handleCalculate() {
    calculate()
    void navigate('/results')
  }

  return (
    <ScreenContainer
      title={t('screens:cashInput.title')}
      subtitle={t('screens:cashInput.subtitle')}
      step={2}
      totalSteps={3}
    >
      <DenominationGrid />

      {!hasTotal && (
        <Alert
          status="warning"
          message={t('errors:validation.zeroTotal')}
          className="mt-4"
        />
      )}

      {/* Navigation */}
      <div className="mt-8 space-y-3">
        <Button
          type="button"
          disabled={!hasTotal}
          onClick={handleCalculate}
          className="w-full min-h-14 text-base font-semibold"
        >
          {t('common:actions.calculate')}
          <Icon name="chevron-right" size={18} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void navigate('/')}
          className="w-full min-h-12"
        >
          <Icon name="chevron-left" size={16} />
          {t('common:actions.back')}
        </Button>
      </div>
    </ScreenContainer>
  )
}
