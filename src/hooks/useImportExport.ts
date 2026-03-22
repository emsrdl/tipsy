/**
 * @file src/hooks/useImportExport.ts
 * @description Hook for shift import/export operations.
 *
 * Wraps the importExport library functions with loading/error state
 * and integrates with useShifts for persistence.
 *
 * @see src/lib/importExport.ts for the underlying functions
 * @see src/hooks/useShifts.ts for shift persistence
 *
 * @example
 * const { exportCsv, exportPdf, exportJson, importJson } = useImportExport()
 */

import { useState, useCallback } from 'react';
import { useShifts } from './useShifts';
import { useLocale } from './useLocale';
import {
  downloadShiftsCsv,
  exportShiftsPdf,
  downloadBackupJson,
  importShiftsJson,
} from '@/lib/importExport';
import type { ImportResult, Shift } from '@/types/shift';

export interface UseImportExportReturn {
  /** Export shifts as CSV download. */
  exportCsv: () => void;
  /** Export shifts as PDF (opens print dialog). */
  exportPdf: () => void;
  /** Export shifts as JSON backup download. */
  exportJson: () => void;
  /**
   * Import shifts from JSON string. Returns import result.
   * @param profileId - If provided, all imported shifts are reassigned to this profile.
   */
  importJson: (json: string, profileId?: string | null) => ImportResult;
  /** Whether an export/import operation is in progress. */
  isProcessing: boolean;
  /** Last error message, or null. */
  error: string | null;
}

/**
 * Hook for import/export operations on shift data.
 *
 * @param exportShifts - Optional subset of shifts to export. Defaults to all shifts.
 */
export function useImportExport(exportShifts?: Shift[]): UseImportExportReturn {
  const { shifts: allShifts, addShifts } = useShifts();
  const { locale } = useLocale();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shifts = exportShifts ?? allShifts;
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';

  const exportCsv = useCallback(() => {
    try {
      setIsProcessing(true);
      setError(null);
      downloadShiftsCsv(shifts, undefined, fmtLocale);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'export.csvFailed');
    } finally {
      setIsProcessing(false);
    }
  }, [shifts, fmtLocale]);

  const exportPdf = useCallback(() => {
    try {
      setIsProcessing(true);
      setError(null);
      exportShiftsPdf(shifts, fmtLocale);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'export.pdfFailed');
    } finally {
      setIsProcessing(false);
    }
  }, [shifts, fmtLocale]);

  const exportJson = useCallback(() => {
    try {
      setIsProcessing(true);
      setError(null);
      downloadBackupJson(shifts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'export.csvFailed');
    } finally {
      setIsProcessing(false);
    }
  }, [shifts]);

  const importJson = useCallback(
    (json: string, profileId?: string | null): ImportResult => {
      setError(null);
      const existingIds = new Set(allShifts.map((s) => s.id));
      const { shifts: newShifts, result } = importShiftsJson(json, existingIds);

      if (result.errors.length > 0) {
        setError(result.errors[0] ?? 'Import failed');
      }

      if (newShifts.length > 0) {
        const toAdd =
          profileId !== undefined
            ? newShifts.map((s) => ({ ...s, profileId: profileId ?? null }))
            : newShifts;
        addShifts(toAdd);
      }

      return result;
    },
    [allShifts, addShifts],
  );

  return { exportCsv, exportPdf, exportJson, importJson, isProcessing, error };
}
