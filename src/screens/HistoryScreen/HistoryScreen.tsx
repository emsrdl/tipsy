/**
 * @file src/screens/HistoryScreen/HistoryScreen.tsx
 * @description History screen — shift history with recharts graphs and import/export.
 *
 * Shows only shifts for the active profile (or a sign-in prompt when signed out).
 *
 * @example
 * // Rendered via React Router at route "/history"
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePreserveScroll } from '@/hooks/usePreserveScroll';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog/ConfirmDialog';
import { ChartTooltip } from '@/components/molecules/ChartTooltip/ChartTooltip';
import { ExportDialog } from '@/components/molecules/ExportDialog/ExportDialog';
import { ImportDialog } from '@/components/molecules/ImportDialog/ImportDialog';
import { ShiftDetailCard } from '@/components/organisms/ShiftDetailCard/ShiftDetailCard';
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
import { downloadShiftsCsv, exportShiftsPdf } from '@/lib/io/importExport';
import { cn } from '@/lib/utils';
import type { Shift } from '@/types/shift';

type GraphMode = 'week' | 'day' | 'hourly';

/** Returns the active profile's personal tip amount for a shift, or total if not found. */
function getProfileAmount(shift: Shift, profileId: string | undefined): number {
  if (!profileId) return shift.totalTipsInCents;
  const myShare = shift.distribution.personShares.find((s) => s.id === `profile-emp-${profileId}`);
  return myShare?.actualShareInCents ?? shift.totalTipsInCents;
}

interface GraphDataPoint {
  label: string;
  totalCents: number;
  shiftCount?: number;
  totalHours?: number;
}

/**
 * Returns the ISO 8601 week number and week-year for a date.
 * ISO weeks start on Monday; week 1 contains the year's first Thursday.
 */
function getISOWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // Sunday (0) → 7
  date.setUTCDate(date.getUTCDate() + 4 - day); // shift to nearest Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

/** Groups shifts by ISO 8601 week key (YYYY-KWxx). */
function groupByWeek(shifts: Shift[], getValue: (s: Shift) => number): GraphDataPoint[] {
  const map = new Map<string, { totalCents: number; shiftCount: number }>();
  for (const shift of shifts) {
    const { year, week } = getISOWeek(new Date(shift.date));
    const key = `${year}-KW${week.toString().padStart(2, '0')}`;
    const existing = map.get(key) ?? { totalCents: 0, shiftCount: 0 };
    map.set(key, {
      totalCents: existing.totalCents + getValue(shift),
      shiftCount: existing.shiftCount + 1,
    });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, data]) => ({ label, totalCents: data.totalCents, shiftCount: data.shiftCount }));
}

/** Groups shifts by date (MM-DD). */
function groupByDay(shifts: Shift[], getValue: (s: Shift) => number): GraphDataPoint[] {
  const map = new Map<string, { totalCents: number; shiftCount: number }>();
  for (const shift of shifts) {
    const label = shift.date.split('T')[0] ?? shift.date;
    const existing = map.get(label) ?? { totalCents: 0, shiftCount: 0 };
    map.set(label, {
      totalCents: existing.totalCents + getValue(shift),
      shiftCount: existing.shiftCount + 1,
    });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([label, data]) => ({
      label: label.slice(5),
      totalCents: data.totalCents,
      shiftCount: data.shiftCount,
    }));
}

/** Average hourly rate per shift (last 10). */
function groupByHourly(shifts: Shift[], getValue: (s: Shift) => number): GraphDataPoint[] {
  return shifts.slice(-10).map((shift) => {
    const totalHours = shift.employees.reduce((s, e) => s + e.hours, 0);
    const ratePerHour = totalHours > 0 ? Math.round(getValue(shift) / totalHours) : 0;
    return {
      label: (shift.date.split('T')[0] ?? '').slice(5),
      totalCents: ratePerHour,
      totalHours,
    };
  });
}


/**
 * History screen with charts, profile-filtered shift list, and import/export.
 */
