/**
 * @file src/screens/SetupScreen/SetupScreen.tsx
 * @description Setup screen — add employees, select profile.
 *
 * Step 1 of 3 in the calculation flow.
 * Includes: profile selector, employee list.
 * Auto-adds the active profile as the first employee.
 *
 * @example
 * // Rendered via React Router at route "/calculate"
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer';
import { EmployeeForm } from '@/components/organisms/EmployeeForm/EmployeeForm';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import { useProfiles } from '@/hooks/useProfiles';
import { useToast } from '@/context/ToastContext';
import { readDefaultKitchenPercent } from '@/config/smartSplit';

/** Prefix used to identify profile-owned employees. */
const PROFILE_EMP_PREFIX = 'profile-emp-';

const STEP_ROUTES: Record<number, string> = {
  1: '/calculate',
  2: '/calculate/cash',
  3: '/calculate/results',
};

/**
 * Setup screen — step 1 of 3.
 */
export function SetupScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors']);
  const navigate = useNavigate();
  const { session, totalInCents, addEmployee, removeEmployee, updateEmployee, setSplit, calculate, reset, wasRestored } =
    useTipCalculator();
  const { activeProfile } = useProfiles();
  const { showToast } = useToast();

  const hasEmployees = session.employees.length > 0;
  const canContinue = hasEmployees;
  const step2Valid = totalInCents > 0;

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
    if (activeProfile === null) {
      // Remove any profile-owned employee when signed out
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
  }, [activeProfile?.id, activeProfile?.name, activeProfile?.role]);

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
    showToast(t('common:toast.pageReset'), 'info');
  }

  function handleResetAll() {
    reset();
    if (activeProfile) {
      addEmployee({
        id: `${PROFILE_EMP_PREFIX}${activeProfile.id}`,
        name: activeProfile.name,
        hours: 8,
        group: activeProfile.role,
        isProfileOwner: true,
      });
    }
    showToast(t('common:toast.allReset'), 'info');
  }

  function handleNext() {
    if (!canContinue) {
      if (!hasEmployees) showToast(t('errors:validation.noEmployees'), 'error');
      return;
    }
    void navigate('/calculate/cash');
  }

  const maxReachableStep = canContinue && step2Valid ? 3 : canContinue ? 2 : 1;

  function handleStepClick(s: number) {
    if (s === 3) calculate();
    void navigate(STEP_ROUTES[s]);
  }

  return (
    <ScreenContainer
      title={t('screens:setup.title')}
      subtitle={t('screens:setup.subtitle')}
      step={1}
      totalSteps={3}
      maxReachableStep={maxReachableStep}
      onStepClick={handleStepClick}
      onReset={handleResetAll}
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
