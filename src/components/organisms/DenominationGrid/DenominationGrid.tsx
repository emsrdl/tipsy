/**
 * @file src/components/organisms/DenominationGrid/DenominationGrid.tsx
 * @description DenominationGrid organism — full denomination input grid.
 *
 * Renders all 15 EUR denominations in two groups (banknotes / coins).
 * Shows a running total at the bottom.
 *
 * @example
 * <DenominationGrid />
 */

import { useTranslation } from 'react-i18next'
import { DenominationItem } from '@/components/molecules/DenominationItem/DenominationItem'
import { SummaryLine } from '@/components/molecules/SummaryLine/SummaryLine'
import { useTipCalculator } from '@/hooks/useTipCalculator'
import { DENOMINATIONS } from '@/config/currency'

// Denominations split: banknotes (≥ €5) and coins (< €5)
const BANKNOTES = DENOMINATIONS.filter((d) => d.valueInCents >= 500)
const COINS = DENOMINATIONS.filter((d) => d.valueInCents < 500)

/**
 * Grid of all 15 EUR denomination inputs with running total.
 *
 * @returns section element
 *
 * @example
 * <DenominationGrid />
 */
export function DenominationGrid() {
  const { t } = useTranslation(['common', 'screens'])
  const { session, totalInCents, setDenominationQuantity } = useTipCalculator()

  function getQuantity(denominationId: string): number {
    return session.denominations.find((d) => d.denominationId === denominationId)?.quantity ?? 0
  }

  return (
    <div className="space-y-4">
      {/* Banknotes */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-text-secondary">
          {t('screens:cashInput.denominationSection')}
        </h3>
        <div className="rounded-md border border-border overflow-hidden">
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
      <div>
        <h3 className="mb-2 text-sm font-medium text-text-secondary">
          {t('screens:cashInput.coinSection')}
        </h3>
        <div className="rounded-md border border-border overflow-hidden">
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

      {/* Running total */}
      <div className="rounded-md border border-border bg-surface-raised p-3">
        <SummaryLine
          label={t('common:currency.total')}
          amountInCents={totalInCents}
          prominent
        />
      </div>
    </div>
  )
}
