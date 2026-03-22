/**
 * @file src/components/organisms/DenominationGrid/DenominationGrid.tsx
 * @description DenominationGrid organism — touch-optimized denomination input grid.
 *
 * Touch-first redesign:
 * - Material cards for banknotes and coins sections
 * - Each DenominationItem has 48px+ Stepper touch targets
 * - Sticky total display at bottom
 * - Dividers between rows for visual separation
 *
 * @example
 * <DenominationGrid />
 */

import { useTranslation } from 'react-i18next';
import { DenominationItem } from '@/components/molecules/DenominationItem/DenominationItem';
import { SummaryLine } from '@/components/molecules/SummaryLine/SummaryLine';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import { DENOMINATIONS } from '@/config/currency';
import { Icon } from '@/components/atoms/Icon/Icon';

const BANKNOTES = DENOMINATIONS.filter((d) => d.valueInCents >= 500);
const COINS = DENOMINATIONS.filter((d) => d.valueInCents < 500);

/**
 * Grid of all 15 EUR denominations with running total.
 * Touch-optimized with 48px+ stepper buttons.
 *
 * @returns section with banknotes, coins, and total summary
 *
 * @example
 * <DenominationGrid />
 */
export function DenominationGrid() {
  const { t } = useTranslation(['common', 'screens']);
  const { session, totalInCents, setDenominationQuantity } = useTipCalculator();

  function getQuantity(denominationId: string): number {
    return session.denominations.find((d) => d.denominationId === denominationId)?.quantity ?? 0;
  }

  return (
    <div className="space-y-4">
      {/* Banknotes */}
      <div className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Icon name="banknote" size={16} className="text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-secondary">
            {t('screens:cashInput.denominationSection')}
          </h3>
        </div>
        <div className="divide-y divide-border">
          {BANKNOTES.map((denom) => (
            <DenominationItem
              key={denom.id}
              denomination={denom}
              quantity={getQuantity(denom.id)}
              onQuantityChange={setDenominationQuantity}
            />
          ))}
        </div>
      </div>

      {/* Coins */}
      <div className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Icon name="coins" size={16} className="text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-secondary">
            {t('screens:cashInput.coinSection')}
          </h3>
        </div>
        <div className="divide-y divide-border">
          {COINS.map((denom) => (
            <DenominationItem
              key={denom.id}
              denomination={denom}
              quantity={getQuantity(denom.id)}
              onQuantityChange={setDenominationQuantity}
            />
          ))}
        </div>
      </div>

      {/* Running total — Material card, prominent */}
      <div className="rounded-xl bg-accent p-4 shadow-elevation-2">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-accent-foreground">
            {t('common:currency.total')}
          </span>
          <span className="font-mono text-2xl font-bold text-accent-foreground">
            <SummaryLine
              label=""
              amountInCents={totalInCents}
              prominent
              className="text-2xl text-accent-foreground"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
