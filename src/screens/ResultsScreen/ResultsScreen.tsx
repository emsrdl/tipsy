/**
 * @file src/screens/ResultsScreen/ResultsScreen.tsx
 * @description Results screen — shows distribution amounts and export actions.
 *
 * Step 3 of 3 in the tip distribution flow.
 *
 * @example
 * // Rendered via React Router in App.tsx at route "/results"
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer'
import { DistributionTable } from '@/components/organisms/DistributionTable/DistributionTable'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Icon } from '@/components/atoms/Icon/Icon'
import { useTipCalculator } from '@/hooks/useTipCalculator'
import { useExport } from '@/hooks/useExport'

/**
 * Results screen with distribution table and PDF/CSV export.
 *
 * @returns ScreenContainer with results and actions
 *
 * @example
 * // Via router: <Route path="/results" element={<ResultsScreen />} />
 */
export function ResultsScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors'])
  const navigate = useNavigate()
  const { session, totalInCents, reset } = useTipCalculator()
  const { exportPdf, exportCsv, isExporting, exportError } = useExport()

  const results = session.results ?? []

  function handleReset() {
    reset()
    void navigate('/')
  }

  return (
    <ScreenContainer
      title={t('screens:results.title')}
      subtitle={t('screens:results.subtitle')}
    >
      {results.length === 0 ? (
        <Alert status="info" message={t('errors:validation.noEmployees')} />
      ) : (
        <DistributionTable results={results} totalInCents={totalInCents} />
      )}

      {exportError && (
        <Alert status="error" message={t(`errors:${exportError}`)} className="mt-4" />
      )}

      {/* Export + navigation */}
      <div className="mt-6 space-y-3">
        {results.length > 0 && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              isLoading={isExporting}
              onClick={() => exportPdf(results)}
            >
              <Icon name="file-text" size={16} />
              {t('common:actions.exportPdf')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              isLoading={isExporting}
              onClick={() => exportCsv(results)}
            >
              <Icon name="download" size={16} />
              {t('common:actions.exportCsv')}
            </Button>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate('/cash')}
          >
            <Icon name="chevron-left" size={16} />
            {t('common:actions.back')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
          >
            <Icon name="refresh-cw" size={16} />
            {t('common:actions.reset')}
          </Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
