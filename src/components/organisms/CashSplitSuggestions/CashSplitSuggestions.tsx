/**
 * @file src/components/organisms/CashSplitSuggestions/CashSplitSuggestions.tsx
 * @description Card listing cash-split suggestions — one per source bill.
 *
 * Each suggestion names only WHICH bill to break and how the balance
 * transfers shrink — the actual breakdown is deliberately not prescribed
 * here: the user counts it out in the picker dialog, guided dynamically.
 *
 * Applied splits use the same row layout, muted, with an undo icon.
 *
 * @see src/components/molecules/CashSplitDialog for the picker
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/atoms/Icon/Icon';
import { CashSplitDialog } from '@/components/molecules/CashSplitDialog';
import { formatCashPieces, getDenominationSymbol } from '@/config/currency';
import { revertBreakdownFromPool } from '@/lib/calc/cashSplitSuggester';
import { cn } from '@/lib/utils';
import type { CashPieces, CashSplitSuggestion, AppliedCashSplit } from '@/types/cashSplit';
import type { DenominationQuantity } from '@/types/session';
import type { Employee } from '@/types/employee';

interface CashSplitSuggestionsProps {
  suggestions: CashSplitSuggestion[];
  appliedSplits: AppliedCashSplit[];
  /** Pool state needed by the picker dialog for the live preview. */
  denominations: DenominationQuantity[];
  employees: Employee[];
  totalInCents: number;
  kitchenPercent: number;
  thresholdInCents: number;
  onApply: (suggestion: CashSplitSuggestion, pieces: CashPieces) => void;
  onRevert: (splitId: string) => void;
}


