/**
 * @file src/test/factories.ts
 * @description Typed factory functions for test fixtures.
 *
 * Use these to create realistic test data without repeating boilerplate.
 * All factories accept partial overrides via the opts parameter.
 *
 * @example
 * import { makeEmployee, makeSession } from '@/test/factories'
 * const emp = makeEmployee({ name: 'Bob', hours: 6, group: 'kitchen' })
 * const session = makeSession({ employees: [emp] })
 */

import type { Employee, EmployeeGroup } from '@/types/employee'
import type { TipSession, TipSplit, DenominationQuantity, DistributionResult } from '@/types/session'

let _idCounter = 0
function nextId(): string {
  return `test-${++_idCounter}`
}

/**
 * Creates an Employee with sensible defaults.
 *
 * @param opts - Partial overrides
 * @returns Employee
 *
 * @example
 * makeEmployee({ name: 'Anna', group: 'service' })
 */
export function makeEmployee(opts: Partial<Employee> = {}): Employee {
  return {
    id: nextId(),
    name: 'Test Employee',
    hours: 8,
    group: 'service' as EmployeeGroup,
    ...opts,
  }
}

/**
 * Creates a TipSplit with a 30/70 kitchen/service default.
 *
 * @param opts - Partial overrides
 * @returns TipSplit
 *
 * @example
 * makeSplit({ kitchenPercent: 50, servicePercent: 50 })
 */
export function makeSplit(opts: Partial<TipSplit> = {}): TipSplit {
  return {
    kitchenPercent: 30,
    servicePercent: 70,
    ...opts,
  }
}

/**
 * Creates a DenominationQuantity.
 *
 * @param denominationId - The denomination id from DENOMINATIONS
 * @param quantity - How many of this denomination
 * @returns DenominationQuantity
 *
 * @example
 * makeDenomQty('eur_10', 5) // 5× €10 = €50
 */
export function makeDenomQty(denominationId: string, quantity: number): DenominationQuantity {
  return { denominationId, quantity }
}

/**
 * Creates a TipSession with sensible defaults.
 *
 * @param opts - Partial overrides
 * @returns TipSession
 *
 * @example
 * makeSession({ employees: [makeEmployee({ name: 'Anna' })] })
 */
export function makeSession(opts: Partial<TipSession> = {}): TipSession {
  return {
    employees: [makeEmployee()],
    split: makeSplit(),
    denominations: [makeDenomQty('eur_10', 10)], // €100 default
    results: null,
    ...opts,
  }
}

/**
 * Creates a DistributionResult for testing the results screen.
 *
 * @param opts - Partial overrides
 * @returns DistributionResult
 *
 * @example
 * makeResult({ name: 'Anna', amountInCents: 4500 })
 */
export function makeResult(opts: Partial<DistributionResult> = {}): DistributionResult {
  return {
    employeeId: nextId(),
    name: 'Test Employee',
    group: 'service',
    hours: 8,
    amountInCents: 1000,
    ...opts,
  }
}
