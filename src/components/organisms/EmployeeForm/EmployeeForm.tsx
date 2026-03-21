/**
 * @file src/components/organisms/EmployeeForm/EmployeeForm.tsx
 * @description EmployeeForm organism — full employee management UI.
 *
 * Includes: employee list with EmployeeRow, add button, kitchen/service split config.
 *
 * @example
 * <EmployeeForm />
 */

import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { EmployeeRow } from '@/components/molecules/EmployeeRow/EmployeeRow'
import { Button } from '@/components/atoms/Button/Button'
import { Icon } from '@/components/atoms/Icon/Icon'
import { FormGroup } from '@/components/molecules/FormGroup/FormGroup'
import { Input } from '@/components/atoms/Input/Input'
import { Alert } from '@/components/molecules/Alert/Alert'
import { useTipCalculator } from '@/hooks/useTipCalculator'
import type { Employee } from '@/types/employee'

function generateId(): string {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Complete employee setup form.
 * Reads and writes session state via useTipCalculator hook.
 *
 * @returns section element with employee list and split config
 *
 * @example
 * <EmployeeForm />
 */
export function EmployeeForm() {
  const { t } = useTranslation(['common', 'screens', 'errors'])
  const { session, addEmployee, removeEmployee, updateEmployee, setSplit } = useTipCalculator()

  const kitchenId = useId()
  const serviceId = useId()

  const splitError =
    session.split.kitchenPercent + session.split.servicePercent !== 100

  function handleAddEmployee() {
    const employee: Employee = {
      id: generateId(),
      name: '',
      hours: 8,
      group: 'service',
    }
    addEmployee(employee)
  }

  function handleKitchenChange(value: string) {
    const k = parseInt(value, 10)
    if (!isNaN(k) && k >= 0 && k <= 100) {
      setSplit({ kitchenPercent: k, servicePercent: 100 - k })
    }
  }

  function handleServiceChange(value: string) {
    const s = parseInt(value, 10)
    if (!isNaN(s) && s >= 0 && s <= 100) {
      setSplit({ kitchenPercent: 100 - s, servicePercent: s })
    }
  }

  return (
    <div className="space-y-4">
      {/* Employee list */}
      <div className="space-y-2">
        {session.employees.length === 0 && (
          <p className="text-sm text-text-secondary py-2">{t('screens:setup.noEmployees')}</p>
        )}
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

      {/* Add employee button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleAddEmployee}
      >
        <Icon name="plus" size={16} />
        {t('common:actions.addEmployee')}
      </Button>

      {/* Split configuration */}
      <div className="rounded-md border border-border p-4 space-y-3">
        <p className="text-sm font-medium">{t('screens:setup.splitTitle')}</p>
        <div className="flex gap-3">
          <FormGroup
            id={kitchenId}
            label={t('screens:setup.kitchenPercent')}
            error={splitError}
            className="flex-1"
          >
            <Input
              id={kitchenId}
              type="number"
              min={0}
              max={100}
              value={session.split.kitchenPercent}
              onChange={(e) => handleKitchenChange(e.target.value)}
              error={splitError}
            />
          </FormGroup>

          <FormGroup
            id={serviceId}
            label={t('screens:setup.servicePercent')}
            error={splitError}
            className="flex-1"
          >
            <Input
              id={serviceId}
              type="number"
              min={0}
              max={100}
              value={session.split.servicePercent}
              onChange={(e) => handleServiceChange(e.target.value)}
              error={splitError}
            />
          </FormGroup>
        </div>

        {splitError && (
          <Alert status="error" message={t('errors:validation.splitMustEqual100')} />
        )}
      </div>
    </div>
  )
}
