/**
 * @file src/lib/io/export.ts
 * @description Export utility functions — format data for PDF/CSV output.
 *
 * These are pure data-preparation functions. The actual file download
 * and browser interactions are in src/lib/io/exportPdf.ts and src/lib/io/exportCsv.ts.
 *
 * @see src/lib/io/exportPdf.ts for PDF rendering and download trigger
 * @see src/lib/io/exportCsv.ts for CSV generation and download trigger
 * @see src/hooks/useExport.ts for the React hook wrapping these
 *
 * @example
 * import { formatResultsForExport, buildCsvString } from '@/lib/io/export'
 */

import type { DistributionResult } from '@/types/session';
import type { EmployeePayoutPlan } from '@/types/calculation';
import { formatEurFromCents } from '@/lib/format/formatCurrency';

/**
 * A single row of export data, ready for CSV or PDF rendering.
 *
 * @property name - Employee display name
 * @property group - "Küche" or "Service" (localized)
 * @property hours - Hours worked (as string)
 * @property amount - Formatted EUR amount string
 * @property perHour - Formatted per-hour rate (optional)
 */
export interface ExportRow {
  name: string;
  group: string;
  hours: string;
  amount: string;
  perHour: string;
}

/**
 * Formats distribution results into export-ready rows.
 *
 * @param results - The distribution results to format
 * @param locale - Formatting locale ('de-DE' or 'en-US')
 * @param groupLabels - Localized labels for kitchen/service
 * @returns Array of ExportRow objects
 *
 * @example
 * const rows = formatResultsForExport(
 *   results,
 *   'de-DE',
 *   { kitchen: 'Küche', service: 'Service' }
 * )
 */
export function formatResultsForExport(
  results: DistributionResult[],
  locale: string,
  groupLabels: { kitchen: string; service: string },
): ExportRow[] {
  return results.map((r) => ({
    name: r.name,
    group: r.group === 'kitchen' ? groupLabels.kitchen : groupLabels.service,
    hours: r.hours.toString(),
    amount: formatEurFromCents(r.amountInCents, locale),
    perHour: r.hours > 0 ? formatEurFromCents(Math.round(r.amountInCents / r.hours), locale) : '—',
  }));
}

/**
 * Builds a semicolon-separated CSV string from export rows.
 * Fields containing `;`, `"`, or newlines are quoted per RFC 4180.
 *
 * @param rows - Export rows to convert
 * @param headers - Column headers (localized)
 * @returns CSV string without BOM — caller adds BOM if needed (e.g. for Excel)
 *
 * @example
 * const csv = buildCsvString(
 *   rows,
 *   { name: 'Name', group: 'Gruppe', hours: 'Stunden', amount: 'Betrag', perHour: 'Pro Stunde' }
 * )
 */
export function buildCsvString(
  rows: ExportRow[],
  headers: { name: string; group: string; hours: string; amount: string; perHour: string },
): string {
  const escape = (v: string) => (/[;"'\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const headerLine = [
    headers.name,
    headers.group,
    headers.hours,
    headers.amount,
    headers.perHour,
  ]
    .map(escape)
    .join(';');
  const dataLines = rows.map((r) =>
    [r.name, r.group, r.hours, r.amount, r.perHour].map(escape).join(';'),
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Builds a summary text block for the export footer.
 *
 * @param results - Distribution results
 * @param locale - Formatting locale
 * @returns Object with kitchen total, service total, and grand total as formatted strings
 *
 * @example
 * const summary = buildExportSummary(results, 'de-DE')
 * // { kitchenTotal: '30,00 €', serviceTotal: '70,00 €', grandTotal: '100,00 €' }
 */
export function buildExportSummary(
  results: DistributionResult[],
  locale: string,
): { kitchenTotal: string; serviceTotal: string; grandTotal: string } {
  const kitchenCents = results
    .filter((r) => r.group === 'kitchen')
    .reduce((s, r) => s + r.amountInCents, 0);
  const serviceCents = results
    .filter((r) => r.group === 'service')
    .reduce((s, r) => s + r.amountInCents, 0);

  return {
    kitchenTotal: formatEurFromCents(kitchenCents, locale),
    serviceTotal: formatEurFromCents(serviceCents, locale),
    grandTotal: formatEurFromCents(kitchenCents + serviceCents, locale),
  };
}

/**
 * Formats payout plans (with denomination details) for detailed export.
 * Includes which physical bills/coins each employee receives.
 *
 * @param payouts - Per-employee payout plans from the denomination matcher
 * @param locale - Formatting locale
 * @returns Array of formatted strings, one per employee
 *
 * @example
 * const lines = formatPayoutDetails(payouts, 'de-DE')
 * // ["Anna: 2×€20 + 1×€5 + 1×€2 = 47,00 €", ...]
 */
export function formatPayoutDetails(payouts: EmployeePayoutPlan[], locale: string): string[] {
  return payouts.map((p) => {
    const parts = p.assignments
      .filter((a) => a.count > 0)
      .map((a) => `${a.count}×${a.denominationId.replace('eur_', '€').replace('ct', ' ct')}`)
      .join(' + ');
    const total = formatEurFromCents(p.actualAmountInCents, locale);
    return `${p.name}: ${parts || '—'} = ${total}`;
  });
}
