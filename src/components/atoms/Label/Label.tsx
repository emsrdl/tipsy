/**
 * @file src/components/atoms/Label/Label.tsx
 * @description Label atom — wraps shadcn Label with required marker.
 *
 * Adds:
 * - `required` prop: appends a red asterisk (*) for required fields
 *
 * @see src/components/ui/label.tsx for the shadcn base
 *
 * @example
 * <Label htmlFor="name" required>Name</Label>
 * <Label htmlFor="hours">Stunden</Label>
 */

import type { ComponentPropsWithoutRef } from 'react'
import { Label as ShadcnLabel } from '@/components/ui/label'

export interface LabelProps extends ComponentPropsWithoutRef<typeof ShadcnLabel> {
  /** @property Appends a red asterisk to indicate a required field. */
  required?: boolean
}

/**
 * App-level Label atom.
 *
 * @param props - LabelProps
 * @returns label element
 *
 * @example
 * <Label htmlFor="name" required>Name</Label>
 */
export function Label({ required, children, ...props }: LabelProps) {
  return (
    <ShadcnLabel {...props}>
      {children}
      {required && (
        <span aria-hidden className="ml-0.5 text-status-error">
          *
        </span>
      )}
    </ShadcnLabel>
  )
}
