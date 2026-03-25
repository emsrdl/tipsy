/**
 * @file src/lib/validators.ts
 * @description Form validation functions for the Tipsy app.
 *
 * Each validator returns a {@link ValidationResult} with a `valid` boolean
 * and an `errors` map of field identifiers → i18n error keys.
 *
 * All validators are pure functions — no side effects, no DOM access.
 * Error keys reference the `errors` i18n namespace.
 *
 * @see src/types/calculation.ts for ValidationResult type
 * @see src/locales/de/errors.json for error message strings
 *
 * @example
 * import { validateEmployees, validateSplit } from '@/lib/validators'
 * const result = validateEmployees(session.employees)
 * if (!result.valid) showErrors(result.errors)
 */

import type { Employee } from '@/types/employee';
import type { TipSplit, DenominationQuantity } from '@/types/session';
import type { ValidationResult } from '@/types/calculation';

/** Maximum allowed employee name length. */
const MAX_NAME_LENGTH = 50;

/**
 * Validates a list of employees for the setup screen.
 *
 * Checks:
 * - At least one employee exists
 * - Every employee has a non-empty name
 * - Names do not exceed 50 characters
 * - Hours are positive numbers
 *
 * @param employees - Array of Employee objects to validate
 * @returns ValidationResult with field-specific errors
 *
 * @example
 * // Given: valid employees
 * validateEmployees([{ id: 'e1', name: 'Anna', hours: 8, group: 'service' }])
 * // { valid: true, errors: {} }
 *
 * @example
 * // Given: empty list
 * validateEmployees([])
 * // { valid: false, errors: { employees: 'errors:validation.noEmployees' } }
 *
 * @example
 * // Given: employee with empty name
 * validateEmployees([{ id: 'e1', name: '', hours: 8, group: 'service' }])
 * // { valid: false, errors: { 'employees[0].name': 'errors:validation.required' } }
 */
export function validateEmployees(employees: Employee[]): ValidationResult {
  const errors: Record<string, string> = {};

  if (employees.length === 0) {
    errors['employees'] = 'errors:validation.noEmployees';
    return { valid: false, errors };
  }

  employees.forEach((emp, i) => {
    // Name validation
    if (!emp.name || emp.name.trim() === '') {
      errors[`employees[${i}].name`] = 'errors:validation.required';
    } else if (emp.name.length > MAX_NAME_LENGTH) {
      errors[`employees[${i}].name`] = 'errors:validation.nameTooLong';
    }

    // Hours validation
    if (emp.hours <= 0) {
      errors[`employees[${i}].hours`] = 'errors:validation.hoursZero';
    }
    if (isNaN(emp.hours)) {
      errors[`employees[${i}].hours`] = 'errors:validation.invalidNumber';
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates the kitchen/service tip split configuration.
 *
 * Checks:
 * - Both percentages are non-negative
 * - Both are valid numbers
 * - They sum to exactly 100
 *
 * @param split - The TipSplit to validate
 * @returns ValidationResult with field-specific errors
 *
 * @example
 * // Given: valid 30/70 split
 * validateSplit({ kitchenPercent: 30, servicePercent: 70 })
 * // { valid: true, errors: {} }
 *
 * @example
 * // Given: invalid split that doesn't sum to 100
 * validateSplit({ kitchenPercent: 30, servicePercent: 60 })
 * // { valid: false, errors: { split: 'errors:validation.splitMustEqual100' } }
 */
export function validateSplit(split: TipSplit): ValidationResult {
  const errors: Record<string, string> = {};

  if (isNaN(split.kitchenPercent) || isNaN(split.servicePercent)) {
    errors['split'] = 'errors:validation.invalidNumber';
    return { valid: false, errors };
  }

  if (split.kitchenPercent < 0) {
    errors['split.kitchenPercent'] = 'errors:validation.negativeNotAllowed';
  }
  if (split.servicePercent < 0) {
    errors['split.servicePercent'] = 'errors:validation.negativeNotAllowed';
  }

  if (split.kitchenPercent + split.servicePercent !== 100) {
    errors['split'] = 'errors:validation.splitMustEqual100';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates denomination quantities from the cash input screen.
 *
 * Checks:
 * - No negative quantities
 * - Total is > 0 (at least some cash entered)
 * - All quantities are valid numbers
 *
 * @param denominations - Array of DenominationQuantity to validate
 * @param denominationValues - Map of denominationId → valueInCents for total computation
 * @returns ValidationResult with field-specific errors
 *
 * @example
 * // Given: valid denominations with positive total
 * validateDenominations(
 *   [{ denominationId: 'eur_10', quantity: 5 }],
 *   new Map([['eur_10', 1000]])
 * )
 * // { valid: true, errors: {} }
 *
 * @example
 * // Given: all zeros
 * validateDenominations(
 *   [{ denominationId: 'eur_10', quantity: 0 }],
 *   new Map([['eur_10', 1000]])
 * )
 * // { valid: false, errors: { total: 'errors:validation.zeroTotal' } }
 */
export function validateDenominations(
  denominations: DenominationQuantity[],
  denominationValues: Map<string, number>,
): ValidationResult {
  const errors: Record<string, string> = {};

  denominations.forEach((d, i) => {
    if (isNaN(d.quantity)) {
      errors[`denominations[${i}]`] = 'errors:validation.invalidNumber';
    } else if (d.quantity < 0) {
      errors[`denominations[${i}]`] = 'errors:validation.negativeNotAllowed';
    }
  });

  // Only check total if no individual errors
  if (Object.keys(errors).length === 0) {
    const total = denominations.reduce((sum, d) => {
      const value = denominationValues.get(d.denominationId) ?? 0;
      return sum + value * d.quantity;
    }, 0);

    if (total <= 0) {
      errors['total'] = 'errors:validation.zeroTotal';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates an entire session for readiness to calculate results.
 * Combines employee, split, and denomination validation.
 *
 * @param employees - Session employees
 * @param split - Session split configuration
 * @param denominations - Session denomination quantities
 * @param denominationValues - Map of id → valueInCents
 * @returns ValidationResult with all combined errors
 *
 * @example
 * const result = validateSession(
 *   session.employees,
 *   session.split,
 *   session.denominations,
 *   denomValueMap
 * )
 * if (result.valid) calculate()
 */
export function validateSession(
  employees: Employee[],
  split: TipSplit,
  denominations: DenominationQuantity[],
  denominationValues: Map<string, number>,
): ValidationResult {
  const empResult = validateEmployees(employees);
  const splitResult = validateSplit(split);
  const denomResult = validateDenominations(denominations, denominationValues);

  const errors = {
    ...empResult.errors,
    ...splitResult.errors,
    ...denomResult.errors,
  };

  return {
    valid: empResult.valid && splitResult.valid && denomResult.valid,
    errors,
  };
}
