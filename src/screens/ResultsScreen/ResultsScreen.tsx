/**
 * @file src/screens/ResultsScreen/ResultsScreen.tsx
 * @description Results screen — distribution display with smart split, exports, save shift.
 *
 * Step 3 of 3. Shows distribution, fairness score, transfers if smart split used.
 *
 * @example
 * // Rendered via React Router at route "/calculate/results"
 */

import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer';
import { DistributionTable } from '@/components/organisms/DistributionTable/DistributionTable';
import { Button } from '@/components/atoms/Button/Button';
import { Alert } from '@/components/molecules/Alert/Alert';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Badge } from '@/components/atoms/Badge/Badge';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import { useExport } from '@/hooks/useExport';
import { useShifts } from '@/hooks/useShifts';
import { useProfiles } from '@/hooks/useProfiles';
import { useSmartSplitter } from '@/hooks/useSmartSplitter';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/hooks/useLocale';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ExportDialog } from '@/components/molecules/ExportDialog/ExportDialog';
import { formatEurFromCents } from '@/config/currency';
import { DEFAULT_FAIRNESS_THRESHOLD, SMART_SPLIT_DEFAULT_THRESHOLD_KEY } from '@/config/smartSplit';
import { resolveEmployeeName } from '@/lib/employee';
import { cn } from '@/lib/utils';
import type { Shift, DifferenceLine } from '@/types/shift';

