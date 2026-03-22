/**
 * @file src/lib/formatCurrency.ts
 * @description EUR currency formatting utilities.
 *
 * All monetary values in the app are stored as integer euro cents
 * to avoid floating-point precision issues. This module handles
 * conversion to display strings.
 *
 * @see src/config/currency.ts which re-exports formatEurFromCents
 *
 * @example
 * formatEurFromCents(1250)       // "€12,50" (de-DE locale)
 * formatEurFromCents(0)          // "€0,00"
 * formatEurFromCents(1000000)    // "€10.000,00"
 */

/**
 * Formats an integer euro cent amount into a locale-aware EUR string.
 *
 * Uses Intl.NumberFormat with 'de-DE' locale by default (the app's primary
 * locale). Pass a locale override when rendering in English mode.
 *
 * @param cents - Integer euro cent amount (e.g. 1250 = €12.50)
 * @param locale - BCP 47 locale string. Defaults to 'de-DE'.
 * @returns Formatted currency string (e.g. "€12,50")
 *
 * @example
 * formatEurFromCents(4599)         // "€45,99"
 * formatEurFromCents(4599, 'en-US') // "€45.99"
 */
export function formatEurFromCents(cents: number, locale: string = 'de-DE'): string {
  const euros = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Parses a user-entered string to an integer cent value.
 * Accepts both comma (DE) and dot (EN) as decimal separator.
 * Returns null if the string is not a valid positive number.
 *
 * @param value - Raw user input (e.g. "12,50" or "12.50")
 * @returns Integer cents, or null if invalid
 *
 * @example
 * parseCentsFromInput("12,50") // 1250
 * parseCentsFromInput("12.5")  // 1250
 * parseCentsFromInput("abc")   // null
 * parseCentsFromInput("-1")    // null
 */
export function parseCentsFromInput(value: string): number | null {
  // Normalize: replace comma decimal separator with dot
  const normalized = value.trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}