export function CashSplitSuggestions({
  suggestions,
  appliedSplits,
  denominations,
  employees,
  totalInCents,
  kitchenPercent,
  thresholdInCents,
  onApply,
  onRevert,
}: CashSplitSuggestionsProps) {
  const { t } = useTranslation('common');
  const [dialogSuggestion, setDialogSuggestion] = useState<CashSplitSuggestion | null>(null);
  const [reviewApplied, setReviewApplied] = useState<AppliedCashSplit | null>(null);

  const isReviewMode = reviewApplied !== null;

  // For the review dialog, simulate the pool as it was before the split so
  // the transfer-count preview reflects applying the breakdown fresh.
  const reviewDenominations = useMemo(
    () =>
      reviewApplied
        ? revertBreakdownFromPool(denominations, reviewApplied.sourceDenominationId, reviewApplied.actualPieces)
        : denominations,
    [reviewApplied, denominations],
  );

  // Synthetic suggestion for the review dialog. predictedTransferCount is set
  // to Infinity so any exact breakdown is treated as "goal reached" (green).
  const reviewSuggestion = useMemo<CashSplitSuggestion | null>(() => {
    if (!reviewApplied) return null;
    return {
      id: reviewApplied.id,
      sourceDenominationId: reviewApplied.sourceDenominationId,
      breakdowns: [{ pieces: reviewApplied.actualPieces, predictedTransferCount: Number.POSITIVE_INFINITY }],
      currentTransferCount: 0,
      predictedTransferCount: Number.POSITIVE_INFINITY,
    };
  }, [reviewApplied]);

  const activeSuggestion = isReviewMode ? reviewSuggestion : dialogSuggestion;
  const activeDenominations = isReviewMode ? reviewDenominations : denominations;

  const totalOptions = suggestions.length + appliedSplits.length;
  if (totalOptions === 0) return null;

  const showSectionLabels = suggestions.length > 0 && appliedSplits.length > 0;

  function handleDialogConfirm(pieces: CashPieces) {
    if (reviewApplied && reviewSuggestion) {
      // Revert the original split then re-apply with the (possibly modified) pieces.
      onRevert(reviewApplied.id);
      onApply(reviewSuggestion, pieces);
      setReviewApplied(null);
    } else if (dialogSuggestion) {
      onApply(dialogSuggestion, pieces);
      setDialogSuggestion(null);
    }
  }

  function handleDialogRevert() {
    if (reviewApplied) {
      onRevert(reviewApplied.id);
      setReviewApplied(null);
    }
  }

  function handleDialogCancel() {
    setReviewApplied(null);
    setDialogSuggestion(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border-2 border-accent/30 bg-surface-raised shadow-elevation-1">
        <div className="flex items-center gap-2 border-b border-border bg-accent/5 px-4 py-3">
          <Icon name="scissors" size={16} className="shrink-0 text-accent" />
          <span className="text-sm font-semibold text-text-primary">
            {t('smartSplit.cashSplits.title')}
          </span>
          <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
            {t('smartSplit.cashSplits.optionCount', { count: totalOptions })}
          </span>
        </div>

        <div className="space-y-3 p-3">
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {showSectionLabels && <SectionLabel label={t('smartSplit.cashSplits.pending')} />}
              {suggestions.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} onOpen={() => setDialogSuggestion(s)} />
              ))}
            </div>
          )}

          {appliedSplits.length > 0 && (
            <div className="space-y-2">
              {showSectionLabels && <SectionLabel label={t('smartSplit.cashSplits.applied')} />}
              {appliedSplits.map((a) => (
                <AppliedCard key={a.id} applied={a} onOpenReview={() => setReviewApplied(a)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CashSplitDialog
        key={activeSuggestion?.id ?? 'closed'}
        open={activeSuggestion !== null}
        suggestion={activeSuggestion}
        {...(reviewApplied ? { initialPieces: reviewApplied.actualPieces } : {})}
        {...(isReviewMode ? { onRevert: handleDialogRevert } : {})}
        denominations={activeDenominations}
        employees={employees}
        totalInCents={totalInCents}
        kitchenPercent={kitchenPercent}
        thresholdInCents={thresholdInCents}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Section label (small caps separator between Pending / Applied)
// ---------------------------------------------------------------------------

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-1 pt-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-text-secondary">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suggestion card — which bill to break + how the transfers shrink
// ---------------------------------------------------------------------------

function SuggestionCard({
  suggestion,
  onOpen,
}: {
  suggestion: CashSplitSuggestion;
  onOpen: () => void;
}) {
  const { t } = useTranslation('common');
  const isZero = suggestion.predictedTransferCount === 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('smartSplit.cashSplits.openDetails')}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-sunken/40 px-3 py-2.5 text-left transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      {/* Bill to break — same pill styling as the denomination grid */}
      <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-overlay font-mono text-sm font-bold text-text-primary">
        {getDenominationSymbol(suggestion.sourceDenominationId)}
      </span>

      {/* Transfer reduction */}
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-text-secondary">
          {t('smartSplit.cashSplits.dialogTransfers')}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-sm font-bold">
          <span className="text-text-secondary line-through decoration-status-error/60">
            {suggestion.currentTransferCount}
          </span>
          <Icon name="arrow-right" size={13} className="text-text-secondary" />
          <span className={isZero ? 'text-status-success' : 'text-text-primary'}>
            {suggestion.predictedTransferCount}
          </span>
          {isZero && <Icon name="check" size={14} className="text-status-success" />}
        </span>
      </span>

      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary',
        )}
      >
        <Icon name="chevron-right" size={20} />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Applied card — muted, shows the actually chosen breakdown + undo
// ---------------------------------------------------------------------------

function AppliedCard({
  applied,
  onOpenReview,
}: {
  applied: AppliedCashSplit;
  onOpenReview: () => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="rounded-xl border border-border bg-surface-sunken/30 p-3 opacity-70">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 font-mono text-sm">
          <span className="font-bold text-text-primary">
            {getDenominationSymbol(applied.sourceDenominationId)}
          </span>
          <Icon name="arrow-right" size={14} className="shrink-0 text-text-secondary" />
          <span className="font-normal text-text-primary">{formatCashPieces(applied.actualPieces)}</span>
        </div>
        <button
          type="button"
          onClick={onOpenReview}
          aria-label={t('smartSplit.cashSplits.revert')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary/60"
        >
          <Icon name="undo-2" size={18} />
        </button>
      </div>
    </div>
  );
}
