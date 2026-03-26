/**
 * @file src/components/molecules/EmployeeRow/EmployeeRow.types.ts
 * @description Type definitions for the EmployeeRow molecule.
 */

import type { Employee } from '@/types/employee';

export interface EmployeeRowProps {
  /** The employee to display. */
  employee: Employee;
  /** Called when the remove button is clicked. */
  onRemove: (id: string) => void;
  /** Called when name is changed. */
  onNameChange: (id: string, name: string) => void;
  /** Called when hours is changed. */
  onHoursChange: (id: string, hours: number) => void;
  /** Called when group is toggled. */
  onGroupChange: (id: string, group: 'kitchen' | 'service') => void;
  /** Used as the name when the user leaves the field empty. */
  fallbackName: string;
}
