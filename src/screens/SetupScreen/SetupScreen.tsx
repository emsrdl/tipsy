/**
 * @file src/screens/SetupScreen/SetupScreen.tsx
 * @description Setup screen — add employees, configure split, select profile.
 *
 * Step 1 of 3 in the calculation flow.
 * Includes: profile selector, employee list, split slider, smart split toggle.
 * Auto-adds the active profile as the first employee.
 *
 * @example
 * // Rendered via React Router at route "/calculate"
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer';
import { EmployeeForm } from '@/components/organisms/EmployeeForm/EmployeeForm';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import { useProfiles } from '@/hooks/useProfiles';
import { useToast } from '@/context/ToastContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  SMART_SPLIT_ENABLED,
  SMART_SPLIT_THRESHOLD_KEY,
  SMART_SPLIT_DEFAULT_THRESHOLD_KEY,
  DEFAULT_FAIRNESS_THRESHOLD,
  readDefaultKitchenPercent,
} from '@/config/smartSplit';
import { cn } from '@/lib/utils';

/** Prefix used to identify profile-owned employees. */
const PROFILE_EMP_PREFIX = 'profile-emp-';

/**
 * Setup screen — step 1 of 3.
 */
export function SetupScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors']);
  const navigate = useNavigate();
  const { session, addEmployee, removeEmployee, updateEmployee, setSplit, wasRestored } =
    useTipCalculator();
  const { activeProfile, isGuestMode } = useProfiles();
  const { showToast } = useToast();
  const [showSmartHelp, setShowSmartHelp] = useState(false);

  const [isSmartMode, setIsSmartMode] = useLocalStorage('tipsy_smart_mode', SMART_SPLIT_ENABLED);
  const [threshold, setThreshold] = useLocalStorage<number>(
    SMART_SPLIT_THRESHOLD_KEY,
    DEFAULT_FAIRNESS_THRESHOLD,
  );
  const [defaultThreshold] = useLocalStorage<number>(
    SMART_SPLIT_DEFAULT_THRESHOLD_KEY,
    DEFAULT_FAIRNESS_THRESHOLD,
  );

  // Custom threshold input state (in euros for display, stored as cents)
  const [thresholdInputValue, setThresholdInputValue] = useState((threshold / 100).toFixed(2));
  const thresholdInputRef = useRef<HTMLInputElement>(null);

  const hasEmployees = session.employees.length > 0;
  const splitValid = session.split.kitchenPercent + session.split.servicePercent === 100;
  const canContinue = hasEmployees && splitValid;

  // Show session restore toast once per page session
  useEffect(() => {
    if (!wasRestored) return;
    const alreadyShown = sessionStorage.getItem('tipsy_restore_toast_shown');
    if (!alreadyShown) {
      sessionStorage.setItem('tipsy_restore_toast_shown', '1');
      showToast(t('common:toast.sessionRestored'), 'info');
    }
  }, [wasRestored, showToast, t]);

  // Auto-add/update/remove the profile employee when active profile changes
  useEffect(() => {
    if (isGuestMode || !activeProfile) {
      // Remove any profile-owned employee when entering guest mode
      const profileEmp = session.employees.find((e) => e.id.startsWith(PROFILE_EMP_PREFIX));
      if (profileEmp) removeEmployee(profileEmp.id);
      return;
    }

    const profileEmpId = `${PROFILE_EMP_PREFIX}${activeProfile.id}`;

    // Remove stale profile employee (from a previously active profile)
    const staleProfileEmp = session.employees.find(
      (e) => e.id.startsWith(PROFILE_EMP_PREFIX) && e.id !== profileEmpId,
    );
    if (staleProfileEmp) removeEmployee(staleProfileEmp.id);

    // Add or sync the current profile employee
    const existing = session.employees.find((e) => e.id === profileEmpId);
    if (!existing) {
      addEmployee({
        id: profileEmpId,
        name: activeProfile.name,
        hours: 8,
        group: activeProfile.role,
        isProfileOwner: true,
      });
    } else if (
      existing.name !== activeProfile.name ||
      existing.group !== activeProfile.role ||
      !existing.isProfileOwner
    ) {
      updateEmployee(profileEmpId, {
        name: activeProfile.name,
        group: activeProfile.role,
        isProfileOwner: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id, activeProfile?.name, activeProfile?.role, isGuestMode]);

  function handleThresholdInputChange(value: string) {
    setThresholdInputValue(value);
    const parsed = parseFloat(value.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 50) {
      setThreshold(Math.round(parsed * 100));
    }
  }

  function handleThresholdInputBlur() {
    const parsed = parseFloat(thresholdInputValue.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0.5) {
      setThresholdInputValue((DEFAULT_FAIRNESS_THRESHOLD / 100).toFixed(2));
      setThreshold(DEFAULT_FAIRNESS_THRESHOLD);
    } else {
      const clamped = Math.min(Math.max(parsed, 0.5), 50);
      setThresholdInputValue(clamped.toFixed(2));
      setThreshold(Math.round(clamped * 100));
    }
  }

  function handleResetPage() {
    session.employees.forEach((e) => {
      if (!e.isProfileOwner) removeEmployee(e.id);
    });
    if (activeProfile) {
      const profileEmpId = `${PROFILE_EMP_PREFIX}${activeProfile.id}`;
      updateEmployee(profileEmpId, { hours: 8, group: activeProfile.role });
    }
    const k = readDefaultKitchenPercent();
    setSplit({ kitchenPercent: k, servicePercent: 100 - k });
    setIsSmartMode(SMART_SPLIT_ENABLED);
    setThreshold(defaultThreshold);
    setThresholdInputValue((defaultThreshold / 100).toFixed(2));
    showToast(t('common:toast.pageReset'), 'info');
  }

  function handleNext() {
    if (!canContinue) {
      if (!hasEmployees) showToast(t('errors:validation.noEmployees'), 'error');
      return;
    }
    void navigate('/calculate/cash');
  }

  return (
    <ScreenContainer
      title={t('screens:setup.title')}
      subtitle={t('screens:setup.subtitle')}
      step={1}
      totalSteps={3}
    >
      {/* Reset page — upper right */}
      <div className="mb-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={handleResetPage}
          className="min-h-10 gap-1.5 text-sm text-text-secondary"
        >
          <Icon name="refresh-cw" size={14} />
          {t('screens:setup.resetPage')}
        </Button>
      </div>

      <EmployeeForm />

      {/* Smart Split toggle */}
      <div className="mt-4 space-y-3 rounded-xl bg-surface-raised p-4 shadow-elevation-1">
        <button
          type="button"
          onClick={() => {
            setIsSmartMode(!isSmartMode);
            setShowSmartHelp(false);
          }}
          className="flex min-h-12 w-full items-center justify-between gap-3"
          aria-pressed={isSmartMode}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                isSmartMode ? 'bg-accent/10' : 'bg-surface-overlay',
              )}
            >
              <Icon
                name="zap"
                size={18}
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
                {isSmartMode ? t('common:smartSplit.descSmart') : t('common:smartSplit.descNormal')}
              </p>
            </div>
          </div>
          <Icon
            name={isSmartMode ? 'toggle-right' : 'toggle-left'}
            size={32}
            className={isSmartMode ? 'text-accent' : 'text-text-secondary'}
          />
        </button>

        {/* Threshold — shown when smart mode is on */}
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
                    value={thresholdInputValue}
                    onChange={(e) => handleThresholdInputChange(e.target.value)}
                    onBlur={handleThresholdInputBlur}
                    className="h-9 w-20 rounded-lg border border-border bg-surface-overlay px-2 text-center font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                  <span className="text-sm text-text-secondary">€</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSmartHelp(!showSmartHelp)}
                className="whitespace-nowrap text-xs text-accent underline"
              >
                {showSmartHelp ? t('common:smartSplit.helpClose') : t('common:smartSplit.helpWhat')}
              </button>
            </div>
            {showSmartHelp && (
              <p className="rounded-lg bg-surface-overlay p-3 text-xs text-text-secondary">
                {t('common:smartSplit.helpText')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <Button
          type="button"
          disabled={!canContinue}
          onClick={handleNext}
          className="min-h-14 w-full text-base font-semibold"
        >
          {t('common:actions.next')}
          <Icon name="chevron-right" size={18} />
        </Button>
      </div>
    </ScreenContainer>
  );
}
