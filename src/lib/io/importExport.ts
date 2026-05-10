/**
 * @file src/lib/io/importExport.ts
 * @description Import/export functions for shift data.
 *
 * Supports three formats:
 * - CSV: human-readable, semicolon-separated, one row per employee per shift
 * - PDF: print-ready HTML via browser print dialog
 * - JSON: internal backup format (v2) with full shift data and dedup on import
 *
 * All labels are localized based on the `locale` parameter (de-DE or en-US).
 *
 * @see src/types/shift.ts for Shift, ImportResult types
 * @see src/lib/format/formatCurrency.ts for EUR formatting
 */

import {
  formatEurFromCents,
  formatSignedEurFromCents,
  toFmtLocale,
} from '@/lib/format/formatCurrency';
import type { Shift, ImportResult } from '@/types/shift';

/* ------------------------------------------------------------------ */
/*  Localized label maps                                              */
/* ------------------------------------------------------------------ */

interface ExportLabels {
  date: string;
  employee: string;
  role: string;
  hours: string;
  ideal: string;
  amount: string;
  deviation: string;
  transfer: string;
  mode: string;
  kitchen: string;
  service: string;
  total: string;
  group: string;
  shifts: string;
  fairnessScore: string;
  transfers: string;
  shiftOverview: string;
  pays: string;
  receives: string;
}

function getLabels(locale: string): ExportLabels {
  if (locale.startsWith('de')) {
    return {
      date: 'Datum',
      employee: 'Mitarbeiter',
      role: 'Rolle',
      hours: 'Stunden',
      ideal: 'Ideal (€)',
      amount: 'Betrag (€)',
      deviation: 'Abweichung (€)',
      transfer: 'Ausgleichszahlung',
      mode: 'Modus',
      kitchen: 'Küche',
      service: 'Service',
      total: 'Gesamt',
      group: 'Gruppe',
      shifts: 'Schichten',
      fairnessScore: 'Fairness-Score',
      transfers: 'Ausgleichszahlungen',
      shiftOverview: 'Schichtübersicht',
      pays: 'zahlt',
      receives: 'bekommt',
    };
  }
  return {
    date: 'Date',
    employee: 'Employee',
    role: 'Role',
    hours: 'Hours',
    ideal: 'Ideal (€)',
    amount: 'Amount (€)',
    deviation: 'Deviation (€)',
    transfer: 'Transfer',
    mode: 'Mode',
    kitchen: 'Kitchen',
    service: 'Service',
    total: 'Total',
    group: 'Group',
    shifts: 'Shifts',
    fairnessScore: 'Fairness Score',
    transfers: 'Transfers',
    shiftOverview: 'Shift Overview',
    pays: 'pays',
    receives: 'receives',
  };
}

/* ------------------------------------------------------------------ */
/*  CSV Export                                                        */
/* ------------------------------------------------------------------ */

/**
 * Exports shifts to a semicolon-separated CSV string.
 * Columns: Date, Employee, Role, Hours, Ideal, Amount, Deviation, Transfer, Mode
 * User-supplied fields (name, transfer note, deviation) are CSV-escaped to prevent
 * delimiter collisions and formula injection in spreadsheet apps.
 *
 * @param shifts - Array of shifts to export
 * @param locale - BCP 47 locale for formatting. Defaults to 'de-DE'.
 * @returns CSV string with UTF-8 BOM
 */
