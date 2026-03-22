/**
 * @file src/hooks/useExport.ts
 * @description Hook for triggering PDF and CSV exports.
 *
 * @see src/lib/exportPdf.ts
 * @see src/lib/exportCsv.ts
 *
 * @example
 * const { exportPdf, exportCsv, isExporting } = useExport()
 */

import { useState, useCallback } from 'react';
import { useLocale } from './useLocale';
import { exportTipsPdf } from '@/lib/exportPdf';
import { exportTipsCsv } from '@/lib/exportCsv';
import type { DistributionResult } from '@/types/session';

export interface UseExportReturn {
  exportPdf: (results: DistributionResult[], title?: string) => void;
  exportCsv: (results: DistributionResult[], filename?: string) => void;
  isExporting: boolean;
  exportError: string | null;
}

/**
 * Provides export actions with loading and error state.
 *
 * @example
 * const { exportPdf, exportCsv } = useExport()
 * <Button onClick={() => exportPdf(results)}>PDF</Button>
 */
export function useExport(): UseExportReturn {
  const { locale } = useLocale();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPdf = useCallback(
    (results: DistributionResult[], title?: string) => {
      setIsExporting(true);
      setExportError(null);
      try {
        exportTipsPdf(results, { locale, ...(title !== undefined ? { title } : {}) });
      } catch {
        setExportError('export.pdfFailed');
      } finally {
        setIsExporting(false);
      }
    },
    [locale],
  );

  const exportCsv = useCallback(
    (results: DistributionResult[], filename?: string) => {
      setIsExporting(true);
      setExportError(null);
      try {
        exportTipsCsv(results, { locale, ...(filename !== undefined ? { filename } : {}) });
      } catch {
        setExportError('export.csvFailed');
      } finally {
        setIsExporting(false);
      }
    },
    [locale],
  );

  return { exportPdf, exportCsv, isExporting, exportError };
}
