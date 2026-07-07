/**
 * @file src/components/molecules/DenominationItem/DenominationItem.tsx
 * @description DenominationItem molecule — touch-optimized denomination row.
 *
 * Touch-first redesign:
 * - Large denomination symbol (pill badge)
 * - Full Stepper with 48px +/- buttons
 * - Subtotal displayed prominently
 * - Active state highlight when quantity > 0
 *
 * @example
 * <DenominationItem
 *   denomination={{ id: 'eur_10', valueInCents: 1000, symbol: '€10', labelKey: '...' }}
 *   quantity={5}
 *   onQuantityChange={(id, qty) => setQty(id, qty)}
 * />
 */

import { useTranslation } from 'react-i18next';
import { Stepper } from '../Stepper/Stepper';
import { formatEurFromCents } from '@/config/currency';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/utils';
import type { Denomination } from '@/config/currency';

export interface DenominationItemProps {
  /** The denomination definition. */
  denomination: Denomination;
  /** Current quantity. */
  quantity: number;
  /** Called when quantity changes. */
  onQuantityChange: (denominationId: string, quantity: number) => void;
  /** Minimum allowed quantity — stepper minus button disabled at this value. @default 0 */
  minQuantity?: number;
  /** Maximum allowed quantity — stepper plus button disabled at this value. @default 999 */
  maxQuantity?: number;
  /**
   * Green corner badge: how many MORE of this denomination the currently
   * best verified path adds. 0/undefined = no badge.
   */
  addCount?: number;
  /**
   * Red corner badge: how many of this denomination to REMOVE to get back
   * onto a working path (dead-end guidance). 0/undefined = no badge.
   */
  removeCount?: number;
  /**
   * Orange corner badge: count of this denomination in an alternative full
   * variant (shown in the goal-reached state on rows the selection doesn't
   * use). Tappable via `onAltTap`. null/undefined = no badge.
   */
  altCount?: number | null;
  /** Tap handler for the orange alternative badge. */
  onAltTap?: () => void;
  /** Renders the subtotal green — the row is part of a verified path. */
  rowValid?: boolean;
  /** Accessible label for the green "add more" badge (i18n, pre-formatted). */
  addBadgeLabel?: string;
  /** Accessible label for the red "remove" badge (i18n, pre-formatted). */
  removeBadgeLabel?: string;
  /** Accessible label for the orange alternative badge (i18n, pre-formatted). */
  altBadgeLabel?: string;
}

/**
 * One row in the denomination grid — touch optimized.
 *
 * @param props - DenominationItemProps
 * @returns div with symbol badge, stepper, and subtotal
 *
 * @example
 * <DenominationItem denomination={d} quantity={qty} onQuantityChange={update} />
 */
export function DenominationItem({
  denomination,
  quantity,
  onQuantityChange,
  minQuantity = 0,
  maxQuantity = 999,
  addCount = 0,
  removeCount = 0,
  altCount,
  onAltTap,
  rowValid = false,
  addBadgeLabel,
  removeBadgeLabel,
  altBadgeLabel,
}: DenominationItemProps) {
  const { t } = useTranslation('screens');
  const { fmtLocale } = useLocale();
  const subtotalCents = denomination.valueInCents * quantity;
  const isActive = quantity > 0;
  // One badge slot per row — red wins over green over orange.
  const showRed = removeCount > 0;
  const showGreen = !showRed && addCount > 0;
  const showOrange = !showRed && !showGreen && (altCount ?? 0) > 0 && Boolean(onAltTap);
  const isOnPlan = rowValid && isActive;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors',
        isActive && 'bg-accent-subtle/30',
      )}
    >
      {/* Denomination symbol — pill with a single dynamic corner badge */}
      <div className="relative shrink-0">
        <div
          className={cn(
            'flex h-10 w-16 items-center justify-center rounded-lg font-mono text-sm font-bold',
            isActive
              ? 'bg-accent text-accent-foreground shadow-elevation-1'
              : 'bg-surface-overlay text-text-primary',
          )}
        >
          {denomination.symbol}
        </div>
        {showGreen && (
          <span
            aria-label={addBadgeLabel}
            className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-success px-1 text-[10px] font-bold leading-none text-white"
          >
            {addCount}
          </span>
        )}
        {showRed && (
          <span
            aria-label={removeBadgeLabel}
            className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-error px-1 text-[10px] font-bold leading-none text-white"
          >
            −{removeCount}
          </span>
        )}
        {showOrange && (
          <button
            type="button"
            onClick={onAltTap}
            aria-label={altBadgeLabel}
            className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-status-warning bg-surface px-1 text-[10px] font-bold leading-none text-status-warning transition-colors hover:bg-status-warning/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warning/60"
          >
            {altCount}
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex flex-1 justify-center">
        <Stepper
          value={quantity}
          onChange={(qty) => onQuantityChange(denomination.id, qty)}
          min={minQuantity}
          max={maxQuantity}
          size="md"
          aria-label={`${denomination.symbol} ${t('cashInput.quantityLabel')}`}
        />
      </div>

      {/* Subtotal — green once the row hits the active plan's target count */}
      <div
        className={cn(
          'w-20 shrink-0 text-right font-mono text-sm',
          isOnPlan
            ? 'font-bold text-status-success'
            : isActive
              ? 'font-semibold text-text-primary'
              : 'text-text-secondary',
        )}
      >
        {subtotalCents > 0 ? formatEurFromCents(subtotalCents, fmtLocale) : '—'}
      </div>
    </div>
  );
}
