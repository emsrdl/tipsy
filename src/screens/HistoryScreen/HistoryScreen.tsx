/**
 * @file src/screens/HistoryScreen/HistoryScreen.tsx
 * @description History screen — shift history with recharts graphs and import/export.
 *
 * Shows only shifts for the active profile (or guest message if in guest mode).
 *
 * @example
 * // Rendered via React Router at route "/history"
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog/ConfirmDialog';
import { ExportDialog } from '@/components/molecules/ExportDialog/ExportDialog';
import { ImportDialog } from '@/components/molecules/ImportDialog/ImportDialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useShifts } from '@/hooks/useShifts';
import { useImportExport } from '@/hooks/useImportExport';
import { useLocale } from '@/hooks/useLocale';
import { useProfiles } from '@/hooks/useProfiles';
import { useToast } from '@/context/ToastContext';
import { formatEurFromCents } from '@/config/currency';
import { cn } from '@/lib/utils';
import type { Shift } from '@/types/shift';

type GraphMode = 'week' | 'day' | 'hourly';

/** Returns the active profile's personal tip amount for a shift, or total if not found. */
function getProfileAmount(shift: Shift, profileId: string | undefined): number {
  if (!profileId) return shift.totalTipsInCents;
  const myShare = shift.distribution.personShares.find((s) => s.id === `profile-emp-${profileId}`);
  return myShare?.actualShareInCents ?? shift.totalTipsInCents;
}

/** Groups shifts by ISO week key (KWxx). */
function groupByWeek(
  shifts: Shift[],
  getValue: (s: Shift) => number,
): { label: string; totalCents: number }[] {
  const map = new Map<string, number>();
  for (const shift of shifts) {
    const d = new Date(shift.date);
    const year = d.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const key = `KW${week.toString().padStart(2, '0')}`;
    map.set(key, (map.get(key) ?? 0) + getValue(shift));
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, totalCents]) => ({ label, totalCents }));
}

/** Groups shifts by date (MM-DD). */
function groupByDay(
  shifts: Shift[],
  getValue: (s: Shift) => number,
): { label: string; totalCents: number }[] {
  const map = new Map<string, number>();
  for (const shift of shifts) {
    const label = shift.date.split('T')[0] ?? shift.date;
    map.set(label, (map.get(label) ?? 0) + getValue(shift));
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([label, totalCents]) => ({ label: label.slice(5), totalCents }));
}

/** Average hourly rate per shift (last 10). */
function groupByHourly(
  shifts: Shift[],
  getValue: (s: Shift) => number,
): { label: string; totalCents: number }[] {
  return shifts.slice(-10).map((shift) => {
    const totalHours = shift.employees.reduce((s, e) => s + e.hours, 0);
    const ratePerHour = totalHours > 0 ? Math.round(getValue(shift) / totalHours) : 0;
    return {
      label: (shift.date.split('T')[0] ?? '').slice(5),
      totalCents: ratePerHour,
    };
  });
}

function centsToEur(cents: number): number {
  return cents / 100;
}

/**
 * History screen with charts, profile-filtered shift list, and import/export.
 */
