/**
 * @file src/components/organisms/DistributionTable/DistributionTable.tsx
 * @description DistributionTable organism — Material card results per employee.
 *
 * Touch-first design:
 * - Each employee as a Material card row with prominent amount display
 * - Denomination payout (which bills/coins to hand out) always visible per row
 * - Secondary details (hours, per-hour rate, ideal share, deviation) behind
 *   a tap-to-expand on each row to keep the first glance uncluttered
 * - Group header chips with pool total and per-hour average
 * - Summary footer card with kitchen/service/total breakdown
 *
 * @example
 * <DistributionTable results={session.results} totalInCents={totalInCents} />
 */

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Icon } from '@/components/atoms/Icon/Icon';
import {
  formatEurFromCents,
  formatSignedEurFromCents,
  DENOMINATIONS,
  BANKNOTE_MIN_CENTS,
} from '@/config/currency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import type { DistributionResult } from '@/types/session';
import type { PersonShare } from '@/types/shift';
import type { EmployeePayoutPlan, DenominationAssignment } from '@/types/calculation';

const DENOM_BY_ID = new Map(DENOMINATIONS.map((d) => [d.id, d]));

export interface DistributionTableProps {
  results: DistributionResult[];
  totalInCents: number;
  /** Optional smart-split person shares — enables ideal/deviation display per row. */
  personShares?: PersonShare[];
  /** Optional payout plans with denomination assignments (from smart split). */
  payoutPlans?: EmployeePayoutPlan[];
  /** Optional slot rendered directly after employee groups, before fairness/total. */
  belowGroups?: ReactNode;
  /** Optional slot rendered after the total card. */
  afterSummary?: ReactNode;
}

/**
 * Material card-based results display grouped by kitchen/service.
 *
 * In smart-split mode each row shows the exact bills/coins to hand out
 * with no interaction required; tapping a row reveals secondary details
 * (hours, per-hour rate, ideal share, deviation).
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
  afterSummary,
}: DistributionTableProps) {
  const { t } = useTranslation(['common', 'screens']);
  const { fmtLocale } = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { kitchenResults, serviceResults } = useMemo(() => {
    const kitchen: DistributionResult[] = [];
    const service: DistributionResult[] = [];
    for (const r of results) {
      if (r.group === 'kitchen') kitchen.push(r);
      else if (r.group === 'service') service.push(r);
    }
    return { kitchenResults: kitchen, serviceResults: service };
  }, [results]);

  const sharesById = useMemo(
    () => new Map((personShares ?? []).map((s) => [s.id, s])),
    [personShares],
  );

  const payoutsById = useMemo(
    () => new Map((payoutPlans ?? []).map((p) => [p.employeeId, p.assignments.filter((a) => a.count > 0)])),
    [payoutPlans],
  );

  function renderGroup(
    groupResults: DistributionResult[],
    groupLabel: string,
    badgeVariant: 'kitchen' | 'service',
    icon: 'utensils-crossed' | 'users',
  ) {
    if (groupResults.length === 0) return null;
    let groupTotal = 0;
    let groupHours = 0;
    for (const r of groupResults) {
      groupTotal += r.amountInCents;
      groupHours += r.hours;
    }

    return (
      <div className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1">
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

        <div className="divide-y divide-border">
          {groupResults.map((r) => {
            const perHour =
              r.hours > 0
                ? formatEurFromCents(Math.round(r.amountInCents / r.hours), fmtLocale)
                : null;
            const share = sharesById.get(r.employeeId);
            const assignments = payoutsById.get(r.employeeId) ?? [];
            const isExpanded = expandedId === r.employeeId;

            return (
              <div key={r.employeeId}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : r.employeeId)}
                  aria-expanded={isExpanded}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-surface-overlay/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary">
                      {r.name}
                    </p>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-xl font-bold text-text-primary">
                        {formatEurFromCents(r.amountInCents, fmtLocale)}
                      </p>
                      {share && share.deviationInCents !== 0 && (
                        <p
                          className={cn(
                            'font-mono text-xs font-semibold',
                            share.deviationInCents > 0
                              ? 'text-status-success'
                              : 'text-status-error',
                          )}
                        >
                          {formatSignedEurFromCents(share.deviationInCents, fmtLocale)}
                        </p>
                      )}
                    </div>
                    <Icon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      className="shrink-0 text-text-secondary"
                    />
                  </div>

                  {assignments.length > 0 && <PayoutChips assignments={assignments} />}
                </button>

                {isExpanded && (
                  <div className="space-y-2 border-t border-border px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Icon name="clock" size={12} />
                        {t('screens:results.hoursColumn')}
                      </span>
                      <span className="font-mono text-sm text-text-primary">
                        {r.hours}h{perHour && <span> · {perHour}/h</span>}
                      </span>
                    </div>
                    {share && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-text-secondary">
                          {t('screens:results.idealColumn')}
                        </span>
                        <span className="flex items-center gap-1.5 font-mono text-sm text-text-primary">
                          {formatEurFromCents(share.idealShareInCents, fmtLocale)}
                          {share.deviationInCents !== 0 && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                                share.deviationInCents > 0
                                  ? 'bg-status-success/15 text-status-success'
                                  : 'bg-status-error/15 text-status-error',
                              )}
                            >
                              {formatSignedEurFromCents(share.deviationInCents, fmtLocale)}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
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

interface PayoutChipsProps {
  assignments: DenominationAssignment[];
}

/**
 * The physical payout for one employee as denomination chips, sorted by
 * value descending. Banknotes are tinted for quick scanning; coins stay
 * neutral. When all chips fit one line they share a row (banknote icon);
 * when they would wrap, banknotes and coins split into two rows with a
 * banknote/coins icon each. Fit is detected via a hidden single-line
 * probe measured against the container width (re-checked on resize).
 */