export function HistoryScreen() {
  usePreserveScroll();
  const { t } = useTranslation(['common', 'screens']);
  const { shifts: allShifts, deleteShift } = useShifts();
  const { locale } = useLocale();
  const { activeProfile } = useProfiles();
  const { showToast } = useToast();
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';

  const [graphMode, setGraphMode] = useState<GraphMode>('week');
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [singleExportShift, setSingleExportShift] = useState<Shift | null>(null);
  const singleExportOpen = singleExportShift !== null;

  // Filter shifts by active profile; empty when signed out
  const shifts = useMemo(
    () => (activeProfile === null ? [] : allShifts.filter((s) => s.profileId === activeProfile.id)),
    [activeProfile, allShifts],
  );

  // Export only profile-filtered shifts; import reassigns to active profile
  const { exportCsv, exportPdf, exportJson, importJson, isProcessing } = useImportExport(shifts);

  const myAmount = useCallback(
    (shift: Shift) => getProfileAmount(shift, activeProfile?.id),
    [activeProfile?.id],
  );

  const graphData = useMemo(() => {
    const raw =
      graphMode === 'week'
        ? groupByWeek(shifts, myAmount)
        : graphMode === 'day'
          ? groupByDay(shifts, myAmount)
          : groupByHourly(shifts, myAmount);
    return raw.map((d) => ({ ...d, eur: d.totalCents / 100 }));
  }, [graphMode, shifts, myAmount]);

  const totalAllTime = useMemo(
    () => shifts.reduce((s, sh) => s + myAmount(sh), 0),
    [shifts, myAmount],
  );

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

  // Signed-out empty state
  if (activeProfile === null) {
    return (
      <ScreenContainer title={t('screens:shifts.title')} subtitle={t('screens:shifts.subtitle')}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-overlay">
            <Icon name="user" size={32} className="text-text-secondary" />
          </div>
          <p className="mb-1 text-base font-semibold text-text-primary">
            {t('common:profile.noShiftsSignedOut')}
          </p>
          <p className="mb-6 text-sm text-text-secondary">{t('common:profile.noShiftsSignedOutSub')}</p>
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
              <div className="h-48 min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={50} initialDimension={{ width: 1, height: 1 }}>
                  {graphMode === 'day' ? (
                    <LineChart
                      data={graphData}
                      margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltip suffix="€" />}
                        cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="eur"
                        stroke="var(--color-accent)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--color-accent)' }}
                        activeDot={{ r: 5, fill: 'var(--color-accent)' }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
                      data={graphData}
                      margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="var(--color-text-secondary)"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={
                          <ChartTooltip suffix={graphMode === 'hourly' ? '€/h' : '€'} />
                        }
                        cursor={false}
                        trigger="hover"
                        allowEscapeViewBox={{ x: false, y: false }}
                      />
                      <Bar
                        dataKey="eur"
                        fill="var(--color-accent)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={80}
                        activeBar={{ fill: 'var(--color-accent)', fillOpacity: 0.8 }}
                      />
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
                      <div className="bg-accent/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
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
                    <ShiftDetailCard
                      shift={shift}
                      onDelete={() => setConfirmDeleteId(shift.id)}
                      onExport={() => setSingleExportShift(shift)}
                    />
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

      {/* Single-shift export dialog */}
      <ExportDialog
        isOpen={singleExportOpen}
        onClose={() => setSingleExportShift(null)}
        context="single"
        onExportCsv={() => {
          if (singleExportShift) {
            downloadShiftsCsv(
              [singleExportShift],
              `tipsy-shift-${singleExportShift.date.split('T')[0] ?? 'export'}`,
              fmtLocale,
            );
            showToast(t('common:toast.csvDownloaded'), 'success');
          }
        }}
        onExportPdf={() => {
          if (singleExportShift) {
            exportShiftsPdf([singleExportShift], fmtLocale);
            showToast(t('common:toast.pdfOpened'), 'success');
          }
        }}
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
