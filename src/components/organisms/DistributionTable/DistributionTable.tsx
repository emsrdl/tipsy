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

import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Icon } from '@/components/atoms/Icon/Icon';
import { formatEurFromCents } from '@/config/currency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import type { DistributionResult } from '@/types/session';
import type { PersonShare } from '@/types/shift';
import type { EmployeePayoutPlan } from '@/types/calculation';
import { DENOMINATIONS } from '@/config/currency';

export interface DistributionTableProps {
  results: DistributionResult[];
  totalInCents: number;
  /** Optional smart-split person shares — enables expandable cards with ideal/actual/deviation. */
  personShares?: PersonShare[];
  /** Optional payout plans with denomination assignments (from smart split). */
  payoutPlans?: EmployeePayoutPlan[];
  /** Optional slot rendered directly after employee groups, before fairness/total. */
  belowGroups?: ReactNode;
  /** Optional slot rendered between employee groups and the total card. */
  beforeSummary?: ReactNode;
  /** Optional slot rendered after the total card. */
  afterSummary?: ReactNode;
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
export function DistributionTable({
  results,
  totalInCents,
  personShares,
  payoutPlans,
  belowGroups,
  beforeSummary,
  afterSummary,
}: DistributionTableProps) {
  const { t } = useTranslation(['common', 'screens']);
  const { locale } = useLocale();
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const kitchenResults = results.filter((r) => r.group === 'kitchen');
  const serviceResults = results.filter((r) => r.group === 'service');

  function renderGroup(
    groupResults: DistributionResult[],
    groupLabel: string,
    badgeVariant: 'kitchen' | 'service',
    icon: 'utensils-crossed' | 'users',
  ) {
    if (groupResults.length === 0) return null;
    const groupTotal = groupResults.reduce((s, r) => s + r.amountInCents, 0);
    const groupHours = groupResults.reduce((s, r) => s + r.hours, 0);

    return (
      <div className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1">
        {/* Group header */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-overlay px-4 py-3">
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

        {/* Employee rows */}
        <div className="divide-y divide-border">
          {groupResults.map((r) => {
            const perHour =
              r.hours > 0
                ? formatEurFromCents(Math.round(r.amountInCents / r.hours), fmtLocale)
                : null;
            const share = personShares?.find((s) => s.id === r.employeeId);
            const isExpandable = share !== undefined;
            const isExpanded = expandedId === r.employeeId;

            return (
              <div key={r.employeeId}>
                {/* Row header */}
                {isExpandable ? (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : r.employeeId)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-overlay"
                  >
                  <div className="min-w-0 text-left">
                    <p className="truncate text-base font-semibold text-text-primary">{r.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-text-secondary">
                      <Icon name="clock" size={12} />
                      {r.hours}h{perHour && <span className="ml-1">· {perHour}/h</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="font-mono text-xl font-bold text-text-primary">
                        {formatEurFromCents(r.amountInCents, fmtLocale)}
                      </p>
                      {share && (
                        <p className="font-mono text-xs text-text-secondary">
                          {t('screens:results.idealColumn')}: {formatEurFromCents(share.idealShareInCents, fmtLocale)}
                        </p>
                      )}
                    </div>
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
                    <p className="truncate text-base font-semibold text-text-primary">{r.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-text-secondary">
                      <Icon name="clock" size={12} />
                      {r.hours}h{perHour && <span className="ml-1">· {perHour}/h</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xl font-bold text-text-primary">
                      {formatEurFromCents(r.amountInCents, fmtLocale)}
                    </p>
                  </div>
                </div>
              )}

              {/* Expanded detail */}
              {isExpandable &&
                isExpanded &&
                share &&
                (() => {
                  const payout = payoutPlans?.find((p) => p.employeeId === r.employeeId);
                  const assignments = payout?.assignments?.filter((a) => a.count > 0) ?? [];

                  return (
                    <div className="space-y-3 border-t border-border px-4 py-3">
                      {share.deviationInCents !== 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary">
                            {t('screens:results.deviationColumn')}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 font-mono text-xs font-semibold',
                              share.deviationInCents > 0
                                ? 'bg-status-success/15 text-status-success'
                                : 'bg-status-error/15 text-status-error',
                            )}
                          >
                            {share.deviationInCents > 0 ? '+' : ''}
                            {formatEurFromCents(share.deviationInCents, fmtLocale)}
                          </span>
                        </div>
                      )}
                      {assignments.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs text-text-secondary">
                            {t('screens:results.denominationsTitle')}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {assignments.map((a) => {
                              const denom = DENOMINATIONS.find((d) => d.id === a.denominationId);
                              return (
                                <span
                                  key={a.denominationId}
                                  className="inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2.5 py-1 font-mono text-xs text-text-primary"
                                >
                                  <span className="font-semibold">{a.count}x</span>
                                  {denom?.symbol ?? a.denominationId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderGroup(serviceResults, t('screens:results.groupService'), 'service', 'users')}
      {renderGroup(
        kitchenResults,
        t('screens:results.groupKitchen'),
        'kitchen',
        'utensils-crossed',
      )}

      {belowGroups}

      {beforeSummary}

      {/* Total card */}
      <div className="overflow-hidden rounded-xl border-2 border-accent bg-surface-raised shadow-elevation-1">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-base font-semibold text-accent">
            {t('screens:results.totalLabel')}
          </span>
          <span className="font-mono text-2xl font-bold text-accent">
            {formatEurFromCents(totalInCents, fmtLocale)}
          </span>
        </div>
      </div>

      {afterSummary}
    </div>
  );
}