function PayoutChips({ assignments }: PayoutChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(false);

  const { banknotes, coins } = useMemo(() => {
    const sorted = [...assignments].sort(
      (a, b) =>
        (DENOM_BY_ID.get(b.denominationId)?.valueInCents ?? 0) -
        (DENOM_BY_ID.get(a.denominationId)?.valueInCents ?? 0),
    );
    return {
      banknotes: sorted.filter(
        (a) => (DENOM_BY_ID.get(a.denominationId)?.valueInCents ?? 0) >= BANKNOTE_MIN_CENTS,
      ),
      coins: sorted.filter(
        (a) => (DENOM_BY_ID.get(a.denominationId)?.valueInCents ?? 0) < BANKNOTE_MIN_CENTS,
      ),
    };
  }, [assignments]);

  const canSplit = banknotes.length > 0 && coins.length > 0;

  useLayoutEffect(() => {
    if (!canSplit) {
      setSplit(false);
      return;
    }
    const container = containerRef.current;
    const probe = probeRef.current;
    if (!container || !probe) return;

    const measure = () => setSplit(probe.scrollWidth > container.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [canSplit, assignments]);

  const allChips = [...banknotes, ...coins];

  return (
    <div ref={containerRef} className="relative mt-2.5">
      {/* Invisible single-line probe to detect whether all chips fit one row */}
      {canSplit && (
        <div
          ref={probeRef}
          aria-hidden
          className="pointer-events-none invisible absolute inset-x-0 top-0 flex flex-nowrap items-center gap-1.5"
        >
          <Icon name="banknote" size={14} className="mr-0.5 shrink-0" />
          {allChips.map((a) => (
            <PayoutChip key={a.denominationId} assignment={a} />
          ))}
        </div>
      )}

      {split ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Icon name="banknote" size={14} className="mr-0.5 shrink-0 text-text-secondary" />
            {banknotes.map((a) => (
              <PayoutChip key={a.denominationId} assignment={a} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Icon name="coins" size={14} className="mr-0.5 shrink-0 text-text-secondary" />
            {coins.map((a) => (
              <PayoutChip key={a.denominationId} assignment={a} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <Icon
            name={banknotes.length > 0 ? 'banknote' : 'coins'}
            size={14}
            className="mr-0.5 shrink-0 text-text-secondary"
          />
          {allChips.map((a) => (
            <PayoutChip key={a.denominationId} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}

/** A single "count × denomination" chip — tinted for banknotes, neutral for coins. */
function PayoutChip({ assignment }: { assignment: DenominationAssignment }) {
  const denom = DENOM_BY_ID.get(assignment.denominationId);
  const isBanknote = (denom?.valueInCents ?? 0) >= BANKNOTE_MIN_CENTS;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg px-2 py-1 font-mono text-sm whitespace-nowrap',
        isBanknote ? 'bg-accent/10' : 'bg-surface-overlay',
      )}
    >
      <span className="text-xs text-text-secondary">{assignment.count}×</span>
      <span className={cn('font-semibold', isBanknote ? 'text-accent' : 'text-text-primary')}>
        {denom?.symbol ?? assignment.denominationId}
      </span>
    </span>
  );
}
