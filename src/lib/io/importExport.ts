/**
 * @file src/lib/io/importExport.ts
 * @description Import/export functions for shift data.
 *
 * Supports three formats:
 * - CSV: human-readable, semicolon-separated, one row per employee per shift
 * - PDF: print-ready HTML via browser print dialog
 * - JSON: internal backup format with full shift data and dedup on import
 *
 * @see src/types/shift.ts for Shift, ImportResult types
 * @see src/lib/format/formatCurrency.ts for EUR formatting
 */

import { formatEurFromCents } from '@/lib/format/formatCurrency';
import type { Shift, ImportResult } from '@/types/shift';

/**
 * Exports shifts to a semicolon-separated CSV string.
 * Headers: Date, Employee, Role, Hours, Amount (€), Notes
 *
 * @param shifts - Array of shifts to export
 * @param locale - BCP 47 locale for formatting. Defaults to 'de-DE'.
 * @returns CSV string with UTF-8 BOM
 *
 * @example
 * const csv = exportShiftsCsv(shifts)
 * // "Date;Employee;Role;Hours;Amount (€);Notes\n2026-03-21;Anna;Service;8;€36,40;Smart Split\n..."
 */
export function exportShiftsCsv(shifts: Shift[], locale = 'de-DE'): string {
  const fmtLocale = locale.startsWith('en') ? 'en-US' : 'de-DE';
  const header = 'Date;Employee;Role;Hours;Amount (€);Notes\n';

  const rows: string[] = [];

  for (const shift of shifts) {
    const date = shift.date.split('T')[0] ?? shift.date;
    const mode = shift.smartSplitting ? 'Smart Split' : 'Normal';

    for (const share of shift.distribution.personShares) {
      const denomNote = buildDenominationNote(shift, share.id, fmtLocale);
      const notes = denomNote ? `${mode} [${denomNote}]` : mode;

      rows.push(
        [
          date,
          share.name,
          share.role === 'kitchen' ? 'Küche' : 'Service',
          share.hoursWorked.toString(),
          formatEurFromCents(share.actualShareInCents, fmtLocale),
          notes,
        ].join(';'),
      );
    }
  }

  return '\uFEFF' + header + rows.join('\n');
}

/**
 * Triggers a CSV file download in the browser.
 *
 * @param shifts - Shifts to export
 * @param filename - File name without extension
 * @param locale - BCP 47 locale
 */
export function downloadShiftsCsv(
  shifts: Shift[],
  filename = 'tipsy-shifts',
  locale = 'de-DE',
): void {
  const csv = exportShiftsCsv(shifts, locale);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/**
 * Opens a print-ready window with formatted shift data.
 *
 * @param shifts - Shifts to print/export as PDF
 * @param locale - BCP 47 locale
 * @param title - Document title
 */
export function exportShiftsPdf(
  shifts: Shift[],
  locale = 'de-DE',
  title = 'Tipsy — Schichtübersicht',
): void {
  const fmtLocale = locale.startsWith('en') ? 'en-US' : 'de-DE';
  const lang = locale.startsWith('de') ? 'de' : 'en';

  const shiftBlocks = shifts.map((shift) => {
    const date = new Date(shift.date).toLocaleDateString(fmtLocale);
    const mode = shift.smartSplitting ? 'Smart Split' : 'Normal';
    const total = formatEurFromCents(shift.totalTipsInCents, fmtLocale);

    const rows = shift.distribution.personShares
      .map(
        (s) => `<tr>
          <td>${escapeHtml(s.name)}</td>
          <td>${s.role === 'kitchen' ? 'Küche' : 'Service'}</td>
          <td>${s.hoursWorked}</td>
          <td>${formatEurFromCents(s.actualShareInCents, fmtLocale)}</td>
        </tr>`,
      )
      .join('');

    return `
      <div class="shift">
        <h2>${date} — ${mode}</h2>
        <table>
          <thead><tr><th>Name</th><th>Gruppe</th><th>Stunden</th><th>Betrag</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="total"><td colspan="3">Gesamt</td><td>${total}</td></tr></tfoot>
        </table>
      </div>`;
  });

  // Summary stats
  const totalShifts = shifts.length;
  const totalTips = shifts.reduce((s, sh) => s + sh.totalTipsInCents, 0);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin: 16px 0 8px; }
    .summary { font-size: 11px; color: #555; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .total td { font-weight: bold; border-top: 2px solid #000; }
    .shift { page-break-inside: avoid; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="summary">${totalShifts} Schichten — Gesamt: ${formatEurFromCents(totalTips, fmtLocale)}</p>
  ${shiftBlocks.join('')}
  <script>window.onload = () => { window.print(); window.close(); }</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Exports shifts as a JSON backup string.
 * Includes all shift data with IDs for dedup on import.
 *
 * @param shifts - Shifts to export
 * @returns JSON string of the shift array
 *
 * @example
 * const json = exportBackupJson(shifts)
 * downloadFile(new Blob([json]), 'backup.json')
 */
export function exportBackupJson(shifts: Shift[]): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      shifts,
    },
    null,
    2,
  );
}

