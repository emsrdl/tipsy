/**
 * @file src/components/atoms/Button/Button.types.ts
 * @description Type definitions for the Button atom.
 */

import type { ButtonProps as ShadcnButtonProps } from '@/components/ui/button'

/**
 * Props for the Tipsy Button atom.
 *
 * @property isLoading - Shows a Spinner and disables interaction when true
 * @property loadingLabel - Screen-reader text during loading state
 */
export interface ButtonProps extends ShadcnButtonProps {
  /** @property Shows spinner and disables button. */
  isLoading?: boolean
  /** @property Accessible label shown to screen readers during loading. @default "Lädt..." */
  loadingLabel?: string
}