export function exportShiftsCsv(shifts: Shift[], locale = 'de-DE'): string {
  const fmtLocale = toFmtLocale(locale);
  const l = getLabels(locale);

  const header = [
    l.date,
    l.employee,
    l.role,
    l.hours,
    l.ideal,
    l.amount,
    l.deviation,
    l.transfer,
    l.mode,
  ].join(';');

  const rows: string[] = [];

  for (const shift of shifts) {
    const date = shift.date.split('T')[0] ?? shift.date;
    const mode = shift.smartSplitting ? 'Smart Split' : 'Normal';

    for (const share of shift.distribution.personShares) {
      const transferNote = buildTransferNote(shift, share.id, fmtLocale, l);
      const deviation = formatSignedEurFromCents(share.deviationInCents, fmtLocale);

      rows.push(
        [
          date,
          csvEscape(share.name),
          share.role === 'kitchen' ? l.kitchen : l.service,
          share.hoursWorked.toString(),
          formatEurFromCents(share.idealShareInCents, fmtLocale),
          formatEurFromCents(share.actualShareInCents, fmtLocale),
          csvEscape(deviation),
          csvEscape(transferNote),
          mode,
        ].join(';'),
      );
    }
  }

  return '\uFEFF' + header + '\n' + rows.join('\n');
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

/* ------------------------------------------------------------------ */
/*  PDF Export                                                        */
/* ------------------------------------------------------------------ */

/**
 * Opens a print-ready window with formatted shift data.
 *
 * @param shifts - Shifts to print/export as PDF
 * @param locale - BCP 47 locale
 * @param title - Document title (defaults to localized "Tipsy — Shift Overview")
 */
export function exportShiftsPdf(shifts: Shift[], locale = 'de-DE', title?: string): void {
  const fmtLocale = toFmtLocale(locale);
  const lang = locale.startsWith('de') ? 'de' : 'en';
  const l = getLabels(locale);
  const docTitle = title ?? `Tipsy — ${l.shiftOverview}`;

  const shiftBlocks = shifts.map((shift) => {
    const date = new Date(shift.date).toLocaleDateString(fmtLocale);
    const mode = shift.smartSplitting ? 'Smart Split' : 'Normal';
    const total = formatEurFromCents(shift.totalTipsInCents, fmtLocale);

    const tableRows = shift.distribution.personShares
      .map(
        (s) => `<tr>
          <td>${escapeHtml(s.name)}</td>
          <td>${s.role === 'kitchen' ? l.kitchen : l.service}</td>
          <td>${s.hoursWorked}</td>
          <td>${formatEurFromCents(s.idealShareInCents, fmtLocale)}</td>
          <td>${formatEurFromCents(s.actualShareInCents, fmtLocale)}</td>
          <td>${formatSignedEurFromCents(s.deviationInCents, fmtLocale)}</td>
        </tr>`,
      )
      .join('');

    const transferBlock =
      shift.differences.length > 0
        ? `<div class="transfers"><h3>${l.transfers}</h3><ul>${shift.differences
            .map(
              (d) =>
                `<li>${escapeHtml(d.fromPerson.name)} → ${escapeHtml(d.toPerson.name)}: ${formatEurFromCents(d.amountInCents, fmtLocale)}</li>`,
            )
            .join('')}</ul></div>`
        : '';

    const fairnessBlock = shift.smartSplitting
      ? `<p class="fairness">${l.fairnessScore}: ${shift.distribution.fairnessScore}%</p>`
      : '';

    return `
      <div class="shift">
        <h2>${date} — ${mode}</h2>
        <table>
          <thead><tr>
            <th>${l.employee}</th><th>${l.group}</th><th>${l.hours}</th>
            <th>${l.ideal}</th><th>${l.amount}</th><th>${l.deviation}</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
          <tfoot><tr class="total"><td colspan="5">${l.total}</td><td>${total}</td></tr></tfoot>
        </table>
        ${fairnessBlock}
        ${transferBlock}
      </div>`;
  });

  const totalShifts = shifts.length;
  const totalTips = shifts.reduce((s, sh) => s + sh.totalTipsInCents, 0);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(docTitle)}</title>
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
    .fairness { font-size: 11px; color: #555; margin: 8px 0 4px; }
    .transfers { margin: 8px 0; }
    .transfers h3 { font-size: 12px; margin: 0 0 4px; }
    .transfers ul { margin: 0; padding-left: 18px; font-size: 11px; }
    .transfers li { margin-bottom: 2px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(docTitle)}</h1>
  <p class="summary">${totalShifts} ${l.shifts} — ${l.total}: ${formatEurFromCents(totalTips, fmtLocale)}</p>
  ${shiftBlocks.join('')}
  <script>window.onload = () => { window.print(); window.close(); }</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}

/* ------------------------------------------------------------------ */
/*  JSON Export / Import                                               */
/* ------------------------------------------------------------------ */

/**
 * Exports shifts as a JSON backup string.
 * Version 2 format with full shift data for future compatibility.
 *
 * @param shifts - Shifts to export
 * @returns JSON string with version, timestamp, and shift array
 */
export function exportBackupJson(shifts: Shift[]): string {
  return JSON.stringify(
    {
      version: 2,
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
 * Supports both v1 and v2 backup formats.
 *
 * @param json - JSON string from exportBackupJson
 * @param existingIds - Set of existing shift IDs to check for duplicates
 * @returns Import result with counts of added, skipped, and errors
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

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                  */
/* ------------------------------------------------------------------ */

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
 * Builds a localized transfer note for CSV export.
 * Shows transfers involving a specific employee.
 *
 * @internal
 */
function buildTransferNote(
  shift: Shift,
  employeeId: string,
  fmtLocale: string,
  labels: ExportLabels,
): string {
  const parts: string[] = [];
  for (const diff of shift.differences) {
    if (diff.fromPerson.id === employeeId) {
      parts.push(
        `${labels.pays} ${formatEurFromCents(diff.amountInCents, fmtLocale)} → ${diff.toPerson.name}`,
      );
    } else if (diff.toPerson.id === employeeId) {
      parts.push(
        `${labels.receives} ${formatEurFromCents(diff.amountInCents, fmtLocale)} ← ${diff.fromPerson.name}`,
      );
    }
  }
  return parts.join(', ');
}

/**
 * Escapes a value for semicolon-delimited CSV output.
 * - Neutralizes formula injection (values starting with `= + - @ \t \r`)
 * - Wraps in double-quotes and escapes inner quotes when the value contains
 *   the delimiter (`;`), double-quotes, or line breaks.
 *
 * @internal
 */
function csvEscape(value: string): string {
  const sanitized = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[;"\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
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
