/**
 * @file src/screens/HistoryScreen/HistoryScreen.tsx
 * @description History screen — shift history with recharts graphs and import/export.
 *
 * Shows:
 * - Bar/line chart of tips per week or per day
 * - Scrollable list of past shifts
 * - Import/export backup buttons
 * - Clear history button with confirmation
 *
 * @example
 * // Rendered via React Router at route "/history"
 */

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
} from 'recharts'
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer'
import { Button } from '@/components/atoms/Button/Button'
import { Icon } from '@/components/atoms/Icon/Icon'
import { useShifts } from '@/hooks/useShifts'
import { useImportExport } from '@/hooks/useImportExport'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/context/ToastContext'
import { formatEurFromCents } from '@/config/currency'
import { cn } from '@/lib/utils'
import type { Shift } from '@/types/shift'

type GraphMode = 'week' | 'day' | 'hourly'

/** Groups shifts by ISO week key (YYYY-Www). */
function groupByWeek(shifts: Shift[]): { label: string; totalCents: number }[] {
  const map = new Map<string, number>()
  for (const shift of shifts) {
    const d = new Date(shift.date)
    const year = d.getFullYear()
    const jan1 = new Date(year, 0, 1)
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    const key = `KW${week.toString().padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + shift.totalTipsInCents)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, totalCents]) => ({ label, totalCents }))
}

/** Groups shifts by date (YYYY-MM-DD). */
function groupByDay(shifts: Shift[]): { label: string; totalCents: number }[] {
  const map = new Map<string, number>()
  for (const shift of shifts) {
    const label = shift.date.split('T')[0] ?? shift.date
    map.set(label, (map.get(label) ?? 0) + shift.totalTipsInCents)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14) // last 14 days
    .map(([label, totalCents]) => ({ label: label.slice(5), totalCents })) // MM-DD
}

/** Average hourly rate per shift. */
function groupByHourly(shifts: Shift[]): { label: string; totalCents: number }[] {
  return shifts
    .slice(-10)
    .map((shift) => {
      const totalHours = shift.employees.reduce((s, e) => s + e.hours, 0)
      const ratePerHour = totalHours > 0 ? Math.round(shift.totalTipsInCents / totalHours) : 0
      return {
        label: (shift.date.split('T')[0] ?? '').slice(5),
        totalCents: ratePerHour,
      }
    })
}

function centsToEur(cents: number): number {
  return cents / 100
}

/**
 * History screen with charts and shift list.
 */
export function HistoryScreen() {
  const { t } = useTranslation(['common', 'screens'])
  const { shifts, deleteShift, clearHistory } = useShifts()
  const { exportCsv, exportPdf, exportJson, importJson, isProcessing } = useImportExport()
  const { locale } = useLocale()
  const { showToast } = useToast()
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [graphMode, setGraphMode] = useState<GraphMode>('week')
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const graphData = graphMode === 'week'
    ? groupByWeek(shifts)
    : graphMode === 'day'
    ? groupByDay(shifts)
    : groupByHourly(shifts)

  const totalAllTime = shifts.reduce((s, sh) => s + sh.totalTipsInCents, 0)

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const json = ev.target?.result as string
      const result = importJson(json)
      if (result.errors.length > 0) {
        showToast('Import fehlgeschlagen: ' + result.errors[0], 'error')
      } else {
        showToast(`${result.added} Schichten importiert, ${result.skipped} übersprungen`, 'success')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [importJson, showToast])

  function handleClearHistory() {
    clearHistory()
    setConfirmClear(false)
    showToast('Verlauf gelöscht', 'info')
  }

  function handleDeleteShift(id: string) {
    deleteShift(id)
    setConfirmDeleteId(null)
    showToast('Schicht gelöscht', 'info')
  }

  return (
    <ScreenContainer title={t('screens:shifts.title')} subtitle={t('screens:shifts.subtitle')}>
      {shifts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-surface-overlay flex items-center justify-center mb-4">
            <Icon name="bar-chart-2" size={32} className="text-text-secondary" />
          </div>
          <p className="text-base font-semibold text-text-primary mb-1">
            {t('screens:shifts.noShifts')}
          </p>
          <p className="text-sm text-text-secondary mb-6">
            Berechne eine Schicht und speichere sie, um sie hier zu sehen.
          </p>
          {/* Import option even when empty */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Icon name="upload" size={16} />
            Backup importieren
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="rounded-xl bg-accent shadow-elevation-2 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-accent-foreground/80">Gesamt aller Schichten</p>
                <p className="text-2xl font-bold font-mono text-accent-foreground">
                  {formatEurFromCents(totalAllTime, fmtLocale)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-accent-foreground/80">{shifts.length} Schichten</p>
                <p className="text-xs text-accent-foreground/60 mt-0.5">
                  ⌀ {formatEurFromCents(shifts.length > 0 ? Math.round(totalAllTime / shifts.length) : 0, fmtLocale)}/Schicht
                </p>
              </div>
            </div>
          </div>

          {/* Graph mode selector */}
          <div className="flex gap-2">
            {([
              { key: 'week', label: 'Pro Woche' },
              { key: 'day',  label: 'Pro Tag' },
              { key: 'hourly', label: 'Stundensatz' },
            ] as { key: GraphMode; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setGraphMode(key)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-colors min-h-10',
                  graphMode === key
                    ? 'bg-accent text-accent-foreground shadow-elevation-1'
                    : 'bg-surface-raised text-text-secondary shadow-elevation-1'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {graphData.length > 0 && (
            <div className="rounded-xl bg-surface-raised shadow-elevation-1 p-4">
              <p className="text-xs font-medium text-text-secondary mb-3">
                {graphMode === 'hourly' ? 'Stundensatz (€/h)' : 'Trinkgeld (€)'}
              </p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  {graphMode === 'day' ? (
                    <LineChart data={graphData.map((d) => ({ ...d, eur: centsToEur(d.totalCents) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-text-secondary)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--color-text-secondary)" />
                      <Tooltip
                        formatter={(value: unknown) => [`€${(value as number).toFixed(2)}`, '']}
                        contentStyle={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="eur" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={graphData.map((d) => ({ ...d, eur: centsToEur(d.totalCents) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-text-secondary)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="var(--color-text-secondary)" />
                      <Tooltip
                        formatter={(value: unknown) => [`€${(value as number).toFixed(2)}`, '']}
                        contentStyle={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
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
            <p className="text-xs font-medium text-text-secondary px-1">Schichten</p>
            {shifts.map((shift) => {
              const isExpanded = expandedShiftId === shift.id
              const date = new Date(shift.date).toLocaleDateString(fmtLocale, {
                weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
              })
              return (
                <div key={shift.id} className="rounded-xl bg-surface-raised shadow-elevation-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedShiftId(isExpanded ? null : shift.id)}
                    className="w-full flex items-center justify-between px-4 py-3 min-h-14 hover:bg-surface-overlay transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="clock" size={16} className="text-accent" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-text-primary">{date}</p>
                        <p className="text-xs text-text-secondary">
                          {shift.employees.length} Mitarbeiter
                          {shift.smartSplitting && ' · Smart Split'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-base font-bold text-text-primary">
                        {formatEurFromCents(shift.totalTipsInCents, fmtLocale)}
                      </p>
                      <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} className="text-text-secondary" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border">
                      <div className="divide-y divide-border">
                        {shift.distribution.personShares.map((share) => (
                          <div key={share.id} className="flex items-center justify-between px-4 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-text-primary">{share.name}</p>
                              <p className="text-xs text-text-secondary flex items-center gap-1">
                                <Icon name="clock" size={10} />
                                {share.hoursWorked}h
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm font-bold text-text-primary">
                                {formatEurFromCents(share.actualShareInCents, fmtLocale)}
                              </p>
                              {share.deviationInCents !== 0 && (
                                <p className={cn(
                                  'text-xs font-mono',
                                  share.deviationInCents > 0 ? 'text-status-success' : 'text-status-error'
                                )}>
                                  {share.deviationInCents > 0 ? '+' : ''}
                                  {formatEurFromCents(share.deviationInCents, fmtLocale)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Delete shift */}
                      <div className="px-4 py-3 border-t border-border">
                        {confirmDeleteId === shift.id ? (
                          <div className="flex gap-2">
                            <p className="text-xs text-text-secondary flex-1 flex items-center">
                              {t('screens:shifts.deleteConfirm')}
                            </p>
                            <Button type="button" variant="ghost" onClick={() => setConfirmDeleteId(null)} className="min-h-9 px-3 text-xs">
                              {t('common:actions.cancel')}
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleDeleteShift(shift.id)}
                              className="min-h-9 px-3 text-xs bg-status-error hover:bg-status-error/90"
                            >
                              {t('common:actions.delete')}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(shift.id)}
                            className="min-h-9 text-xs gap-1.5 text-status-error hover:text-status-error"
                          >
                            <Icon name="trash" size={12} />
                            {t('screens:shifts.deleteConfirm').split('?')[0]}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Clear history */}
          <div className="pt-2">
            {confirmClear ? (
              <div className="rounded-xl bg-status-error/10 p-4 space-y-3">
                <p className="text-sm text-text-primary font-medium">
                  Alle Schichten wirklich löschen? Dies kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setConfirmClear(false)} className="flex-1 min-h-10">
                    {t('common:actions.cancel')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleClearHistory}
                    className="flex-1 min-h-10 bg-status-error hover:bg-status-error/90"
                  >
                    <Icon name="trash" size={14} />
                    {t('common:actions.delete')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmClear(true)}
                className="w-full min-h-12 text-status-error hover:text-status-error gap-2"
              >
                <Icon name="trash" size={16} />
                Verlauf löschen
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Import / Export actions — always shown */}
      <div className="mt-4 space-y-3 pt-4 border-t border-border">
        <p className="text-xs font-medium text-text-secondary">{t('screens:importExport.title')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            isLoading={isProcessing}
            onClick={() => { exportJson(); showToast('Backup heruntergeladen', 'success') }}
            className="min-h-12 text-sm gap-2"
          >
            <Icon name="download" size={14} />
            {t('common:actions.exportJson')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-12 text-sm gap-2"
          >
            <Icon name="upload" size={14} />
            {t('common:actions.importJson')}
          </Button>
          <Button
            type="button"
            variant="outline"
            isLoading={isProcessing}
            onClick={() => { exportCsv(); showToast('CSV heruntergeladen', 'success') }}
            className="min-h-12 text-sm gap-2"
          >
            <Icon name="file-text" size={14} />
            {t('common:actions.exportCsv')}
          </Button>
          <Button
            type="button"
            variant="outline"
            isLoading={isProcessing}
            onClick={() => { exportPdf(); showToast('PDF wird geöffnet', 'success') }}
            className="min-h-12 text-sm gap-2"
          >
            <Icon name="share-2" size={14} />
            {t('common:actions.exportPdf')}
          </Button>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
        aria-hidden="true"
      />
    </ScreenContainer>
  )
}
