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
  /** Optional slot rendered between employee groups and the summary/total card. */
  beforeSummary?: ReactNode;
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
  beforeSummary,
}: DistributionTableProps) {
  const { t } = useTranslation(['common', 'screens']);
  const { locale } = useLocale();
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const kitchenResults = results.filter((r) => r.group === 'kitchen');
  const serviceResults = results.filter((r) => r.group === 'service');
  const kitchenTotal = kitchenResults.reduce((s, r) => s + r.amountInCents, 0);
  const serviceTotal = serviceResults.reduce((s, r) => s + r.amountInCents, 0);

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
          const perHour =
            r.hours > 0
              ? formatEurFromCents(Math.round(r.amountInCents / r.hours), fmtLocale)
              : null;
          const share = personShares?.find((s) => s.id === r.employeeId);
          const isExpandable = share !== undefined;
          const isExpanded = expandedId === r.employeeId;

          return (
            <div
              key={r.employeeId}
              className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1"
            >
              {/* Card header row */}
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
                    <p className="font-mono text-xl font-bold text-text-primary">
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
                    <div className="space-y-2 border-t border-border px-4 py-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">
                          {t('screens:results.idealColumn')}
                        </span>
                        <span className="font-mono text-text-primary">
                          {formatEurFromCents(share.idealShareInCents, fmtLocale)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">
                          {t('screens:results.actualColumn')}
                        </span>
                        <span className="font-mono font-semibold text-text-primary">
                          {formatEurFromCents(share.actualShareInCents, fmtLocale)}
                        </span>
                      </div>
                      {share.deviationInCents !== 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">
                            {t('screens:results.deviationColumn')}
                          </span>
                          <span
                            className={cn(
                              'font-mono font-semibold',
                              share.deviationInCents > 0
                                ? 'text-status-success'
                                : 'text-status-error',
                            )}
                          >
                            {share.deviationInCents > 0 ? '+' : ''}
                            {formatEurFromCents(share.deviationInCents, fmtLocale)}
                          </span>
                        </div>
                      )}
                      <div className="border-border/50 mt-2 border-t pt-2">
                        <p className="mb-1 text-xs text-text-secondary">
                          {t('screens:results.denominationsTitle')}
                        </p>
                        {assignments.length > 0 ? (
                          <div className="space-y-1">
                            {assignments.map((a) => {
                              const denom = DENOMINATIONS.find((d) => d.id === a.denominationId);
                              return (
                                <div
                                  key={a.denominationId}
                                  className="flex justify-between text-xs"
                                >
                                  <span className="text-text-primary">
                                    {a.count}×{' '}
                                    {denom
                                      ? formatEurFromCents(denom.valueInCents, fmtLocale)
                                      : a.denominationId}
                                  </span>
                                  <span className="font-mono text-text-secondary">
                                    {formatEurFromCents(a.totalCents, fmtLocale)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs italic text-text-secondary">—</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
            </div>
          );
        })}
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

      {beforeSummary}

      {/* Summary card */}
      <div className="overflow-hidden rounded-xl shadow-elevation-2">
        {serviceResults.length > 0 && (
          <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="users" size={14} className="text-teal-600 dark:text-teal-400" />
              <span className="text-sm text-text-secondary">
                {t('screens:results.servicePoolLabel')}
              </span>
            </div>
            <span className="font-mono text-sm font-semibold">
              {formatEurFromCents(serviceTotal, fmtLocale)}
            </span>
          </div>
        )}
        {kitchenResults.length > 0 && (
          <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="utensils-crossed" size={14} className="text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-text-secondary">
                {t('screens:results.kitchenPoolLabel')}
              </span>
            </div>
            <span className="font-mono text-sm font-semibold">
              {formatEurFromCents(kitchenTotal, fmtLocale)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between bg-accent px-4 py-4">
          <span className="text-base font-semibold text-accent-foreground">
            {t('screens:results.totalLabel')}
          </span>
          <span className="font-mono text-2xl font-bold text-accent-foreground">
            {formatEurFromCents(totalInCents, fmtLocale)}
          </span>
        </div>
      </div>
    </div>
  );
}