/**
 * Triggers a JSON backup file download.
 *
 * @param shifts - Shifts to export
 * @param filename - File name without extension
 */
export function downloadBackupJson(shifts: Shift[], filename = 'tipsy-backup'): void {
  const json = exportBackupJson(shifts);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, `${filename}.json`);
}

/**
 * Imports shifts from a JSON backup string.
 * Deduplicates by shift ID — existing shifts are skipped.
 *
 * @param json - JSON string from exportBackupJson
 * @param existingIds - Set of existing shift IDs to check for duplicates
 * @returns Import result with counts of added, skipped, and errors
 *
 * @example
 * const result = importShiftsJson(jsonStr, new Set(existingShifts.map(s => s.id)))
 * console.log(`Added: ${result.added}, Skipped: ${result.skipped}`)
 */
export function importShiftsJson(
  json: string,
  existingIds: Set<string>,
): { shifts: Shift[]; result: ImportResult } {
  const result: ImportResult = { added: 0, skipped: 0, errors: [] };
  const newShifts: Shift[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    result.errors.push('Invalid JSON format');
    return { shifts: newShifts, result };
  }

  // Support both raw array and { version, shifts } wrapper
  let shiftsArray: unknown[];
  if (Array.isArray(parsed)) {
    shiftsArray = parsed;
  } else if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'shifts' in parsed &&
    Array.isArray((parsed as Record<string, unknown>).shifts)
  ) {
    shiftsArray = (parsed as Record<string, unknown>).shifts as unknown[];
  } else {
    result.errors.push('Expected array of shifts or { shifts: [...] } object');
    return { shifts: newShifts, result };
  }

  for (let i = 0; i < shiftsArray.length; i++) {
    const item = shiftsArray[i];

    if (!isValidShift(item)) {
      result.errors.push(`Invalid shift at index ${i}`);
      continue;
    }

    const shift = item as Shift;

    if (existingIds.has(shift.id)) {
      result.skipped++;
      continue;
    }

    newShifts.push(shift);
    result.added++;
  }

  return { shifts: newShifts, result };
}

/**
 * Validates that an unknown value has the shape of a Shift.
 * Checks required fields and their types — not deep validation.
 *
 * @internal
 */
function isValidShift(value: unknown): value is Shift {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    obj.id.length > 0 &&
    typeof obj.date === 'string' &&
    typeof obj.kitchenPercent === 'number' &&
    Array.isArray(obj.employees) &&
    typeof obj.totalTipsInCents === 'number' &&
    Array.isArray(obj.denominationInput) &&
    typeof obj.distribution === 'object' &&
    obj.distribution !== null &&
    typeof obj.smartSplitting === 'boolean' &&
    Array.isArray(obj.differences) &&
    typeof obj.savedAt === 'string'
  );
}

/**
 * Builds a denomination note string for CSV export.
 * Shows which denominations a person received.
 *
 * @internal
 */
function buildDenominationNote(shift: Shift, employeeId: string, locale: string): string {
  if (!shift.smartSplitting) return '';

  const share = shift.distribution.personShares.find((s) => s.id === employeeId);
  if (!share || share.deviationInCents === 0) return '';

  const deviation = share.deviationInCents;
  const sign = deviation > 0 ? '+' : '';
  return `${sign}${formatEurFromCents(deviation, locale)} deviation`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
