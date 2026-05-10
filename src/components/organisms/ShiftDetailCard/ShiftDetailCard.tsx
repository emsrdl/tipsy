/**
 * @file src/components/organisms/ShiftDetailCard/ShiftDetailCard.tsx
 * @description Expanded shift detail view for the history screen.
 *
 * Shows per-employee breakdown with actual share and deviation,
 * fairness score (pre/post-transfer), suggested transfers, and action buttons.
 * Styling is unified with the ResultsScreen display patterns.
 *
 * @example
 * <ShiftDetailCard
 *   shift={shift}
 *   onDelete={() => setConfirmDeleteId(shift.id)}
 *   onExport={() => handleExportShift(shift)}
 * />
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { formatEurFromCents } from '@/config/currency';
import { postTransferFairnessScore } from '@/lib/calc/calculations';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import type { Shift } from '@/types/shift';

export interface ShiftDetailCardProps {
  /** The shift to display. */
  shift: Shift;
  /** Called when the user confirms shift deletion. */
  onDelete: () => void;
  /** Called when the user wants to export this shift. */
  onExport: () => void;
}

/**
 * Expanded detail view for a single shift in history.
 * Renders inside the parent shift card's border-t section.
 */
export function ShiftDetailCard({ shift, onDelete, onExport }: ShiftDetailCardProps) {
  const { t } = useTranslation(['common', 'screens']);
  const { locale } = useLocale();
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';

  const { distribution, differences, smartSplitting } = shift;
  const { personShares, fairnessScore } = distribution;

  const postScore = useMemo(
    () => (smartSplitting ? postTransferFairnessScore(personShares, differences) : undefined),
    [personShares, differences, smartSplitting],
  );

  const displayScore = postScore ?? fairnessScore;

  return (
    <div className="border-t border-border">
      {/* Per-employee rows */}
      <div className="divide-y divide-border">
        {personShares.map((share) => (
          <div key={share.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{share.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                <Icon name="clock" size={10} />
                {share.hoursWorked}h
                <span className="ml-1">
                  ·{' '}
                  {share.role === 'kitchen'
                    ? t('common:profile.role.kitchen')
                    : t('common:profile.role.service')}
                </span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-sm font-bold text-text-primary">
                {formatEurFromCents(share.actualShareInCents, fmtLocale)}
              </p>
              {share.deviationInCents !== 0 && (
                <p
                  className={cn(
                    'mt-0.5 font-mono text-xs',
                    share.deviationInCents > 0 ? 'text-status-success' : 'text-status-error',
                  )}
                >
                  {share.deviationInCents > 0 ? '+' : ''}
                  {formatEurFromCents(share.deviationInCents, fmtLocale)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary section */}
      <div className="border-t border-border">
        {/* Shift total */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-text-secondary">{t('common:history.shiftTotal')}</span>
          <span className="font-mono text-sm font-bold text-text-primary">
            {formatEurFromCents(shift.totalTipsInCents, fmtLocale)}
          </span>
        </div>

        {/* Fairness score — smart split only, shows pre → post when transfers exist */}
        {smartSplitting && (
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <Icon
              name="star"
              size={14}
              className={displayScore >= 95 ? 'text-status-success' : 'text-status-warning'}
            />
            <span className="flex-1 text-sm text-text-secondary">
              {t('common:smartSplit.fairnessScore')}
            </span>
            {postScore !== undefined ? (
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'font-mono text-sm font-bold',
                    fairnessScore >= 95 ? 'text-status-success' : 'text-status-warning',
                  )}
                >
                  {fairnessScore}%
                </span>
                <Icon name="arrow-right" size={12} className="text-text-secondary" />
                <span
                  className={cn(
                    'font-mono text-sm font-bold',
                    postScore >= 95 ? 'text-status-success' : 'text-status-warning',
                  )}
                >
                  {postScore}%
                </span>
              </span>
            ) : (
              <span
                className={cn(
                  'font-mono text-sm font-bold',
                  fairnessScore >= 95 ? 'text-status-success' : 'text-status-warning',
                )}
              >
                {fairnessScore}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Transfers — unified with ResultsScreen styling */}
      {differences.length > 0 && (
        <div className="border-t border-border">
          <div className="flex items-center gap-2 px-4 py-3">
            <Icon name="arrow-right" size={14} className="text-status-warning" />
            <span className="text-sm font-semibold text-text-primary">
              {t('common:smartSplit.transfers')}
            </span>
          </div>
          <div className="divide-y divide-border">
            {differences.map((diff, i) => (
              <div
                key={`${diff.fromPerson.id}-${diff.toPerson.id}-${i}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {diff.fromPerson.name}
                  </span>
                  <Icon name="arrow-right" size={14} className="shrink-0 text-status-warning" />
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {diff.toPerson.name}
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-status-warning/15 px-2.5 py-0.5 font-mono text-sm font-bold text-status-warning">
                  {formatEurFromCents(diff.amountInCents, fmtLocale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onDelete}
          className="min-h-9 gap-1.5 text-xs text-status-error hover:text-status-error"
        >
          <Icon name="trash" size={12} />
          {t('common:history.deleteShift')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onExport}
          className="min-h-9 gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        >
          <Icon name="download" size={12} />
          {t('common:history.exportShift')}
        </Button>
      </div>
    </div>
  );
}
