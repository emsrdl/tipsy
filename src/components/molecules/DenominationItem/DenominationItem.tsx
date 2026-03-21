/**
 * @file src/components/molecules/DenominationItem/DenominationItem.tsx
 * @description DenominationItem molecule — one denomination row in the cash grid.
 *
 * Shows the denomination symbol, a CurrencyInput for the quantity,
 * and the subtotal (symbol × quantity).
 *
 * @example
 * <DenominationItem
 *   denomination={{ id: 'eur_10', valueInCents: 1000, symbol: '€10', labelKey: 'currency.denomination.10' }}
 *   quantity={5}
 *   onQuantityChange={(id, qty) => setQty(id, qty)}
 * />
 */

import { useTranslation } from 'react-i18next'
import { CurrencyInput } from '../CurrencyInput/CurrencyInput'
import { formatEurFromCents } from '@/config/currency'
import { useLocale } from '@/hooks/useLocale'
import type { Denomination } from '@/config/currency'

export interface DenominationItemProps {
  /** The denomination definition. */
  denomination: Denomination
  /** Current quantity. */
  quantity: number
  /** Called when quantity changes. */
  onQuantityChange: (denominationId: string, quantity: number) => void
}

/**
 * One row in the denomination grid.
 *
 * @param props - DenominationItemProps
 * @returns div with symbol, quantity input, and subtotal
 *
 * @example
 * <DenominationItem denomination={d} quantity={qty} onQuantityChange={update} />
 */
export function DenominationItem({ denomination, quantity, onQuantityChange }: DenominationItemProps) {
  const { t } = useTranslation('common')
  const { locale } = useLocale()
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE'

  const subtotalCents = denomination.valueInCents * quantity

  return (
    <div className="flex items-center justify-between gap-4 rounded-md px-3 py-2 even:bg-surface-raised">
      {/* Symbol */}
      <span className="w-12 font-mono font-medium text-text-primary">
        {denomination.symbol}
      </span>

      {/* Quantity input */}
      <CurrencyInput
        value={quantity}
        onChange={(qty) => onQuantityChange(denomination.id, qty)}
        aria-label={`${t(denomination.labelKey)} ${t('currency.denomination.50ct' /* dummy to satisfy i18n, just needs namespace */) ? t(denomination.labelKey) : denomination.symbol} ${t('cashInput.quantityLabel', { ns: 'screens' })}`}
      />

      {/* Subtotal */}
      <span className="w-20 text-right font-mono text-sm text-text-secondary">
        {subtotalCents > 0 ? formatEurFromCents(subtotalCents, fmtLocale) : '—'}
      </span>
    </div>
  )
}
