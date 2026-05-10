/**
 * @file src/lib/io/exportCsv.ts
 * @description CSV export for tip distribution results.
 *
 * Generates a semicolon-separated CSV file (DE convention) from
 * the distribution results and triggers a browser download.
 *
 * @see src/lib/io/exportPdf.ts for PDF export
 * @see src/types/session.ts for DistributionResult type
 *
 * @example
 * import { exportTipsCsv } from '@/lib/io/exportCsv'
 * exportTipsCsv(results, { locale: 'de', filename: 'trinkgeld.csv', labels: { name: 'Name', group: 'Gruppe', hours: 'Stunden', amount: 'Betrag', kitchen: 'Küche', service: 'Service' } })
 */

import type { DistributionResult } from '@/types/session';
import { formatEurFromCents, toFmtLocale } from '@/lib/format/formatCurrency';

export interface ExportCsvOptions {
  /** BCP 47 locale for number formatting. Defaults to 'de-DE'. */
  locale?: string;
  /** Downloaded file name without extension. Defaults to 'tipsy-export'. */
  filename?: string;
  /** Localized column headers and group labels. */
  labels: {
    name: string;
    group: string;
    hours: string;
    amount: string;
    kitchen: string;
    service: string;
  };
}

/**
 * Generates a CSV string from distribution results and triggers a download.
 *
 * @param results - Array of DistributionResult to export
 * @param options - Locale and filename overrides
 *
 * @example
 * exportTipsCsv(results, { locale: 'de', filename: 'schicht-2024', labels: { name: 'Name', group: 'Gruppe', hours: 'Stunden', amount: 'Betrag', kitchen: 'Küche', service: 'Service' } })
 */
export function exportTipsCsv(results: DistributionResult[], options: ExportCsvOptions): void {
  const locale = toFmtLocale(options.locale ?? 'de');
  const filename = `${options.filename ?? 'tipsy-export'}.csv`;
  const l = options.labels;

  const header = `${l.name};${l.group};${l.hours};${l.amount}\n`;
  const rows = results
    .map((r) =>
      [
        r.name,
        r.group === 'kitchen' ? l.kitchen : l.service,
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