function generateShiftId(): string {
  return `shift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const STEP_ROUTES: Record<number, string> = {
  1: '/calculate',
  2: '/calculate/cash',
  3: '/calculate/results',
};

/**
 * Results screen — step 3 of 3.
 */
export function ResultsScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors']);
  const navigate = useNavigate();
  const { session, totalInCents, reset } = useTipCalculator();
  const { exportPdf, exportCsv, isExporting } = useExport();
  const { addShift } = useShifts();
  const { activeProfile, isGuestMode } = useProfiles();
  const { showToast } = useToast();
  const { locale } = useLocale();
  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE';

  const [defaultThreshold] = useLocalStorage<number>(
    SMART_SPLIT_DEFAULT_THRESHOLD_KEY,
    DEFAULT_FAIRNESS_THRESHOLD,
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [showThresholdHelp, setShowThresholdHelp] = useState(false);

  const results = session.results ?? [];

  const normalizedEmployees = useMemo(
    () =>
      session.employees.map((emp, i) => ({
        ...emp,
        name: resolveEmployeeName(emp.name, t('screens:setup.defaultEmployeeName', { n: i + 1 })),
      })),
    [session.employees, t],
  );

  const smartOutput = useSmartSplitter(
    normalizedEmployees,
    totalInCents,
    session.split.kitchenPercent,
    session.denominations,
  );

  const { isSmartMode, toggleSmartMode, thresholdInCents, setThreshold } = smartOutput;
  const [thresholdInput, setThresholdInput] = useState((thresholdInCents / 100).toFixed(2));
  const thresholdInputRef = useRef<HTMLInputElement>(null);

  function handleThresholdChange(value: string) {
    setThresholdInput(value);
    const parsed = parseFloat(value.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 50) {
      setThreshold(Math.round(parsed * 100));
    }
  }

  function handleThresholdBlur() {
    const parsed = parseFloat(thresholdInput.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0.5) {
      setThresholdInput((DEFAULT_FAIRNESS_THRESHOLD / 100).toFixed(2));
      setThreshold(DEFAULT_FAIRNESS_THRESHOLD);
    } else {
      const clamped = Math.min(Math.max(parsed, 0.5), 50);
      setThresholdInput(clamped.toFixed(2));
      setThreshold(Math.round(clamped * 100));
    }
    showToast(
      t('common:toast.thresholdUpdated', {
        amount: formatEurFromCents(thresholdInCents, fmtLocale),
      }),
      'info',
    );
  }

  const hasResults = results.length > 0;

  // When smart mode is on, show actual (smart-adjusted) amounts; otherwise show proportional results.
  const displayResults =
    isSmartMode && smartOutput.output
      ? smartOutput.output.distribution.personShares.map((s) => ({
          employeeId: s.id,
          name: s.name,
          group: s.role,
          hours: s.hoursWorked,
          amountInCents: s.actualShareInCents,
        }))
      : results;

  function handleToggleSmartMode() {
    toggleSmartMode();
    showToast(t('common:toast.calculationUpdated'), 'info');
  }

  function handleSaveAndFinish() {
    if (!hasResults) return;

    const distribution = smartOutput.output?.distribution ?? {
      personShares: results.map((r) => ({
        id: r.employeeId,
        name: r.name,
        role: r.group,
        hoursWorked: r.hours,
        idealShareInCents: r.amountInCents,
        actualShareInCents: r.amountInCents,
        deviationInCents: 0,
      })),
      remainingCents: 0,
      fairnessScore: 100,
      denominationsUsed: [],
    };

    const shift: Shift = {
      id: generateShiftId(),
      profileId: activeProfile?.id ?? null,
      date: new Date().toISOString(),
      kitchenPercent: session.split.kitchenPercent,
      employees: session.employees,
      totalTipsInCents: totalInCents,
      denominationInput: session.denominations.filter((d) => d.quantity > 0),
      distribution,
      smartSplitting: isSmartMode,
      differences: smartOutput.output?.differences ?? [],
      savedAt: new Date().toISOString(),
    };

    addShift(shift);
    showToast(t('common:toast.shiftSaved'), 'success');
    setThreshold(defaultThreshold);
    reset();
    void navigate('/history');
  }

  function handleResetAll() {
    setThreshold(defaultThreshold);
    reset();
    showToast(t('common:toast.allReset'), 'info');
    void navigate('/calculate');
  }

  const fairnessScore = smartOutput.output?.distribution.fairnessScore;
  const transfers: DifferenceLine[] = smartOutput.output?.differences ?? [];

  function handleStepClick(s: number) {
    void navigate(STEP_ROUTES[s]);
  }

  return (
    <ScreenContainer
      title={t('screens:results.title')}
      subtitle={t('screens:results.subtitle')}
      step={3}
      totalSteps={3}
      maxReachableStep={3}
      onStepClick={handleStepClick}
      onReset={handleResetAll}
    >
      {results.length === 0 ? (
        <Alert status="info" message={t('errors:validation.noEmployees')} />
      ) : (
        <div className="space-y-4">
          {/* Distribution table */}
          <DistributionTable
            results={displayResults}
            totalInCents={totalInCents}
            {...(isSmartMode && smartOutput.output
              ? {
                  personShares: smartOutput.output.distribution.personShares,
                  payoutPlans: smartOutput.output.payoutPlans,
                }
              : {})}
          />

          {/* Smart mode toggle + threshold (card, matches SetupScreen style) */}
          <div className="space-y-3 rounded-xl bg-surface-raised p-4 shadow-elevation-1">
            <button
              type="button"
              onClick={handleToggleSmartMode}
              className="flex min-h-12 w-full items-center justify-between gap-3"
              aria-pressed={isSmartMode}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                    isSmartMode ? 'bg-accent/10' : 'bg-surface-overlay',
                  )}
                >
                  <Icon
                    name="zap"
                    size={16}
                    className={isSmartMode ? 'text-accent' : 'text-text-secondary'}
                  />
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isSmartMode ? 'text-accent' : 'text-text-primary',
                    )}
                  >
                    {t('common:smartSplit.modeLabel')} —{' '}
                    {isSmartMode ? t('common:smartSplit.smart') : t('common:smartSplit.normal')}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {isSmartMode
                      ? t('common:smartSplit.descSmart')
                      : t('common:smartSplit.descNormal')}
                  </p>
                </div>
              </div>
              <Icon
                name={isSmartMode ? 'toggle-right' : 'toggle-left'}
                size={28}
                className={isSmartMode ? 'text-accent' : 'text-text-secondary'}
              />
            </button>

            {/* Threshold — same structure as SetupScreen */}
            {isSmartMode && (
              <div className="space-y-2 border-t border-border pt-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-2">
                    <span className="whitespace-nowrap text-xs font-medium text-text-secondary">
                      {t('common:smartSplit.threshold')}:
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        ref={thresholdInputRef}
                        type="number"
                        inputMode="decimal"
                        min="0.50"
                        max="50"
                        step="0.50"
                        value={thresholdInput}
                        onChange={(e) => handleThresholdChange(e.target.value)}
                        onBlur={handleThresholdBlur}
                        className="h-9 w-20 rounded-lg border border-border bg-surface-overlay px-2 text-center font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                      />
                      <span className="text-sm text-text-secondary">€</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowThresholdHelp(!showThresholdHelp)}
                    className="whitespace-nowrap text-xs text-accent underline"
                  >
                    {showThresholdHelp
                      ? t('common:smartSplit.helpClose')
                      : t('common:smartSplit.helpWhat')}
                  </button>
                </div>
                {showThresholdHelp && (
                  <p className="rounded-lg bg-surface-overlay p-3 text-xs text-text-secondary">
                    {t('common:smartSplit.helpText')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Fairness score (smart mode) */}
          {isSmartMode && fairnessScore !== undefined && (
            <div
              className={cn(
                'flex items-center justify-between rounded-xl px-4 py-3 shadow-elevation-1',
                fairnessScore >= 95 ? 'bg-status-success/10' : 'bg-status-warning/10',
              )}
            >
              <div className="flex items-center gap-2">
                <Icon
                  name="star"
                  size={16}
                  className={fairnessScore >= 95 ? 'text-status-success' : 'text-status-warning'}
                />
                <span className="text-sm font-medium text-text-primary">
                  {t('common:smartSplit.fairnessScore')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-overlay">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      fairnessScore >= 95 ? 'bg-status-success' : 'bg-status-warning',
                    )}
                    style={{ width: `${fairnessScore}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {fairnessScore}%
                </span>
              </div>
            </div>
          )}

          {/* Transfers (smart mode) */}
          {isSmartMode && transfers.length > 0 && (
            <div className="bg-status-warning/10 overflow-hidden rounded-xl shadow-elevation-1">
              <div className="border-status-warning/20 flex items-center gap-2 border-b px-4 py-3">
                <Icon name="arrow-right" size={14} className="text-status-warning" />
                <span className="text-sm font-semibold text-text-primary">
                  {t('common:smartSplit.transfers')}
                </span>
                <Badge
                  variant="default"
                  className="bg-status-warning/20 ml-auto border-0 text-xs text-status-warning"
                >
                  {t('common:smartSplit.aboveThreshold', {
                    amount: formatEurFromCents(thresholdInCents, fmtLocale),
                  })}
                </Badge>
              </div>
              <div className="divide-status-warning/10 divide-y">
                {transfers.map((diff, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-text-primary">
                      <span className="font-medium">{diff.fromPerson.name}</span>
                      {' → '}
                      <span className="font-medium">{diff.toPerson.name}</span>
                    </span>
                    <span className="font-mono text-sm font-bold text-status-warning">
                      {formatEurFromCents(diff.amountInCents, fmtLocale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSmartMode &&
            transfers.length === 0 &&
            fairnessScore !== undefined &&
            fairnessScore >= 95 && (
              <p className="py-1 text-center text-xs text-text-secondary">
                {t('common:smartSplit.noTransfers')}
              </p>
            )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 space-y-3">
        {hasResults && (
          <>
            {/* Save & finish */}
            <Button
              type="button"
              onClick={handleSaveAndFinish}
              className="min-h-14 w-full text-base font-semibold"
            >
              <Icon name="save" size={18} />
              {isGuestMode ? t('screens:results.finishNoSave') : t('screens:results.saveAndFinish')}
            </Button>

            {/* Export button */}
            <Button
              type="button"
              variant="outline"
              className="min-h-12 w-full"
              isLoading={isExporting}
              onClick={() => setExportOpen(true)}
            >
              <Icon name="download" size={16} />
              {t('common:actions.export')}
            </Button>
          </>
        )}

        {/* Nav row */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void navigate('/calculate/cash')}
            className="min-h-12 flex-1"
          >
            <Icon name="chevron-left" size={16} />
            {t('common:actions.back')}
          </Button>
        </div>
      </div>

      {/* Export dialog */}
      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        context="single"
        onExportCsv={() => {
          exportCsv(results);
          showToast(t('common:toast.csvDownloaded'), 'success');
        }}
        onExportPdf={() => {
          exportPdf(results);
          showToast(t('common:toast.pdfOpened'), 'success');
        }}
        isProcessing={isExporting}
      />
    </ScreenContainer>
  );
}
