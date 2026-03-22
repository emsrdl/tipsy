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
import { Input } from '@/components/atoms/Input/Input';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Badge } from '@/components/atoms/Badge/Badge';
import { Stepper } from '../Stepper/Stepper';
import { cn } from '@/lib/utils';
import type { EmployeeRowProps } from './EmployeeRow.types';

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
}: EmployeeRowProps) {
  const { t } = useTranslation(['screens', 'common']);

  return (
    <div className="overflow-hidden rounded-xl bg-surface-raised shadow-elevation-1">
      {/* Header row: name input + remove button */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <div className="min-w-0 flex-1 space-y-1">
          {employee.isProfileOwner && (
            <Badge
              variant="default"
              className="bg-accent/10 w-fit gap-1 border-0 text-xs text-accent"
            >
              <Icon name="user" size={10} />
              {t('common:profile.thisIsYou')}
            </Badge>
          )}
          <Input
            value={employee.name}
            onChange={(e) => onNameChange(employee.id, e.target.value)}
            placeholder={t('screens:setup.employeeNamePlaceholder')}
            className="h-12 w-full rounded-lg border-border text-base focus-visible:ring-accent"
            aria-label={t('screens:setup.employeeNameLabel')}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(employee.id)}
          aria-label={t('common:actions.removeEmployee')}
          className={cn(
            'ripple flex h-12 w-12 flex-shrink-0 items-center justify-center',
            'rounded-full text-text-secondary transition-colors',
            'hover:bg-red-50 hover:text-status-error',
            'active:bg-red-100',
          )}
        >
          <Icon name="trash" size={18} />
        </button>
      </div>

      {/* Group chips */}
      <div className="flex gap-2 px-4 pb-3">
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
        <button
          type="button"
          onClick={() => onGroupChange(employee.id, 'service')}
          aria-pressed={employee.group === 'service'}
          className={cn(
            'ripple flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all',
            employee.group === 'service'
              ? 'bg-accent-subtle text-accent shadow-elevation-1'
              : 'hover:bg-surface-overlay/80 bg-surface-overlay text-text-secondary',
          )}
        >
          <Icon name="users" size={16} />
          {t('screens:setup.groupService')}
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
