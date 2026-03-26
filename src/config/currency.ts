/**
 * @file src/config/currency.ts
 * @description EUR denomination definitions and currency formatting.
 *
 * DENOMINATIONS is the authoritative ordered list of EUR cash denominations
 * used in the denomination grid. Order is descending by value (€500 → 1ct).
 *
 * @see src/lib/format/formatCurrency.ts for the formatEurFromCents implementation
 * @see src/components/organisms/DenominationGrid for the UI using this list
 *
 * @example
 * import { DENOMINATIONS, formatEurFromCents } from '@/config/currency'
 * const total = DENOMINATIONS.reduce((sum, d) => sum + d.valueInCents * qty[d.id], 0)
 * console.log(formatEurFromCents(total)) // "€12,50"
 */

import { formatEurFromCents } from '@/lib/format/formatCurrency';

/**
 * A single EUR denomination with its metadata.
 *
 * @property id - Unique key used in DenominationQuantity.denominationId
 * @property valueInCents - Integer value in euro cents (e.g. 50000 for €500)
 * @property labelKey - i18n key for the display label
 * @property symbol - Short display string shown in the UI
 */
export interface Denomination {
  id: string;
  valueInCents: number;
  labelKey: string;
  symbol: string;
}

/**
 * All 15 EUR denominations in descending order.
 * Covers banknotes (€500 down to €5) and coins (€2 down to 1ct).
 */
export const DENOMINATIONS: Denomination[] = [
  { id: 'eur_500', valueInCents: 50000, labelKey: 'currency.denomination.500', symbol: '€500' },
  { id: 'eur_200', valueInCents: 20000, labelKey: 'currency.denomination.200', symbol: '€200' },
  { id: 'eur_100', valueInCents: 10000, labelKey: 'currency.denomination.100', symbol: '€100' },
  { id: 'eur_50', valueInCents: 5000, labelKey: 'currency.denomination.50', symbol: '€50' },
  { id: 'eur_20', valueInCents: 2000, labelKey: 'currency.denomination.20', symbol: '€20' },
  { id: 'eur_10', valueInCents: 1000, labelKey: 'currency.denomination.10', symbol: '€10' },
  { id: 'eur_5', valueInCents: 500, labelKey: 'currency.denomination.5', symbol: '€5' },
  { id: 'eur_2', valueInCents: 200, labelKey: 'currency.denomination.2', symbol: '€2' },
  { id: 'eur_1', valueInCents: 100, labelKey: 'currency.denomination.1', symbol: '€1' },
  { id: 'eur_50ct', valueInCents: 50, labelKey: 'currency.denomination.50ct', symbol: '50 ct' },
  { id: 'eur_20ct', valueInCents: 20, labelKey: 'currency.denomination.20ct', symbol: '20 ct' },
  { id: 'eur_10ct', valueInCents: 10, labelKey: 'currency.denomination.10ct', symbol: '10 ct' },
  { id: 'eur_5ct', valueInCents: 5, labelKey: 'currency.denomination.5ct', symbol: '5 ct' },
  { id: 'eur_2ct', valueInCents: 2, labelKey: 'currency.denomination.2ct', symbol: '2 ct' },
  { id: 'eur_1ct', valueInCents: 1, labelKey: 'currency.denomination.1ct', symbol: '1 ct' },
];

// Re-export for convenience — consumers can import both from this module
export { formatEurFromCents };
