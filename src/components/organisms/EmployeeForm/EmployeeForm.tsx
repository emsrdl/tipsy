/**
 * @file src/components/organisms/EmployeeForm/EmployeeForm.tsx
 * @description EmployeeForm organism — Material card-based employee management.
 *
 * Touch-first redesign:
 * - Each employee as a Material card (EmployeeRow)
 * - Large 56px FAB-style "Add Employee" button
 *
 * @example
 * <EmployeeForm />
 */

import { useTranslation } from 'react-i18next';
import { EmployeeRow } from '@/components/molecules/EmployeeRow/EmployeeRow';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import type { Employee } from '@/types/employee';

function generateId(): string {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Complete employee setup form with Material Design interactions.
 * Reads and writes session state via useTipCalculator hook.
 *
 * @returns section with employee cards and add button
 *
 * @example
 * <EmployeeForm />
 */
export function EmployeeForm() {
  const { t } = useTranslation(['common', 'screens', 'errors']);
  const { session, addEmployee, removeEmployee, updateEmployee } = useTipCalculator();
  const sortedEmployees = [...session.employees].sort((a, b) => {
    const aIsProfile = a.id.startsWith('profile-emp-');
    const bIsProfile = b.id.startsWith('profile-emp-');
    if (aIsProfile === bIsProfile) return 0;
    return aIsProfile ? -1 : 1;
  });

  function handleAddEmployee() {
    const employee: Employee = {
      id: generateId(),
      name: '',
      hours: 8,
      group: 'service',
    };
    addEmployee(employee);
    setTimeout(() => {
      const scroller = document.getElementById('main-scroll');
      if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    }, 0);
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
          {(() => {
            let nonProfileCount = 0;
            return sortedEmployees.map((emp) => {
              const isProfileOwner = emp.id.startsWith('profile-emp-');
              if (!isProfileOwner) nonProfileCount++;
              return (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  fallbackName={t('screens:setup.defaultEmployeeName', { n: nonProfileCount || 1 })}
                  onRemove={removeEmployee}
                  onNameChange={(id, name) => updateEmployee(id, { name })}
                  onHoursChange={(id, hours) => updateEmployee(id, { hours })}
                  onGroupChange={(id, group) => updateEmployee(id, { group })}
                />
              );
            });
          })()}
        </div>
      )}

      {/* Add employee — large touch button */}
      <Button
        type="button"
        variant="outline"
        className="min-h-14 w-full gap-3 rounded-xl border-2 border-dashed border-accent/50 text-base text-accent hover:border-accent hover:bg-accent-subtle"
        onClick={handleAddEmployee}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
          <Icon name="plus" size={18} className="text-accent" />
        </div>
        {t('common:actions.addEmployee')}
      </Button>
    </div>
  );
}
