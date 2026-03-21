/**
 * @file src/types/employee.ts
 * @description Types for restaurant staff members.
 *
 * An employee belongs to either the kitchen or service group,
 * which determines which tip pool they draw from.
 *
 * @see src/types/session.ts for the full session type using these
 * @see src/lib/tipCalculator.ts for distribution logic
 */

/** Which tip pool an employee belongs to. */
export type EmployeeGroup = 'kitchen' | 'service'

/**
 * A single staff member participating in tip distribution.
 *
 * @example
 * const emp: Employee = { id: 'e1', name: 'Anna', hours: 8, group: 'service' }
 */
export interface Employee {
  /** Unique identifier (generated at creation time). */
  id: string
  /** Display name. */
  name: string
  /** Hours worked this period (used for proportional distribution). */
  hours: number
  /** Which tip pool this employee draws from. */
  group: EmployeeGroup
  /** Whether this employee was auto-added from the active profile. */
  isProfileOwner?: boolean
}
