/**
 * @file src/components/molecules/CashSplitDialog/CashSplitDialog.tsx
 * @description Picker dialog for breaking a bill into smaller denominations.
 *
 * Opens EMPTY on purpose: the user counts real money out of the till, and
 * the guidance follows along. Nothing is pre-selected and no breakdown is
 * prescribed — all guidance is recomputed from the actual selection on
 * every change, verified by simulation:
 *
 *   - green badges — the best completion from here ("add n more"),
 *   - orange badges — alternative routes that use denominations the best
 *     completion doesn't; tapping one fills the steppers with that route,
 *   - red badge — dead-end recovery ("remove n"),
 *   - goal reached — everything green, orange pointers to other full
 *     variants remain as a "what else would have worked" overview.
 *
 * Plus buttons stop incrementing once the breakdown total would exceed the
 * source bill's value. The bottom bar shows the live total and the transfer
 * count simulated for the actual selection (only when the total matches the
 * source value exactly — a partial selection shows "—"). Confirm stays
 * disabled until the total matches exactly.
 *
 * Review mode (onRevert provided): the dialog opens pre-filled with
 * `initialPieces` so the user can inspect and optionally modify the breakdown
 * of an already-applied split. The footer adds a destructive "Revert" button
 * that undoes the split entirely.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DenominationItem } from '@/components/molecules/DenominationItem/DenominationItem';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { DENOMINATIONS, BANKNOTE_MIN_CENTS, formatEurFromCents, formatCashPieces } from '@/config/currency';
import { useCashSplitGuidance, type AltBadge } from '@/hooks/useCashSplitGuidance';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import type { CashPieces, CashSplitSuggestion } from '@/types/cashSplit';
import type { DenominationQuantity } from '@/types/session';
import type { Employee } from '@/types/employee';

interface CashSplitDialogProps {
  open: boolean;
  suggestion: CashSplitSuggestion | null;
  /** Pool state — used by the live preview. */
  denominations: DenominationQuantity[];
  employees: Employee[];
  totalInCents: number;
  kitchenPercent: number;
  thresholdInCents: number;
  /** Pre-fills the picker for review mode (an already-applied split). */
  initialPieces?: CashPieces;
  onConfirm: (pieces: CashPieces) => void;
  onCancel: () => void;
  /** When provided, renders a destructive "Revert" button (review mode). */
  onRevert?: () => void;
}

