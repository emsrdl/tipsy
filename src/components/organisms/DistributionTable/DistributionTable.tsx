/**
 * @file src/components/organisms/DistributionTable/DistributionTable.tsx
 * @description DistributionTable organism — Material card results per employee.
 *
 * Touch-first redesign:
 * - Each employee as a Material card with prominent amount display
 * - Group header chips with pool total
 * - Per-hour rate displayed on each card
 * - Summary footer card with kitchen/service/total breakdown
 *
 * @example
 * <DistributionTable results={session.results} totalInCents={totalInCents} />
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Icon } from '@/components/atoms/Icon/Icon'
import { formatEurFromCents } from '@/config/currency'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'
import type { DistributionResult } from '@/types/session'
import type { PersonShare } from '@/types/shift'

export interface DistributionTableProps {
  results: DistributionResult[]
  totalInCents: number
  /** Optional smart-split person shares — enables expandable cards with ideal/actual/deviation. */
  personShares?: PersonShare[]
}

/**
 * Material card-based results display grouped by kitchen/service.
 *
 * @param props - DistributionTableProps
 * @returns div with employee cards and summary footer
 *
 * @example
 * <DistributionTable results={results} totalInCents={10000} />
 */
export function DistributionTable({ results, totalInCents, personShares }: DistributionTableProps) {
  const { t } = useTranslation(['common', 'screens'])
  const { locale } = useLocale()
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE'
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const kitchenResults = results.filter((r) => r.group === 'kitchen')
  const serviceResults = results.filter((r) => r.group === 'service')
  const kitchenTotal = kitchenResults.reduce((s, r) => s + r.amountInCents, 0)
  const serviceTotal = serviceResults.reduce((s, r) => s + r.amountInCents, 0)

  function renderGroup(
    groupResults: DistributionResult[],
    groupLabel: string,
    badgeVariant: 'kitchen' | 'service',
    icon: 'utensils-crossed' | 'users'
  ) {
    if (groupResults.length === 0) return null
    const groupTotal = groupResults.reduce((s, r) => s + r.amountInCents, 0)
    const groupHours = groupResults.reduce((s, r) => s + r.hours, 0)

    return (
      <div className="space-y-2">
        {/* Group header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Icon name={icon} size={14} className="text-text-secondary" />
            <Badge variant={badgeVariant}>{groupLabel}</Badge>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-text-primary">
              {formatEurFromCents(groupTotal, fmtLocale)}
            </span>
            {groupHours > 0 && (
              <span className="ml-2 text-xs text-text-secondary">
                ⌀ {formatEurFromCents(Math.round(groupTotal / groupHours), fmtLocale)}/h
              </span>
            )}
          </div>
        </div>

        {/* Employee cards */}
        {groupResults.map((r) => {
          const perHour = r.hours > 0
            ? formatEurFromCents(Math.round(r.amountInCents / r.hours), fmtLocale)
            : null
          const share = personShares?.find((s) => s.id === r.employeeId)
          const isExpandable = share !== undefined
          const isExpanded = expandedId === r.employeeId

          return (
            <div
              key={r.employeeId}
              className="rounded-xl bg-surface-raised shadow-elevation-1 overflow-hidden"
            >
              {/* Card header row */}
              {isExpandable ? (
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : r.employeeId)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-overlay transition-colors"
                >
                  <div className="min-w-0 text-left">
                    <p className="font-semibold text-text-primary text-base truncate">{r.name}</p>
                    <p className="text-sm text-text-secondary mt-0.5 flex items-center gap-1">
                      <Icon name="clock" size={12} />
                      {r.hours}h
                      {perHour && (
                        <span className="ml-1">· {perHour}/h</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-xl font-bold font-mono text-text-primary">
                      {formatEurFromCents(r.amountInCents, fmtLocale)}
                    </p>
                    <Icon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      className="text-text-secondary"
                    />
                  </div>
                </button>
              ) : (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary text-base truncate">{r.name}</p>
                    <p className="text-sm text-text-secondary mt-0.5 flex items-center gap-1">
                      <Icon name="clock" size={12} />
                      {r.hours}h
                      {perHour && (
                        <span className="ml-1">· {perHour}/h</span>
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xl font-bold font-mono text-text-primary">
                      {formatEurFromCents(r.amountInCents, fmtLocale)}
                    </p>
                  </div>
                </div>
              )}

              {/* Expanded detail */}
              {isExpandable && isExpanded && share && (
                <div className="border-t border-border px-4 py-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">{t('screens:results.idealColumn')}</span>
                    <span className="font-mono text-text-primary">
                      {formatEurFromCents(share.idealShareInCents, fmtLocale)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">{t('screens:results.actualColumn')}</span>
                    <span className="font-mono font-semibold text-text-primary">
                      {formatEurFromCents(share.actualShareInCents, fmtLocale)}
                    </span>
                  </div>
                  {share.deviationInCents !== 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">{t('screens:results.deviationColumn')}</span>
                      <span className={cn(
                        'font-mono font-semibold',
                        share.deviationInCents > 0 ? 'text-status-success' : 'text-status-error'
                      )}>
                        {share.deviationInCents > 0 ? '+' : ''}
                        {formatEurFromCents(share.deviationInCents, fmtLocale)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderGroup(kitchenResults, t('screens:results.groupKitchen'), 'kitchen', 'utensils-crossed')}
      {renderGroup(serviceResults, t('screens:results.groupService'), 'service', 'users')}

      {/* Summary card */}
      <div className="rounded-xl overflow-hidden shadow-elevation-2">
        {kitchenResults.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-surface-raised border-b border-border">
            <div className="flex items-center gap-2">
              <Icon name="utensils-crossed" size={14} className="text-orange-600" />
              <span className="text-sm text-text-secondary">{t('screens:results.kitchenPoolLabel')}</span>
            </div>
            <span className="font-mono text-sm font-semibold">{formatEurFromCents(kitchenTotal, fmtLocale)}</span>
          </div>
        )}
        {serviceResults.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-surface-raised border-b border-border">
            <div className="flex items-center gap-2">
              <Icon name="users" size={14} className="text-accent" />
              <span className="text-sm text-text-secondary">{t('screens:results.servicePoolLabel')}</span>
            </div>
            <span className="font-mono text-sm font-semibold">{formatEurFromCents(serviceTotal, fmtLocale)}</span>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-4 bg-accent">
          <span className="text-base font-semibold text-accent-foreground">
            {t('screens:results.totalLabel')}
          </span>
          <span className="text-2xl font-bold font-mono text-accent-foreground">
            {formatEurFromCents(totalInCents, fmtLocale)}
          </span>
        </div>
      </div>
    </div>
  )
}
