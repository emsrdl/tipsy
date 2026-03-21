/**
 * @file src/components/molecules/FormGroup/FormGroup.tsx
 * @description FormGroup molecule — Label + Input + optional error message.
 *
 * Wires Label's htmlFor to Input's id automatically.
 * Shows an error message below the input when provided.
 *
 * @example
 * <FormGroup
 *   id="name"
 *   label="Name"
 *   required
 *   error={!!errors.name}
 *   errorMessage={errors.name}
 * >
 *   <Input id="name" value={name} onChange={...} />
 * </FormGroup>
 */

import type { ReactNode } from 'react'
import { Label } from '@/components/atoms/Label/Label'

export interface FormGroupProps {
  /** id passed to the Label's htmlFor. */
  id: string
  /** Label text. */
  label: string
  /** Whether to show a required asterisk on the label. */
  required?: boolean
  /** Whether the field is in error state. */
  error?: boolean
  /** Error message to display below the input. */
  errorMessage?: string
  /** The input element (Input atom or CurrencyInput). */
  children: ReactNode
  /** Additional CSS classes for the wrapper div. */
  className?: string
}

/**
 * A labeled form field with optional error messaging.
 *
 * @param props - FormGroupProps
 * @returns div containing Label, children (input), and optional error
 *
 * @example
 * <FormGroup id="hours" label="Stunden" required error={hoursError}>
 *   <Input id="hours" type="number" min={0} />
 * </FormGroup>
 */
export function FormGroup({
  id,
  label,
  required,
  error,
  errorMessage,
  children,
  className,
}: FormGroupProps) {
  const errorId = errorMessage ? `${id}-error` : undefined

  return (
    <div className={className}>
      <Label htmlFor={id} required={required ?? false} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error && errorMessage && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-status-error">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
