/**
 * @file src/components/organisms/DistributionTable/DistributionTable.tsx
 * @description DistributionTable organism — shows calculated tip amounts per employee.
 *
 * Renders results grouped by kitchen/service, showing each employee's
 * name, hours, and calculated amount.
 *
 * @example
 * <DistributionTable results={session.results} totalInCents={totalInCents} />
 */

import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/atoms/Badge/Badge'
import { SummaryLine } from '@/components/molecules/SummaryLine/SummaryLine'
import { formatEurFromCents } from '@/config/currency'
import { useLocale } from '@/hooks/useLocale'
import type { DistributionResult } from '@/types/session'

export interface DistributionTableProps {
  /** Calculated distribution results. */
  results: DistributionResult[]
  /** Total cash in cents (for the summary footer). */
  totalInCents: number
}

/**
 * Results table grouped by kitchen/service.
 *
 * @param props - DistributionTableProps
 * @returns div with grouped employee rows and total summary
 *
 * @example
 * <DistributionTable results={results} totalInCents={10000} />
 */
export function DistributionTable({ results, totalInCents }: DistributionTableProps) {
  const { t } = useTranslation(['common', 'screens'])
  const { locale } = useLocale()
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE'

  const kitchenResults = results.filter((r) => r.group === 'kitchen')
  const serviceResults = results.filter((r) => r.group === 'service')

  const kitchenTotal = kitchenResults.reduce((s, r) => s + r.amountInCents, 0)
  const serviceTotal = serviceResults.reduce((s, r) => s + r.amountInCents, 0)

  function renderGroup(groupResults: DistributionResult[], groupLabel: string, badgeVariant: 'kitchen' | 'service') {
    if (groupResults.length === 0) return null
    const groupTotal = groupResults.reduce((s, r) => s + r.amountInCents, 0)
    const groupHours = groupResults.reduce((s, r) => s + r.hours, 0)

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-1 mb-2">
          <Badge variant={badgeVariant}>{groupLabel}</Badge>
          <span className="text-xs text-text-secondary">{formatEurFromCents(groupTotal, fmtLocale)}</span>
        </div>
        {groupResults.map((r) => (
          <div key={r.employeeId} className="flex items-center justify-between rounded-md px-3 py-2 even:bg-surface-raised">
            <div>
              <span className="font-medium text-text-primary">{r.name}</span>
              <span className="ml-2 text-xs text-text-secondary">
                {r.hours} {t('common:currency.perHour')}
              </span>
            </div>
            <span className="font-mono font-medium">
              {formatEurFromCents(r.amountInCents, fmtLocale)}
            </span>
          </div>
        ))}
        <div className="px-3 py-1 text-right text-xs text-text-secondary">
          {t('screens:results.perHourLabel')}: {groupHours > 0 ? formatEurFromCents(Math.round(groupTotal / groupHours), fmtLocale) : '—'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderGroup(kitchenResults, t('screens:results.groupKitchen'), 'kitchen')}
      {renderGroup(serviceResults, t('screens:results.groupService'), 'service')}

      {/* Total summary */}
      <div className="rounded-md border border-border bg-surface-raised p-3 space-y-1">
        {kitchenResults.length > 0 && (
          <SummaryLine label={t('screens:results.kitchenPoolLabel')} amountInCents={kitchenTotal} muted />
        )}
        {serviceResults.length > 0 && (
          <SummaryLine label={t('screens:results.servicePoolLabel')} amountInCents={serviceTotal} muted />
        )}
        <div className="border-t border-border pt-1 mt-1">
          <SummaryLine label={t('screens:results.totalLabel')} amountInCents={totalInCents} prominent />
        </div>
      </div>
    </div>
  )
}