export function CashSplitDialog({
  open,
  suggestion,
  denominations,
  employees,
  totalInCents,
  kitchenPercent,
  thresholdInCents,
  initialPieces,
  onConfirm,
  onCancel,
  onRevert,
}: CashSplitDialogProps) {
  const { t } = useTranslation(['common', 'screens']);
  const { fmtLocale } = useLocale();

  const sourceDenom = suggestion
    ? DENOMINATIONS.find((d) => d.id === suggestion.sourceDenominationId) ?? null
    : null;
  const sourceValueCents = sourceDenom?.valueInCents ?? 0;
  const sourceSymbol = sourceDenom?.symbol ?? '';

  // Selection state + all verified guidance (green/orange/red) live in the hook.
  const {
    quantities,
    currentPieces,
    currentTotalCents,
    isExact,
    previewTransferCount,
    completion,
    addCounts,
    removeCounts,
    altBadges,
    rowsValid,
    setQty,
    addPieces,
    maxQtyFor,
  } = useCashSplitGuidance(
    suggestion,
    { denominations, employees, totalInCents, kitchenPercent, thresholdInCents },
    initialPieces,
  );

  // Only denominations smaller than the source can be used as breakdown pieces
  const { banknotes, coins } = useMemo(() => {
    const eligible = DENOMINATIONS.filter((d) => d.valueInCents < sourceValueCents);
    return {
      banknotes: eligible.filter((d) => d.valueInCents >= BANKNOTE_MIN_CENTS),
      coins: eligible.filter((d) => d.valueInCents < BANKNOTE_MIN_CENTS),
    };
  }, [sourceValueCents]);

  function handleConfirm() {
    if (!isExact || !suggestion) return;
    onConfirm(currentPieces);
  }

  if (!suggestion || !sourceDenom) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="flex max-h-[92vh] max-w-md flex-col gap-0 overflow-hidden border-border bg-surface p-0">
        <DialogHeader className="border-b border-border bg-surface-raised px-4 py-4">
          <div className="flex items-center gap-2">
            <Icon name="scissors" size={16} className="text-accent" />
            <DialogTitle className="text-left text-base font-semibold text-text-primary">
              {t('common:smartSplit.cashSplits.dialogTitle', { source: sourceSymbol })}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Denomination grid — flexes between header and the fixed summary +
            footer, so those never get clipped. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-3">
            {banknotes.length > 0 && (
              <DenomSection
                titleKey="screens:cashInput.denominationSection"
                icon="banknote"
                denoms={banknotes}
                quantities={quantities}
                addCounts={addCounts}
                removeCounts={removeCounts}
                altBadges={altBadges}
                rowsValid={rowsValid}
                maxQtyFor={maxQtyFor}
                onChange={setQty}
              />
            )}
            {coins.length > 0 && (
              <DenomSection
                titleKey="screens:cashInput.coinSection"
                icon="coins"
                denoms={coins}
                quantities={quantities}
                addCounts={addCounts}
                removeCounts={removeCounts}
                altBadges={altBadges}
                rowsValid={rowsValid}
                maxQtyFor={maxQtyFor}
                onChange={setQty}
              />
            )}
          </div>
        </div>

        {/* Live transfer count + total */}
        <div className="space-y-1 border-t border-border bg-surface-raised px-4 py-3">
          {completion && (
            <div className="flex items-center justify-between gap-3 pb-1">
              <span className="text-xs text-text-secondary">
                {t('common:smartSplit.cashSplits.completeWith')}
              </span>
              <button
                type="button"
                onClick={() => addPieces(completion)}
                className="rounded-full border border-accent bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                + {formatCashPieces(completion)}
              </button>
            </div>
          )}
          {/* In review mode only show the simulated result, not the "before" count */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {t('common:smartSplit.cashSplits.dialogTransfers')}
            </span>
            <span className="font-mono text-sm font-semibold text-text-primary">
              {onRevert ? null : (
                <>
                  {suggestion.currentTransferCount}
                  <span className="mx-1.5 text-text-secondary">→</span>
                </>
              )}
              <span
                className={cn(
                  previewTransferCount !== null &&
                    (onRevert
                      ? previewTransferCount === 0
                      : previewTransferCount < suggestion.currentTransferCount) &&
                    'text-status-success',
                )}
              >
                {previewTransferCount ?? '—'}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {t('common:smartSplit.cashSplits.dialogTotal')}
            </span>
            <span
              className={cn(
                'font-mono text-sm font-bold',
                isExact ? 'text-status-success' : 'text-text-secondary',
              )}
            >
              {formatEurFromCents(currentTotalCents, fmtLocale)}
              <span className="mx-1 font-normal text-text-secondary">/</span>
              {formatEurFromCents(sourceValueCents, fmtLocale)}
            </span>
          </div>
        </div>

        {(() => {
          const cancelConfirm = (
            <>
              <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
                {t('common:smartSplit.cashSplits.dialogCancel')}
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1"
                disabled={!isExact}
                onClick={handleConfirm}
              >
                {t('common:smartSplit.cashSplits.dialogConfirm')}
              </Button>
            </>
          );
          return onRevert ? (
            // Review mode: destructive revert on top, cancel + confirm below
            <div className="flex flex-col gap-2 border-t border-border bg-surface-raised p-3">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-status-error hover:bg-status-error/10 hover:text-status-error"
                onClick={onRevert}
              >
                <Icon name="undo-2" size={16} />
                {t('common:smartSplit.cashSplits.dialogRevert')}
              </Button>
              <div className="flex gap-2">{cancelConfirm}</div>
            </div>
          ) : (
            <DialogFooter className="gap-2 border-t border-border bg-surface-raised p-3 sm:gap-2 sm:space-x-0">
              {cancelConfirm}
            </DialogFooter>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Denomination section
// ---------------------------------------------------------------------------

function DenomSection({
  titleKey,
  icon,
  denoms,
  quantities,
  addCounts,
  removeCounts,
  altBadges,
  rowsValid,
  maxQtyFor,
  onChange,
}: {
  titleKey: string;
  icon: 'banknote' | 'coins';
  denoms: typeof DENOMINATIONS;
  quantities: Record<string, number>;
  /** Per-denomination "add n more" counts from the best completion (green). */
  addCounts: Record<string, number>;
  /** Per-denomination "remove n" counts from the removal search (red). */
  removeCounts: Record<string, number>;
  /** Alternative-route pointers (orange, tappable). */
  altBadges: Record<string, AltBadge>;
  /** Selection is on a verified path — active rows render green subtotals. */
  rowsValid: boolean;
  maxQtyFor: (id: string) => number;
  onChange: (id: string, qty: number) => void;
}) {
  const { t } = useTranslation(['screens', 'common']);
  return (
    <div className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Icon name={icon} size={14} className="text-text-secondary" />
        <h3 className="text-xs font-semibold text-text-secondary">{t(titleKey)}</h3>
      </div>
      <div className="divide-y divide-border">
        {denoms.map((denom) => {
          const add = addCounts[denom.id] ?? 0;
          const remove = removeCounts[denom.id] ?? 0;
          const alt = altBadges[denom.id];
          return (
            <DenominationItem
              key={denom.id}
              denomination={denom}
              quantity={quantities[denom.id] ?? 0}
              maxQuantity={maxQtyFor(denom.id)}
              addCount={add}
              removeCount={remove}
              altCount={alt ? alt.count : null}
              rowValid={rowsValid}
              {...(alt ? { onAltTap: alt.apply } : {})}
              addBadgeLabel={t('common:smartSplit.cashSplits.addBadge', { count: add })}
              removeBadgeLabel={t('common:smartSplit.cashSplits.removeBadge', { count: remove })}
              altBadgeLabel={t('common:smartSplit.cashSplits.altBadge', { count: alt?.count ?? 0 })}
              onQuantityChange={onChange}
            />
          );
        })}
      </div>
    </div>
  );
}
