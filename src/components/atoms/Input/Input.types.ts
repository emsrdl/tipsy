/**
 * @file src/components/atoms/Input/Input.types.ts
 * @description Type definitions for the Input atom.
 */

import type { InputProps as ShadcnInputProps } from '@/components/ui/input'

/**
 * Props for the Tipsy Input atom.
 *
 * @property error - When truthy, applies error styling and sets aria-invalid
 * @property errorMessage - Accessible error message (linked via aria-describedby)
 */
export interface InputProps extends ShadcnInputProps {
  /** @property Applies error border and aria-invalid="true". */
  error?: boolean
  /** @property Error message text (shown externally, linked via id). */
  errorMessage?: string
}
