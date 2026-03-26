/**
 * @file src/components/molecules/EmployeeRow/EmployeeRow.tsx
 * @description EmployeeRow molecule — Material card for a single employee entry.
 *
 * Touch-first redesign:
 * - Full Material card with elevation shadow
 * - Large name input (full width)
 * - Group selection via tappable chips (48px touch targets)
 * - Hours via Stepper (touch +/- buttons, no keyboard needed)
 * - Remove button in card header
 *
 * @example
 * <EmployeeRow
 *   employee={emp}
 *   onRemove={removeEmployee}
 *   onNameChange={updateEmployee}
 *   onHoursChange={updateEmployee}
 *   onGroupChange={updateEmployee}
 * />
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/atoms/Input/Input';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Stepper } from '../Stepper/Stepper';
import { cn } from '@/lib/utils';
import type { EmployeeRowProps } from './EmployeeRow.types';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

/**
 * Material card for editing a single employee's details.
 * Touch targets are all 48px+ for mobile use.
 *
 * @param props - EmployeeRowProps
 * @returns Material card with name input, group chips, and hours stepper
 *
 * @example
 * <EmployeeRow employee={e} onRemove={remove} onNameChange={update} ... />
 */
export function EmployeeRow({
  employee,
  onRemove,
  onNameChange,
  onHoursChange,
  onGroupChange,
  fallbackName,
}: EmployeeRowProps) {
  const { t } = useTranslation(['screens', 'common']);
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1">
      {employee.isProfileOwner ? (
        /* Material List Item: leading avatar · name · trailing edit */
        <>
          <div className="flex items-center justify-center gap-1.5 px-4 pt-3 text-xs text-accent">
            <Icon name="user" size={11} />
            {t('common:profile.thisIsYou')}
          </div>
          <div className="flex items-center gap-3 px-4 pb-3 pt-1.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {getInitials(employee.name) || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{employee.name}</p>
            </div>
            <button
              type="button"
              onClick={() => void navigate('/settings')}
              aria-label={t('common:profile.headerMenu.editProfile')}
              className="ripple flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-overlay hover:text-accent"
            >
              <Icon name="edit-2" size={18} />
            </button>
          </div>
        </>
      ) : (
        /* Regular employee: name input + delete button */
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <Input
            value={employee.name}
            onChange={(e) => onNameChange(employee.id, e.target.value)}
            placeholder={fallbackName}
            className="h-12 w-full rounded-lg border-border text-base focus-visible:ring-accent"
            aria-label={t('screens:setup.employeeNameLabel')}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => onRemove(employee.id)}
            aria-label={t('common:actions.removeEmployee')}
            className={cn(
              'ripple flex h-12 w-12 shrink-0 items-center justify-center',
              'rounded-full text-text-secondary transition-colors',
              'hover:bg-red-50 hover:text-status-error',
              'active:bg-red-100',
            )}
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      )}

      {/* Group chips */}
      <div className="flex gap-2 px-4 pb-3">
        <button
          type="button"
          onClick={() => onGroupChange(employee.id, 'service')}
          aria-pressed={employee.group === 'service'}
          className={cn(
            'ripple flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all',
            employee.group === 'service'
              ? 'bg-teal-100 text-teal-800 shadow-elevation-1 dark:bg-teal-900/40 dark:text-teal-300'
              : 'hover:bg-surface-overlay/80 bg-surface-overlay text-text-secondary',
          )}
        >
          <Icon name="users" size={16} />
          {t('screens:setup.groupService')}
        </button>
        <button
          type="button"
          onClick={() => onGroupChange(employee.id, 'kitchen')}
          aria-pressed={employee.group === 'kitchen'}
          className={cn(
            'ripple flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all',
            employee.group === 'kitchen'
              ? 'bg-orange-100 text-orange-800 shadow-elevation-1 dark:bg-orange-900/40 dark:text-orange-300'
              : 'hover:bg-surface-overlay/80 bg-surface-overlay text-text-secondary',
          )}
        >
          <Icon name="utensils-crossed" size={16} />
          {t('screens:setup.groupKitchen')}
        </button>
      </div>

      {/* Hours stepper */}
      <div className="flex items-center justify-between border-t border-border px-4 pb-4 pt-1">
        <div className="flex items-center gap-2">
          <Icon name="clock" size={15} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">{t('screens:setup.hoursLabel')}</span>
        </div>
        <Stepper
          value={employee.hours}
          onChange={(hours) => onHoursChange(employee.id, hours)}
          min={0}
          max={24}
          step={0.5}
          unit="h"
          size="md"
          aria-label={t('screens:setup.hoursLabel')}
        />
      </div>
    </div>
  );
}
