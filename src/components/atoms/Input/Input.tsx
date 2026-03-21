/**
 * @file src/components/atoms/Input/Input.tsx
 * @description Input atom — wraps shadcn Input with error state.
 *
 * Adds:
 * - `error` prop: applies red border, sets aria-invalid
 * - `errorMessage`: aria-describedby link for screen readers
 *
 * @see src/components/ui/input.tsx for the shadcn base
 * @see src/components/molecules/FormGroup for typical usage with Label
 *
 * @example
 * <Input placeholder="Name" />
 * <Input type="number" error errorMessage="errors.validation.required" id="hours" />
 */

import { forwardRef } from 'react'
import { Input as ShadcnInput } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { InputProps } from './Input.types'

/**
 * App-level Input atom.
 *
 * @param props - InputProps
 * @returns input element
 *
 * @example
 * <Input type="number" min={0} error={hasError} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, errorMessage, id, className, ...props }, ref) => {
    const errorDescId = errorMessage && id ? `${id}-error` : undefined

    return (
      <ShadcnInput
        ref={ref}
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorDescId}
        className={cn(error && 'border-status-error focus-visible:ring-status-error', className)}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
