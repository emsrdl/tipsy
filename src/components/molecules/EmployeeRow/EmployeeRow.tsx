/**
 * @file src/components/molecules/EmployeeRow/EmployeeRow.tsx
 * @description EmployeeRow molecule — a single editable employee entry.
 *
 * Displays name input, hours input, group toggle (Küche/Service), and remove button.
 * Used inside EmployeeForm.
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

import { useTranslation } from 'react-i18next'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Icon } from '@/components/atoms/Icon/Icon'
import type { EmployeeRowProps } from './EmployeeRow.types'

/**
 * Inline editor for a single employee.
 *
 * @param props - EmployeeRowProps
 * @returns div containing all employee fields
 *
 * @example
 * <EmployeeRow employee={e} onRemove={remove} onNameChange={update} ... />
 */
export function EmployeeRow({ employee, onRemove, onNameChange, onHoursChange, onGroupChange }: EmployeeRowProps) {
  const { t } = useTranslation('screens')

  function handleHoursChange(value: string) {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed >= 0) onHoursChange(employee.id, parsed)
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface-raised p-2">
      {/* Name */}
      <Input
        value={employee.name}
        onChange={(e) => onNameChange(employee.id, e.target.value)}
        placeholder={t('setup.employeeNamePlaceholder')}
        className="flex-1 min-w-0"
        aria-label={t('setup.employeeNameLabel')}
      />

      {/* Hours */}
      <Input
        type="number"
        min={0}
        step={0.5}
        value={employee.hours || ''}
        onChange={(e) => handleHoursChange(e.target.value)}
        placeholder={t('setup.hoursPlaceholder')}
        className="w-16 text-center"
        aria-label={t('setup.hoursLabel')}
      />

      {/* Group toggle */}
      <button
        type="button"
        onClick={() => onGroupChange(employee.id, employee.group === 'kitchen' ? 'service' : 'kitchen')}
        title={t('setup.groupLabel')}
        className="shrink-0"
      >
        <Badge variant={employee.group === 'kitchen' ? 'kitchen' : 'service'}>
          {employee.group === 'kitchen' ? t('setup.groupKitchen') : t('setup.groupService')}
        </Badge>
      </button>

      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-text-secondary hover:text-status-error"
        onClick={() => onRemove(employee.id)}
        aria-label={t('actions.removeEmployee', { ns: 'common' })}
      >
        <Icon name="trash" size={14} />
      </Button>
    </div>
  )
}
