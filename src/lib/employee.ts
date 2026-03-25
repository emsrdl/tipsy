/**
 * @file src/lib/employee.ts
 * @description Utility helpers for employee display logic.
 */

/**
 * Returns the employee's name, or the fallback name if the name is empty.
 * Use this wherever an employee name is displayed to ensure consistent fallback behavior.
 *
 * @param name - The employee's stored name (may be empty)
 * @param fallbackName - The fallback to use when name is empty (e.g. "Mitarbeiter 2")
 */
export function resolveEmployeeName(name: string, fallbackName: string): string {
  return name.trim() || fallbackName;
}
