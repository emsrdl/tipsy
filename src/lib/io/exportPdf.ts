/**
 * @file src/lib/io/exportPdf.ts
 * @description PDF export for tip distribution results.
 *
 * Uses the browser's print dialog with a print-optimized layout,
 * avoiding a heavy PDF library dependency. A dedicated print stylesheet
 * hides non-essential UI and formats the results table cleanly.
 *
 * This is a lightweight approach — opens a new window with formatted HTML
 * and calls window.print(). The OS print dialog handles PDF saving.
 *
 * @see src/lib/io/exportCsv.ts for CSV export
 * @see src/types/session.ts for DistributionResult type
 *
 * @example
 * import { exportTipsPdf } from '@/lib/io/exportPdf'
 * exportTipsPdf(results, { locale: 'de', title: 'Trinkgeld 2024-03-21', labels: { name: 'Name', group: 'Gruppe', hours: 'Stunden', amount: 'Betrag', total: 'Gesamt', kitchen: 'Küche', service: 'Service' } })
 */

import type { DistributionResult } from '@/types/session';
import { formatEurFromCents } from '@/lib/format/formatCurrency';

export interface ExportPdfOptions {
  /** BCP 47 locale for number formatting. Defaults to 'de-DE'. */
  locale?: string;
  /** Document title shown in the print dialog. */
  title?: string;
  /** Localized column headers, group names, and footer label. */
  labels: {
    name: string;
    group: string;
    hours: string;
    amount: string;
    total: string;
    kitchen: string;
    service: string;
  };
}

/**
 * Opens a print-ready window with formatted distribution results.
 *
 * @param results - Array of DistributionResult to print
 * @param options - Locale and title overrides
 *
 * @example
 * exportTipsPdf(results, { title: 'Schicht 21.03.2024', labels: { name: 'Name', group: 'Gruppe', hours: 'Stunden', amount: 'Betrag', total: 'Gesamt', kitchen: 'Küche', service: 'Service' } })
 */
export function exportTipsPdf(results: DistributionResult[], options: ExportPdfOptions): void {
  const locale = options.locale === 'en' ? 'en-US' : 'de-DE';
  const title = options.title ?? 'Tipsy';
  const date = new Date().toLocaleDateString(locale);
  const { labels } = options;

  const totalCents = results.reduce((sum, r) => sum + r.amountInCents, 0);

  const rows = results
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.name)}</td>
      <td>${r.group === 'kitchen' ? labels.kitchen : labels.service}</td>
      <td>${r.hours}</td>
      <td>${formatEurFromCents(r.amountInCents, locale)}</td>
    </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="${locale.startsWith('de') ? 'de' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    p.date { font-size: 11px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .total td { font-weight: bold; border-top: 2px solid #000; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="date">${date}</p>
  <table>
    <thead>
      <tr><th>${labels.name}</th><th>${labels.group}</th><th>${labels.hours}</th><th>${labels.amount}</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr class="total">
        <td colspan="3">${labels.total}</td>
        <td>${formatEurFromCents(totalCents, locale)}</td>
      </tr>
    </tfoot>
  </table>
  <script>window.onload = () => { window.print(); window.close(); }</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('export.pdfFailed'); // Popup blocked
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
