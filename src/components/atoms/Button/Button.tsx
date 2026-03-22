/**
 * @file src/components/atoms/Button/Button.tsx
 * @description Button atom — wraps shadcn Button with loading state and Material touch feedback.
 *
 * Touch-first design:
 * - Default/outline/destructive variants: min-h-12 (48px) for Material touch targets
 * - Icon variant: 48×48px touch target
 * - Ripple state layer on press
 *
 * @see src/components/ui/button.tsx for the shadcn base
 * @see src/components/atoms/Spinner/Spinner.tsx
 *
 * @example
 * <Button variant="default" onClick={handleSave}>Speichern</Button>
 * <Button isLoading loadingLabel="Exportieren...">PDF exportieren</Button>
 * <Button variant="outline" size="sm">Zurück</Button>
 */

import { forwardRef } from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Spinner } from '../Spinner/Spinner';
import { cn } from '@/lib/utils';
import type { ButtonProps } from './Button.types';

/**
 * App-level Button atom. 48px min-height for Material touch targets.
 * Use this everywhere instead of the shadcn Button directly.
 *
 * @param props - ButtonProps (extends shadcn ButtonProps)
 * @returns button element
 *
 * @example
 * <Button variant="default" isLoading={isSaving}>Speichern</Button>
 * <Button variant="outline" size="lg" className="w-full">Weiter</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isLoading = false, loadingLabel = 'Lädt...', disabled, className, size, ...props }, ref) => {
    // Ensure 48px touch target for all interactive sizes
    const touchClass =
      size === 'icon' ? 'min-h-12 min-w-12' : size === 'sm' ? 'min-h-10' : 'min-h-12';

    return (
      <ShadcnButton
        ref={ref}
        disabled={disabled ?? isLoading}
        size={size}
        className={cn('ripple transition-all', touchClass, className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" aria-label={loadingLabel} />
            <span aria-hidden>{props.children}</span>
          </>
        ) : (
          props.children
        )}
      </ShadcnButton>
    );
  },
);

Button.displayName = 'Button';
