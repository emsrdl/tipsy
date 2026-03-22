/**
 * @file src/lib/tipCalculator.ts
 * @description Core tip distribution algorithm.
 *
 * Distributes a total cash amount among employees proportionally by hours,
 * within a kitchen/service split.
 *
 * Algorithm:
 *   1. Split total into kitchen pool and service pool (by kitchenPercent)
 *   2. For each group, distribute proportionally by hours worked
 *   3. Distribute integer cents using floor + remainder method:
 *      each employee gets floor(share), then the remainder cents are
 *      given one at a time to the employees with the largest fractional parts
 *      (ties broken by hours descending, then name ascending)
 *
 * All monetary values are in integer euro cents to avoid floating-point drift.
 *
 * @see src/types/session.ts for Employee, TipSplit, DistributionResult
 * @see src/lib/denominationParser.ts for computing the total from denominations
 *
 * @example
 * import { calculateDistribution } from '@/lib/tipCalculator'
 * const results = calculateDistribution({
 *   totalInCents: 10000,
 *   employees: [
 *     { id: 'e1', name: 'Anna', hours: 8, group: 'service' },
 *     { id: 'e2', name: 'Bob',  hours: 4, group: 'service' },
 *   ],
 *   split: { kitchenPercent: 0, servicePercent: 100 },
 * })
 * // Anna: €66.67, Bob: €33.33
 */

import type { Employee } from '@/types/employee'
import type { TipSplit, DistributionResult } from '@/types/session'

export interface CalculateDistributionInput {
  /** Total cash collected, in euro cents. */
  totalInCents: number
  /** All participating employees. */
  employees: Employee[]
  /** How to split total between kitchen and service pools. */
  split: TipSplit
}

/**
 * Distributes the tip total among employees proportionally by hours.
 *
 * Returns an empty array if totalInCents is 0 or employees is empty.
 * Each employee's amountInCents is a non-negative integer.
 * The sum of all amountInCents equals totalInCents exactly.
 *
 * @param input - Total, employees, and split config
 * @returns Array of DistributionResult, one per employee
 *
 * @example
 * calculateDistribution({
 *   totalInCents: 10000,
 *   employees: [{ id: 'e1', name: 'Anna', hours: 8, group: 'service' }],
 *   split: { kitchenPercent: 0, servicePercent: 100 },
 * })
 * // [{ employeeId: 'e1', name: 'Anna', group: 'service', hours: 8, amountInCents: 10000 }]
 */
export function calculateDistribution(input: CalculateDistributionInput): DistributionResult[] {
  const { totalInCents, employees, split } = input

  if (totalInCents <= 0 || employees.length === 0) return []

  const kitchenEmployees = employees.filter((e) => e.group === 'kitchen')
  const serviceEmployees = employees.filter((e) => e.group === 'service')

  // When one group has no employees, give the entire total to the other group
  // instead of losing that group's pool to nobody.
  const hasKitchen = kitchenEmployees.length > 0
  const hasService = serviceEmployees.length > 0

  let kitchenPool: number
  let servicePool: number

  if (!hasKitchen && hasService) {
    // No kitchen staff — all tips go to service
    kitchenPool = 0
    servicePool = totalInCents
  } else if (hasKitchen && !hasService) {
    // No service staff — all tips go to kitchen
    kitchenPool = totalInCents
    servicePool = 0
  } else {
    // Both groups present — apply the split (floor kitchen, remainder to service)
    kitchenPool = Math.floor((totalInCents * split.kitchenPercent) / 100)
    servicePool = totalInCents - kitchenPool
  }

  const kitchenResults = distributePool(kitchenPool, kitchenEmployees)
  const serviceResults = distributePool(servicePool, serviceEmployees)

  return [...kitchenResults, ...serviceResults]
}

/**
 * Distributes a pool amount among a group of employees by hours.
 *
 * Uses floor + remainder allocation so the sum is exact.
 * If the group has no employees (or zero total hours), everyone gets 0.
 *
 * @param poolInCents - The amount to distribute within this group
 * @param employees - Employees in this group
 * @returns DistributionResult array
 */
function distributePool(poolInCents: number, employees: Employee[]): DistributionResult[] {
  if (employees.length === 0) return []

  const totalHours = employees.reduce((sum, e) => sum + e.hours, 0)

  if (totalHours === 0 || poolInCents === 0) {
    return employees.map((e) => toResult(e, 0))
  }

  // Compute exact share per employee as a float
  const shares = employees.map((e) => ({
    employee: e,
    exactCents: (poolInCents * e.hours) / totalHours,
    floored: Math.floor((poolInCents * e.hours) / totalHours),
    fractional: ((poolInCents * e.hours) / totalHours) % 1,
  }))

  const distributedSoFar = shares.reduce((sum, s) => sum + s.floored, 0)
  let remainder = poolInCents - distributedSoFar

  // Sort by fractional part descending to determine who gets the extra cents
  // Ties broken by hours descending, then name ascending for determinism
  const sorted = [...shares].sort((a, b) => {
    if (b.fractional !== a.fractional) return b.fractional - a.fractional
    if (b.employee.hours !== a.employee.hours) return b.employee.hours - a.employee.hours
    return a.employee.name.localeCompare(b.employee.name)
  })

  const bonusCents = new Map<string, number>()
  for (const s of sorted) {
    if (remainder <= 0) break
    bonusCents.set(s.employee.id, 1)
    remainder--
  }

  return shares.map((s) => toResult(s.employee, s.floored + (bonusCents.get(s.employee.id) ?? 0)))
}

function toResult(employee: Employee, amountInCents: number): DistributionResult {
  return {
    employeeId: employee.id,
    name: employee.name,
    group: employee.group,
    hours: employee.hours,
    amountInCents,
  }
}