export function HistoryScreen() {
  const { t } = useTranslation(['common', 'screens']);
  const { shifts: allShifts, deleteShift } = useShifts();
  const { locale } = useLocale();
  const { activeProfile, isGuestMode } = useProfiles();
  const { showToast } = useToast();
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';

  const [graphMode, setGraphMode] = useState<GraphMode>('week');
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Filter shifts by active profile
  const shifts = isGuestMode
    ? []
    : activeProfile
      ? allShifts.filter((s) => s.profileId === activeProfile.id)
      : allShifts;

  // Export only profile-filtered shifts; import reassigns to active profile
  const { exportCsv, exportPdf, exportJson, importJson, isProcessing } = useImportExport(shifts);

  const myAmount = useCallback(
    (shift: Shift) => getProfileAmount(shift, activeProfile?.id),
    [activeProfile?.id],
  );

  const graphData =
    graphMode === 'week'
      ? groupByWeek(shifts, myAmount)
      : graphMode === 'day'
        ? groupByDay(shifts, myAmount)
        : groupByHourly(shifts, myAmount);

  const totalAllTime = shifts.reduce((s, sh) => s + myAmount(sh), 0);

  const handleFileImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        const result = importJson(json, activeProfile?.id ?? null);
        if (result.errors.length > 0) {
          showToast(t('common:toast.importFailed') + ': ' + result.errors[0], 'error');
        } else if (result.skipped > 0) {
          showToast(
            t('common:toast.importPartial', { added: result.added, skipped: result.skipped }),
            'success',
          );
        } else {
          showToast(t('common:toast.importSuccess', { added: result.added }), 'success');
        }
      };
      reader.readAsText(file);
    },
    [importJson, activeProfile?.id, showToast, t],
  );

  function handleClearHistory() {
    shifts.forEach((shift) => deleteShift(shift.id));
    setConfirmClear(false);
    showToast(t('common:toast.historyCleared'), 'info');
  }

  function handleDeleteShift(id: string) {
    deleteShift(id);
    setConfirmDeleteId(null);
    showToast(t('common:toast.shiftDeleted'), 'info');
  }

  // Guest mode empty state
  if (isGuestMode) {
    return (
      <ScreenContainer title={t('screens:shifts.title')} subtitle={t('screens:shifts.subtitle')}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-overlay">
            <Icon name="user" size={32} className="text-text-secondary" />
          </div>
          <p className="mb-1 text-base font-semibold text-text-primary">
            {t('common:profile.noShiftsGuest')}
          </p>
          <p className="mb-6 text-sm text-text-secondary">{t('common:profile.noShiftsGuestSub')}</p>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={t('screens:shifts.title')} subtitle={t('screens:shifts.subtitle')}>
      {shifts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-overlay">
            <Icon name="bar-chart-2" size={32} className="text-text-secondary" />
          </div>
          <p className="mb-1 text-base font-semibold text-text-primary">
            {t('screens:shifts.noShifts')}
          </p>
          <p className="mb-6 text-sm text-text-secondary">{t('screens:shifts.noShiftsSub')}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="gap-2"
          >
            <Icon name="upload" size={16} />
            {t('common:history.importBackup')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="rounded-xl bg-accent p-4 shadow-elevation-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-foreground/80 text-sm font-medium">
                  {t('common:history.totalAllTime')}
                </p>
                <p className="font-mono text-2xl font-bold text-accent-foreground">
                  {formatEurFromCents(totalAllTime, fmtLocale)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-accent-foreground/80 text-sm font-medium">
                  {t('common:history.shiftsCount_other', { count: shifts.length })}
                </p>
                <p className="text-accent-foreground/60 mt-0.5 text-xs">
                  ⌀{' '}
                  {formatEurFromCents(
                    shifts.length > 0 ? Math.round(totalAllTime / shifts.length) : 0,
                    fmtLocale,
                  )}
                  /{t('common:history.avgPerShift')}
                </p>
              </div>
            </div>
          </div>

          {/* Graph mode selector */}
          <div className="flex gap-2">
            {(
              [
                { key: 'week', label: t('common:history.perWeek') },
                { key: 'day', label: t('common:history.perDay') },
                { key: 'hourly', label: t('common:history.hourlyRate') },
              ] as { key: GraphMode; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setGraphMode(key)}
                className={cn(
                  'min-h-10 flex-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                  graphMode === key
                    ? 'bg-accent text-accent-foreground shadow-elevation-1'
                    : 'bg-surface-raised text-text-secondary shadow-elevation-1',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {graphData.length > 0 && (
            <div className="rounded-xl bg-surface-raised p-4 shadow-elevation-1">
              <p className="mb-3 text-xs font-medium text-text-secondary">
                {graphMode === 'hourly'
                  ? t('common:history.chartHourly')
                  : t('common:history.chartTips')}
              </p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  {graphMode === 'day' ? (
                    <LineChart
                      data={graphData.map((d) => ({ ...d, eur: centsToEur(d.totalCents) }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-text-secondary)"
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--color-text-secondary)" />
                      <Tooltip
                        formatter={(value: unknown) => [`€${(value as number).toFixed(2)}`, '']}
                        contentStyle={{
                          background: 'var(--color-surface-raised)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="eur"
                        stroke="var(--color-accent)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
                      data={graphData.map((d) => ({ ...d, eur: centsToEur(d.totalCents) }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-text-secondary)"
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--color-text-secondary)" />
                      <Tooltip
                        formatter={(value: unknown) => [`€${(value as number).toFixed(2)}`, '']}
                        contentStyle={{
                          background: 'var(--color-surface-raised)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="eur" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Shift list */}
          <div className="space-y-2">
            <p className="px-1 text-xs font-medium text-text-secondary">
              {t('common:history.shifts')}
            </p>
            {shifts.map((shift) => {
              const isExpanded = expandedShiftId === shift.id;
              const date = new Date(shift.date).toLocaleDateString(fmtLocale, {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
              return (
                <div
                  key={shift.id}
                  className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedShiftId(isExpanded ? null : shift.id)}
                    className="flex min-h-14 w-full items-center justify-between px-4 py-3 transition-colors hover:bg-surface-overlay"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full">
                        <Icon name="clock" size={16} className="text-accent" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-text-primary">{date}</p>
                        <p className="text-xs text-text-secondary">
                          {t('common:history.employees_other', { count: shift.employees.length })}
                          {shift.smartSplitting && ` · ${t('common:history.smartSplitTag')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-base font-bold text-text-primary">
                        {formatEurFromCents(myAmount(shift), fmtLocale)}
                      </p>
                      <Icon
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        className="text-text-secondary"
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border">
                      <div className="divide-y divide-border">
                        {shift.distribution.personShares.map((share) => (
                          <div
                            key={share.id}
                            className="flex items-center justify-between px-4 py-2.5"
                          >
                            <div>
                              <p className="text-sm font-medium text-text-primary">{share.name}</p>
                              <p className="flex items-center gap-1 text-xs text-text-secondary">
                                <Icon name="clock" size={10} />
                                {share.hoursWorked}h
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm font-bold text-text-primary">
                                {formatEurFromCents(share.actualShareInCents, fmtLocale)}
                              </p>
                              {share.deviationInCents !== 0 && (
                                <p
                                  className={cn(
                                    'font-mono text-xs',
                                    share.deviationInCents > 0
                                      ? 'text-status-success'
                                      : 'text-status-error',
                                  )}
                                >
                                  {share.deviationInCents > 0 ? '+' : ''}
                                  {formatEurFromCents(share.deviationInCents, fmtLocale)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delete shift */}
                      <div className="border-t border-border px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setConfirmDeleteId(shift.id)}
                          className="min-h-9 gap-1.5 text-xs text-status-error hover:text-status-error"
                        >
                          <Icon name="trash" size={12} />
                          {t('common:history.deleteShift')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Clear history */}
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmClear(true)}
              className="min-h-12 w-full gap-2 text-status-error hover:text-status-error"
            >
              <Icon name="trash" size={16} />
              {t('common:history.clearAll')}
            </Button>
          </div>
        </div>
      )}

      {/* Import / Export actions — always shown */}
      <div className="mt-4 flex gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setExportOpen(true)}
          className="min-h-12 flex-1 gap-2 text-sm"
        >
          <Icon name="download" size={14} />
          {t('common:actions.export')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setImportOpen(true)}
          className="min-h-12 flex-1 gap-2 text-sm"
        >
          <Icon name="upload" size={14} />
          {t('common:actions.import')}
        </Button>
      </div>

      {/* Confirm: delete single shift */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title={t('screens:shifts.deleteConfirm')}
        confirmLabel={t('common:actions.delete')}
        onConfirm={() => {
          if (confirmDeleteId) handleDeleteShift(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
        variant="danger"
      />

      {/* Confirm: clear all history */}
      <ConfirmDialog
        isOpen={confirmClear}
        title={t('common:history.clearAll')}
        message={t('common:history.clearConfirm')}
        confirmLabel={t('common:actions.delete')}
        onConfirm={handleClearHistory}
        onCancel={() => setConfirmClear(false)}
        variant="danger"
      />

      {/* Export dialog */}
      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        context="all"
        onExportCsv={() => {
          exportCsv();
          showToast(t('common:toast.csvDownloaded'), 'success');
        }}
        onExportPdf={() => {
          exportPdf();
          showToast(t('common:toast.pdfOpened'), 'success');
        }}
        onExportJson={() => {
          exportJson();
          showToast(t('common:toast.backupDownloaded'), 'success');
        }}
        isProcessing={isProcessing}
      />

      {/* Import dialog */}
      <ImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleFileImport}
        isProcessing={isProcessing}
      />
    </ScreenContainer>
  );
}
