/**
 * @file src/components/organisms/EmployeeForm/EmployeeForm.tsx
 * @description EmployeeForm organism — Material card-based employee management.
 *
 * Touch-first redesign:
 * - Each employee as a Material card (EmployeeRow)
 * - Large 56px FAB-style "Add Employee" button
 * - Material Slider for kitchen/service split (no keyboard)
 * - Live split display with percentage badges
 *
 * @example
 * <EmployeeForm />
 */

import { useTranslation } from 'react-i18next';
import { EmployeeRow } from '@/components/molecules/EmployeeRow/EmployeeRow';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Slider } from '@/components/molecules/Slider/Slider';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import type { Employee } from '@/types/employee';

function generateId(): string {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Complete employee setup form with Material Design interactions.
 * Reads and writes session state via useTipCalculator hook.
 *
 * @returns section with employee cards, add button, and split slider
 *
 * @example
 * <EmployeeForm />
 */
export function EmployeeForm() {
  const { t } = useTranslation(['common', 'screens', 'errors']);
  const { session, addEmployee, removeEmployee, updateEmployee, setSplit } = useTipCalculator();

  const splitError = session.split.kitchenPercent + session.split.servicePercent !== 100;

  function handleAddEmployee() {
    const n = session.employees.length + 1;
    const employee: Employee = {
      id: generateId(),
      name: t('screens:setup.defaultEmployeeName', { n }),
      hours: 8,
      group: 'service',
    };
    addEmployee(employee);
  }

  return (
    <div className="space-y-4">
      {/* Employee cards */}
      {session.employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-overlay">
            <Icon name="users" size={28} className="text-text-secondary" />
          </div>
          <p className="mb-1 text-base font-medium text-text-primary">
            {t('screens:setup.noEmployees')}
          </p>
          <p className="text-sm text-text-secondary">{t('screens:setup.subtitle')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {session.employees.map((emp) => (
            <EmployeeRow
              key={emp.id}
              employee={emp}
              onRemove={removeEmployee}
              onNameChange={(id, name) => updateEmployee(id, { name })}
              onHoursChange={(id, hours) => updateEmployee(id, { hours })}
              onGroupChange={(id, group) => updateEmployee(id, { group })}
            />
          ))}
        </div>
      )}

      {/* Add employee — large touch button */}
      <Button
        type="button"
        variant="outline"
        className="border-accent/50 min-h-14 w-full gap-3 rounded-xl border-2 border-dashed text-base text-accent hover:border-accent hover:bg-accent-subtle"
        onClick={handleAddEmployee}
      >
        <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-full">
          <Icon name="plus" size={18} className="text-accent" />
        </div>
        {t('common:actions.addEmployee')}
      </Button>

      {/* Kitchen / Service split — Material Slider */}
      <div className="space-y-4 rounded-xl bg-surface-raised p-4 shadow-elevation-1">
        <div className="flex items-center gap-2">
          <Icon name="utensils-crossed" size={16} className="text-text-secondary" />
          <p className="text-sm font-semibold text-text-primary">{t('screens:setup.splitTitle')}</p>
        </div>

        <Slider
          value={session.split.kitchenPercent}
          onChange={(k) => setSplit({ kitchenPercent: k, servicePercent: 100 - k })}
          label={t('screens:setup.groupKitchen')}
          counterLabel={t('screens:setup.groupService')}
          aria-label={t('screens:setup.splitTitle')}
        />

        {splitError && (
          <p className="text-xs text-status-error">{t('errors:validation.splitMustEqual100')}</p>
        )}
      </div>
    </div>
  );
}
