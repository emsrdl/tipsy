/**
 * @file src/components/atoms/Button/Button.tsx
 * @description Button atom — wraps shadcn Button with loading state.
 *
 * Adds:
 * - `isLoading` prop: shows a Spinner, disables interaction
 * - `loadingLabel`: accessible screen-reader text during loading
 *
 * All other props pass through to the underlying shadcn Button.
 *
 * @see src/components/ui/button.tsx for the shadcn base
 * @see src/components/atoms/Spinner/Spinner.tsx
 *
 * @example
 * <Button variant="default" onClick={handleSave}>Speichern</Button>
 * <Button isLoading loadingLabel="Exportieren...">PDF exportieren</Button>
 * <Button variant="outline" size="sm">Zurück</Button>
 */

import { forwardRef } from 'react'
import { Button as ShadcnButton } from '@/components/ui/button'
import { Spinner } from '../Spinner/Spinner'
import type { ButtonProps } from './Button.types'

/**
 * App-level Button atom.
 * Use this everywhere instead of the shadcn Button directly.
 *
 * @param props - ButtonProps (extends shadcn ButtonProps)
 * @returns button element
 *
 * @example
 * <Button variant="default" isLoading={isSaving}>Speichern</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isLoading = false, loadingLabel = 'Lädt...', disabled, children, ...props }, ref) => {
    return (
      <ShadcnButton ref={ref} disabled={disabled ?? isLoading} {...props}>
        {isLoading ? (
          <>
            <Spinner size="sm" aria-label={loadingLabel} />
            <span aria-hidden>{children}</span>
          </>
        ) : (
          children
        )}
      </ShadcnButton>
    )
  }
)

Button.displayName = 'Button'
