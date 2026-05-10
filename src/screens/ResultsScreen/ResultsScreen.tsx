/**
 * @file src/screens/ResultsScreen/ResultsScreen.tsx
 * @description Results screen — distribution display with smart split, exports, save shift.
 *
 * Step 3 of 3. Shows distribution, fairness score, transfers if smart split used.
 *
 * @example
 * // Rendered via React Router at route "/calculate/results"
 */

import { useState, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  usePreserveScroll,
  markFlowReset,
  getScrollRatio,
  getScrollEl,
} from '@/hooks/usePreserveScroll';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer';
import { DistributionTable } from '@/components/organisms/DistributionTable/DistributionTable';
import { Slider } from '@/components/molecules/Slider/Slider';
import { Button } from '@/components/atoms/Button/Button';
import { Alert } from '@/components/molecules/Alert/Alert';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import { useExport } from '@/hooks/useExport';
import { useShifts } from '@/hooks/useShifts';
import { useProfiles } from '@/hooks/useProfiles';
import { useSmartSplitter } from '@/hooks/useSmartSplitter';
import { useThresholdInput } from '@/hooks/useThresholdInput';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/hooks/useLocale';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ExportDialog } from '@/components/molecules/ExportDialog/ExportDialog';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog/ConfirmDialog';
import { postTransferFairnessScore, fairnessScoreColor } from '@/lib/calc/calculations';
import { formatEurFromCents } from '@/config/currency';
import { DEFAULT_FAIRNESS_THRESHOLD, SMART_SPLIT_DEFAULT_THRESHOLD_KEY } from '@/config/smartSplit';
import { resolveEmployeeName } from '@/lib/employee';
import { cn } from '@/lib/utils';
import type { Shift } from '@/types/shift';

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
  usePreserveScroll();
  const { session, totalInCents, reset, setSplit } = useTipCalculator();
  const { exportPdf, exportCsv, isExporting } = useExport();
  const { addShift } = useShifts();
  const { activeProfile } = useProfiles();
  const { showToast } = useToast();
  const { fmtLocale } = useLocale();

  const [defaultThreshold] = useLocalStorage<number>(
    SMART_SPLIT_DEFAULT_THRESHOLD_KEY,
    DEFAULT_FAIRNESS_THRESHOLD,
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [guestFinishOpen, setGuestFinishOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [showThresholdHelp, setShowThresholdHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const hasResults = (session.results?.length ?? 0) > 0;

  const normalizedResults = useMemo(
    () =>
      (session.results ?? []).map((r, i) => ({
        ...r,
        name: resolveEmployeeName(r.name, t('screens:setup.defaultEmployeeName', { n: i + 1 })),
      })),
    [session.results, t],
  );

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
  const thresholdInput = useThresholdInput(thresholdInCents, setThreshold);
  const thresholdInputRef = useRef<HTMLInputElement>(null);
  const sliderWrapperRef = useRef<HTMLDivElement>(null);
  const transfersCardRef = useRef<HTMLDivElement>(null);
  const lastTransferHeightRef = useRef<number | null>(null);

  const hasKitchen = session.employees.some((e) => e.group === 'kitchen');
  const hasService = session.employees.some((e) => e.group === 'service');
  const hasBothGroups = hasKitchen && hasService;

  const displayResults = useMemo(
    () =>
      isSmartMode && smartOutput.output
        ? smartOutput.output.distribution.personShares.map((s) => ({
            employeeId: s.id,
            name: s.name,
            group: s.role,
            hours: s.hoursWorked,
            amountInCents: s.actualShareInCents,
          }))
        : normalizedResults,
    [isSmartMode, smartOutput.output, normalizedResults],
  );

  function handleSaveAndFinish() {
    if (smartOutput.output === null || activeProfile === null) return;

    const shift: Shift = {
      id: generateShiftId(),
      profileId: activeProfile.id,
      date: new Date().toISOString(),
      kitchenPercent: session.split.kitchenPercent,
      employees: normalizedEmployees,
      totalTipsInCents: totalInCents,
      denominationInput: session.denominations.filter((d) => d.quantity > 0),
      distribution: smartOutput.output.distribution,
      smartSplitting: isSmartMode,
      differences: smartOutput.output.differences,
      savedAt: new Date().toISOString(),
    };

    addShift(shift);
    showToast(t('common:toast.shiftSaved'), 'success');
    setThreshold(defaultThreshold);
    reset();
    markFlowReset();
    void navigate('/history');
  }

  function handleResetAll() {
    markFlowReset();
    setThreshold(defaultThreshold);
    reset();
    void navigate('/calculate');
  }

  const fairnessScore = smartOutput.output?.distribution.fairnessScore;
  const transfers = smartOutput.output?.differences ?? [];

  useEffect(() => {
    if (showSettings && hasBothGroups) {
      sliderWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettings]);

  // Transfers sit above the slider (above the total). When dragging the slider
  // changes the transfer list's height, compensate scroll by the delta so the
  // slider stays anchored in the viewport.
  useLayoutEffect(() => {
    const el = transfersCardRef.current;
    if (!el) {
      lastTransferHeightRef.current = null;
      return;
    }
    const h = el.getBoundingClientRect().height;
    if (lastTransferHeightRef.current !== null && showSettings) {
      const delta = h - lastTransferHeightRef.current;
      if (Math.abs(delta) > 0.5) {
        getScrollEl()?.scrollBy({ top: delta });
      }
    }
    lastTransferHeightRef.current = h;
  }, [transfers.length, showSettings]);

  const postScore = useMemo(
    () =>
      smartOutput.output
        ? postTransferFairnessScore(
            smartOutput.output.distribution.personShares,
            smartOutput.output.differences,
          )
        : undefined,
    [smartOutput.output],
  );

  const settingsCard = (
    <div className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1">
      <button
        type="button"
        onClick={() => setShowSettings(!showSettings)}
        aria-expanded={showSettings}
        className="flex w-full items-center gap-2 px-4 py-2.5"
      >
        <Icon name="settings" size={14} className="shrink-0 text-text-secondary" />
        <span className="flex-1 text-left text-sm text-text-secondary">
          {t('screens:setup.splitTitle')}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {hasBothGroups && (
            <span className="inline-flex overflow-hidden rounded-full font-mono text-xs font-semibold">
              <span className="bg-teal-100 px-1.5 py-0.5 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                {session.split.servicePercent}%
              </span>
              <span className="bg-orange-100 px-1.5 py-0.5 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                {session.split.kitchenPercent}%
              </span>
            </span>
          )}
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 font-mono text-xs font-semibold',
              isSmartMode ? 'bg-accent/15 text-accent' : 'bg-surface-overlay text-text-secondary',
            )}
          >
            {isSmartMode
              ? `${t('common:smartSplit.smart')} ${formatEurFromCents(thresholdInCents, fmtLocale)}`
              : t('common:smartSplit.normal')}
          </span>
        </div>
        <Icon
          name={showSettings ? 'chevron-up' : 'chevron-down'}
          size={14}
          className="shrink-0 text-text-secondary"
        />
      </button>

      {showSettings && (
        <div className="divide-y divide-border border-t border-border">
          {hasBothGroups && (
            <div ref={sliderWrapperRef} className="px-4 py-3">
              <Slider
                value={session.split.servicePercent}
                onChange={(s) => setSplit({ kitchenPercent: 100 - s, servicePercent: s })}
                label={t('screens:setup.groupService')}
                counterLabel={t('screens:setup.groupKitchen')}
                aria-label={t('screens:setup.splitTitle')}
              />
            </div>
          )}
          <div className="space-y-2 px-4 py-2.5">
            <button
              type="button"
              onClick={toggleSmartMode}
              aria-pressed={isSmartMode}
              className="flex h-9 w-full items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <Icon
                  name="zap"
                  size={15}
                  className={isSmartMode ? 'text-accent' : 'text-text-secondary'}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    isSmartMode ? 'text-accent' : 'text-text-primary',
                  )}
                >
                  {t('common:smartSplit.modeLabel')} —{' '}
                  {isSmartMode ? t('common:smartSplit.smart') : t('common:smartSplit.normal')}
                </span>
              </div>
              <Icon
                name={isSmartMode ? 'toggle-right' : 'toggle-left'}
                size={26}
                className={isSmartMode ? 'text-accent' : 'text-text-secondary'}
              />
            </button>
            {isSmartMode && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-text-primary">
                    {t('common:smartSplit.threshold')}:
                  </span>
                  <input
                    ref={thresholdInputRef}
                    id="results-threshold"
                    name="threshold"
                    type="number"
                    inputMode="decimal"
                    min="0.50"
                    max="50"
                    step="0.50"
                    value={thresholdInput.value}
                    onChange={(e) => thresholdInput.onChange(e.target.value)}
                    onBlur={thresholdInput.onBlur}
                    aria-label={t('common:smartSplit.threshold')}
                    className="h-7 w-16 rounded-full bg-surface-overlay px-2 text-center font-mono text-sm font-bold text-text-primary focus:outline-none"
                  />
                  <span className="text-sm text-text-secondary">€</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowThresholdHelp(!showThresholdHelp)}
                  className="text-xs whitespace-nowrap text-accent underline"
                >
                  {showThresholdHelp
                    ? t('common:smartSplit.helpClose')
                    : t('common:smartSplit.helpWhat')}
                </button>
              </div>
            )}
            {showThresholdHelp && (
              <p className="rounded-lg bg-surface-overlay p-3 text-xs text-text-secondary">
                {t('common:smartSplit.helpText')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const fairnessRow =
    isSmartMode && fairnessScore !== undefined ? (
      <div className="flex items-center gap-2 px-4 py-1">
        <Icon name="star" size={14} className={fairnessScoreColor(postScore ?? fairnessScore)} />
        <span className="flex-1 text-sm text-text-secondary">
          {t('common:smartSplit.fairnessScore')}
        </span>
        {postScore !== undefined ? (
          <span className="flex items-center gap-1.5">
            <span className={cn('font-mono text-sm font-bold', fairnessScoreColor(fairnessScore))}>
              {fairnessScore}%
            </span>
            <Icon name="arrow-right" size={12} className="text-text-secondary" />
            <span className={cn('font-mono text-sm font-bold', fairnessScoreColor(postScore))}>
              {postScore}%
            </span>
          </span>
        ) : (
          <span className={cn('font-mono text-sm font-bold', fairnessScoreColor(fairnessScore))}>
            {fairnessScore}%
          </span>
        )}
      </div>
    ) : null;

  const transfersCard = isSmartMode ? (
    <div
      ref={transfersCardRef}
      className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1 [overflow-anchor:none]"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-4 py-3">
        <Icon name="arrow-right" size={14} className="shrink-0 text-status-warning" />
        <span className="text-sm font-semibold text-text-primary">
          {t('common:smartSplit.transfers')}
        </span>
        {transfers.length > 0 && (
          <span className="ml-auto rounded-full bg-status-warning/15 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-status-warning">
            {t('common:smartSplit.aboveThreshold', {
              amount: formatEurFromCents(thresholdInCents, fmtLocale),
            })}
          </span>
        )}
      </div>

      {transfers.length > 0 ? (
        <div className="divide-y divide-border">
          {transfers.map((diff, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold wrap-break-word text-text-primary">
                  {diff.fromPerson.name}
                </span>
                <Icon name="arrow-right" size={14} className="shrink-0 text-status-warning" />
                <span className="text-sm font-semibold wrap-break-word text-text-primary">
                  {diff.toPerson.name}
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-status-warning/15 px-2.5 py-0.5 font-mono text-sm font-bold text-status-warning">
                {formatEurFromCents(diff.amountInCents, fmtLocale)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary">
          <Icon name="check" size={14} className="text-status-success" />
          {t('common:smartSplit.noTransfers')}
        </div>
      )}
    </div>
  ) : null;

  function handleStepClick(s: number) {
    void navigate(STEP_ROUTES[s], { state: { scrollRatio: getScrollRatio(), isBack: s < 3 } });
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
      {!hasResults ? (
        <Alert status="info" message={t('errors:validation.noEmployees')} />
      ) : (
        <DistributionTable
          results={displayResults}
          totalInCents={totalInCents}
          {...(isSmartMode && smartOutput.output
            ? {
                personShares: smartOutput.output.distribution.personShares,
                payoutPlans: smartOutput.output.payoutPlans,
              }
            : {})}
          belowGroups={
            <>
              {transfersCard}
              {fairnessRow}
            </>
          }
          afterSummary={settingsCard}
        />
      )}

      {/* Actions */}
      <div className="mt-8 space-y-3">
        {smartOutput.output !== null && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCancelOpen(true)}
              className="min-h-12 flex-1 text-status-error hover:bg-status-error/10 hover:text-status-error"
            >
              <Icon name="refresh-cw" size={16} />
              {t('common:actions.reset')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-12 flex-1"
              isLoading={isExporting}
              onClick={() => setExportOpen(true)}
            >
              <Icon name="download" size={16} />
              {t('common:actions.export')}
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void navigate('/calculate/cash', {
                state: { scrollRatio: getScrollRatio(), isBack: true },
              })
            }
            className="min-h-14 flex-1"
          >
            <Icon name="chevron-left" size={18} />
            {t('common:actions.back')}
          </Button>
          {activeProfile === null ? (
            <Button
              type="button"
              disabled={smartOutput.output === null}
              onClick={() => setGuestFinishOpen(true)}
              className="min-h-14 flex-2 text-base font-semibold"
            >
              {t('screens:results.finishGuest')}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={smartOutput.output === null}
              onClick={handleSaveAndFinish}
              className="min-h-14 flex-2 text-base font-semibold"
            >
              <Icon name="save" size={18} />
              {t('screens:results.saveAndFinish')}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelOpen}
        title={t('common:resetAllDialog.title')}
        message={t('common:resetAllDialog.message')}
        confirmLabel={t('common:resetAllDialog.trigger')}
        onConfirm={handleResetAll}
        onCancel={() => setCancelOpen(false)}
        variant="danger"
      />

      {/* Guest finish confirmation */}
      <ConfirmDialog
        isOpen={guestFinishOpen}
        title={t('screens:results.finishGuestDialogTitle')}
        message={t('screens:results.finishGuestDialogMessage')}
        confirmLabel={t('screens:results.finishGuest')}
        onConfirm={handleResetAll}
        onCancel={() => setGuestFinishOpen(false)}
      />

      {/* Export dialog */}
      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        context="single"
        onExportCsv={() => {
          exportCsv(normalizedResults);
          showToast(t('common:toast.csvDownloaded'), 'success');
        }}
        onExportPdf={() => {
          exportPdf(normalizedResults);
          showToast(t('common:toast.pdfOpened'), 'success');
        }}
        isProcessing={isExporting}
      />
    </ScreenContainer>
  );
}
