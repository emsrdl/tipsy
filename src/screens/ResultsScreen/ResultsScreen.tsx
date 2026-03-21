/**
 * @file src/screens/ResultsScreen/ResultsScreen.tsx
 * @description Results screen — distribution display with smart split, exports, save shift.
 *
 * Step 3 of 3. Shows distribution, fairness score, transfers if smart split used.
 *
 * @example
 * // Rendered via React Router at route "/calculate/results"
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer'
import { DistributionTable } from '@/components/organisms/DistributionTable/DistributionTable'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Icon } from '@/components/atoms/Icon/Icon'
import { Badge } from '@/components/atoms/Badge/Badge'
import { useTipCalculator } from '@/hooks/useTipCalculator'
import { useExport } from '@/hooks/useExport'
import { useShifts } from '@/hooks/useShifts'
import { useProfiles } from '@/hooks/useProfiles'
import { useSmartSplitter } from '@/hooks/useSmartSplitter'
import { useToast } from '@/context/ToastContext'
import { useLocale } from '@/hooks/useLocale'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { formatEurFromCents } from '@/config/currency'
import { SMART_SPLIT_THRESHOLD_KEY, DEFAULT_FAIRNESS_THRESHOLD } from '@/config/smartSplit'
import { cn } from '@/lib/utils'
import type { Shift, DifferenceLine } from '@/types/shift'

function generateShiftId(): string {
  return `shift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Results screen — step 3 of 3.
 */
export function ResultsScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors'])
  const navigate = useNavigate()
  const { session, totalInCents, reset } = useTipCalculator()
  const { exportPdf, exportCsv, isExporting } = useExport()
  const { addShift } = useShifts()
  const { activeProfile, isGuestMode } = useProfiles()
  const { showToast } = useToast()
  const { locale } = useLocale()
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE'

  const [isSmartMode] = useLocalStorage('tipsy_smart_mode', true)
  const [threshold] = useLocalStorage<number>(SMART_SPLIT_THRESHOLD_KEY, DEFAULT_FAIRNESS_THRESHOLD)

  const smartOutput = useSmartSplitter(
    session.employees,
    totalInCents,
    session.split.kitchenPercent,
    session.denominations
  )

  const results = session.results ?? []
  const hasResults = results.length > 0

  function handleSaveAndFinish() {
    if (!hasResults) return

    const distribution = smartOutput.output?.distribution ?? {
      personShares: results.map((r) => ({
        id: r.employeeId,
        name: r.name,
        role: r.group,
        hoursWorked: r.hours,
        idealShareInCents: r.amountInCents,
        actualShareInCents: r.amountInCents,
        deviationInCents: 0,
      })),
      remainingCents: 0,
      fairnessScore: 100,
      denominationsUsed: [],
    }

    const shift: Shift = {
      id: generateShiftId(),
      profileId: activeProfile?.id ?? null,
      date: new Date().toISOString(),
      kitchenPercent: session.split.kitchenPercent,
      employees: session.employees,
      totalTipsInCents: totalInCents,
      denominationInput: session.denominations.filter((d) => d.quantity > 0),
      distribution,
      smartSplitting: isSmartMode,
      differences: smartOutput.output?.differences ?? [],
      savedAt: new Date().toISOString(),
    }

    addShift(shift)
    showToast('Schicht gespeichert', 'success')
    reset()
    void navigate('/history')
  }

  function handleReset() {
    reset()
    void navigate('/calculate')
  }

  const fairnessScore = smartOutput.output?.distribution.fairnessScore
  const transfers: DifferenceLine[] = smartOutput.output?.differences ?? []

  return (
    <ScreenContainer
      title={t('screens:results.title')}
      subtitle={t('screens:results.subtitle')}
      step={3}
      totalSteps={3}
    >
      {results.length === 0 ? (
        <Alert status="info" message={t('errors:validation.noEmployees')} />
      ) : (
        <div className="space-y-4">
          {/* Distribution table */}
          <DistributionTable results={results} totalInCents={totalInCents} />

          {/* Fairness score (smart mode) */}
          {isSmartMode && fairnessScore !== undefined && (
            <div className={cn(
              'rounded-xl px-4 py-3 flex items-center justify-between shadow-elevation-1',
              fairnessScore >= 95 ? 'bg-status-success/10' : 'bg-status-warning/10'
            )}>
              <div className="flex items-center gap-2">
                <Icon
                  name="star"
                  size={16}
                  className={fairnessScore >= 95 ? 'text-status-success' : 'text-status-warning'}
                />
                <span className="text-sm font-medium text-text-primary">
                  {t('common:smartSplit.fairnessScore')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-surface-overlay overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      fairnessScore >= 95 ? 'bg-status-success' : 'bg-status-warning'
                    )}
                    style={{ width: `${fairnessScore}%` }}
                  />
                </div>
                <span className="text-sm font-bold font-mono text-text-primary">
                  {fairnessScore}%
                </span>
              </div>
            </div>
          )}

          {/* Transfers (smart mode) */}
          {isSmartMode && transfers.length > 0 && (
            <div className="rounded-xl bg-status-warning/10 shadow-elevation-1 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-status-warning/20">
                <Icon name="arrow-right" size={14} className="text-status-warning" />
                <span className="text-sm font-semibold text-text-primary">
                  {t('common:smartSplit.transfers')}
                </span>
                <Badge variant="default" className="ml-auto text-xs bg-status-warning/20 text-status-warning border-0">
                  über {formatEurFromCents(threshold, fmtLocale)} Schwellwert
                </Badge>
              </div>
              <div className="divide-y divide-status-warning/10">
                {transfers.map((diff, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-text-primary">
                      <span className="font-medium">{diff.fromPerson.name}</span>
                      {' → '}
                      <span className="font-medium">{diff.toPerson.name}</span>
                    </span>
                    <span className="font-mono text-sm font-bold text-status-warning">
                      {formatEurFromCents(diff.amountInCents, fmtLocale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSmartMode && transfers.length === 0 && fairnessScore !== undefined && fairnessScore >= 95 && (
            <p className="text-xs text-text-secondary text-center py-1">
              {t('common:smartSplit.noTransfers')}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 space-y-3">
        {hasResults && (
          <>
            {/* Save & finish */}
            <Button
              type="button"
              onClick={handleSaveAndFinish}
              className="w-full min-h-14 text-base font-semibold"
            >
              <Icon name="save" size={18} />
              {isGuestMode
                ? 'Beenden (nicht gespeichert)'
                : 'Beenden & Speichern'}
            </Button>

            {/* Export row */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 min-h-12"
                isLoading={isExporting}
                onClick={() => { exportPdf(results); showToast('PDF heruntergeladen', 'success') }}
              >
                <Icon name="file-text" size={16} />
                {t('common:actions.exportPdf')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 min-h-12"
                isLoading={isExporting}
                onClick={() => { exportCsv(results); showToast('CSV heruntergeladen', 'success') }}
              >
                <Icon name="download" size={16} />
                {t('common:actions.exportCsv')}
              </Button>
            </div>
          </>
        )}

        {/* Nav row */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void navigate('/calculate/cash')}
            className="flex-1 min-h-12"
          >
            <Icon name="chevron-left" size={16} />
            {t('common:actions.back')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="flex-1 min-h-12"
          >
            <Icon name="refresh-cw" size={16} />
            {t('common:actions.reset')}
          </Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
