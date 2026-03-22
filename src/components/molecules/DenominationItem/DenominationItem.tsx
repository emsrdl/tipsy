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
}: DenominationItemProps) {
  const { locale } = useLocale();
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';
  const subtotalCents = denomination.valueInCents * quantity;
  const isActive = quantity > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors',
        isActive && 'bg-accent-subtle/30',
      )}
    >
      {/* Denomination symbol — pill */}
      <div
        className={cn(
          'flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold',
          isActive
            ? 'bg-accent text-accent-foreground shadow-elevation-1'
            : 'bg-surface-overlay text-text-primary',
        )}
      >
        {denomination.symbol}
      </div>

      {/* Stepper */}
      <div className="flex flex-1 justify-center">
        <Stepper
          value={quantity}
          onChange={(qty) => onQuantityChange(denomination.id, qty)}
          min={0}
          max={999}
          step={1}
          size="md"
          aria-label={`${denomination.symbol} Anzahl`}
        />
      </div>

      {/* Subtotal */}
      <div
        className={cn(
          'w-20 flex-shrink-0 text-right font-mono text-sm',
          isActive ? 'font-semibold text-text-primary' : 'text-text-secondary',
        )}
      >
        {subtotalCents > 0 ? formatEurFromCents(subtotalCents, fmtLocale) : '—'}
      </div>
    </div>
  );
}
