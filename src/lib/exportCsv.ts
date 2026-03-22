/**
 * @file src/lib/exportCsv.ts
 * @description CSV export for tip distribution results.
 *
 * Generates a semicolon-separated CSV file (DE convention) from
 * the distribution results and triggers a browser download.
 *
 * @see src/lib/exportPdf.ts for PDF export
 * @see src/types/session.ts for DistributionResult type
 *
 * @example
 * import { exportTipsCsv } from '@/lib/exportCsv'
 * exportTipsCsv(results, { locale: 'de', filename: 'trinkgeld.csv' })
 */

import type { DistributionResult } from '@/types/session';
import { formatEurFromCents } from './formatCurrency';

export interface ExportCsvOptions {
  /** BCP 47 locale for number formatting. Defaults to 'de-DE'. */
  locale?: string;
  /** Downloaded file name without extension. Defaults to 'tipsy-export'. */
  filename?: string;
}

/**
 * Generates a CSV string from distribution results and triggers a download.
 *
 * @param results - Array of DistributionResult to export
 * @param options - Locale and filename overrides
 *
 * @example
 * exportTipsCsv(results, { locale: 'de', filename: 'schicht-2024' })
 */
export function exportTipsCsv(results: DistributionResult[], options: ExportCsvOptions = {}): void {
  const locale = options.locale === 'en' ? 'en-US' : 'de-DE';
  const filename = `${options.filename ?? 'tipsy-export'}.csv`;

  const header = 'Name;Gruppe;Stunden;Betrag\n';
  const rows = results
    .map((r) =>
      [
        r.name,
        r.group === 'kitchen' ? 'Küche' : 'Service',
        r.hours.toString(),
        formatEurFromCents(r.amountInCents, locale),
      ].join(';'),
    )
    .join('\n');

  const csv = header + rows;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
