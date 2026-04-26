/**
 * @file src/components/molecules/ExportDialog/ExportDialog.tsx
 * @description Export/Import dialog — radio-based format selector.
 *
 * Context 'single': CSV and PDF options only (single-shift export from ResultsScreen).
 * Context 'all': CSV, PDF, and JSON Backup (full history export).
 *
 * @example
 * <ExportDialog
 *   isOpen={exportOpen}
 *   onClose={() => setExportOpen(false)}
 *   context="all"
 *   onExportCsv={handleCsv}
 *   onExportPdf={handlePdf}
 *   onExportJson={handleJson}
 * />
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { cn } from '@/lib/utils';

type ExportFormat = 'csv' | 'pdf' | 'json';

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** 'single' = CSV + PDF only. 'all' = CSV + PDF + JSON backup. */
  context: 'all' | 'single';
  onExportCsv: () => void;
  onExportPdf: () => void;
  onExportJson?: () => void;
  isProcessing?: boolean;
}

/**
 * Modal export dialog with format radio selection.
 */
export function ExportDialog({
  isOpen,
  onClose,
  context,
  onExportCsv,
  onExportPdf,
  onExportJson,
  isProcessing = false,
}: ExportDialogProps) {
  const { t } = useTranslation(['common', 'screens']);
  const [selected, setSelected] = useState<ExportFormat>('csv');

  const formats: { id: ExportFormat; label: string; icon: 'file-text' | 'download' }[] = [
    { id: 'csv', label: t('common:actions.exportCsv'), icon: 'file-text' },
    { id: 'pdf', label: t('common:actions.exportPdf'), icon: 'file-text' },
    ...(context === 'all'
      ? [
          {
            id: 'json' as ExportFormat,
            label: t('common:actions.exportJson'),
            icon: 'download' as const,
          },
        ]
      : []),
  ];

  function handleExport() {
    if (selected === 'csv') onExportCsv();
    else if (selected === 'pdf') onExportPdf();
    else if (selected === 'json') onExportJson?.();
    onClose();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('common:actions.export')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setSelected(fmt.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                selected === fmt.id
                  ? 'bg-accent/5 border-accent text-text-primary'
                  : 'hover:border-accent/50 border-border bg-surface-overlay text-text-secondary',
              )}
            >
              <Icon name={fmt.icon} size={16} />
              <span className="flex-1 text-left text-sm font-medium">{fmt.label}</span>
              <div
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border-2',
                  selected === fmt.id ? 'border-accent' : 'border-text-secondary/40',
                )}
              >
                {selected === fmt.id && <div className="h-2 w-2 rounded-full bg-accent" />}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="min-h-12 px-4">
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="button"
            isLoading={isProcessing}
            onClick={handleExport}
            className="min-h-12 flex-1"
          >
            {t('common:actions.export')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
