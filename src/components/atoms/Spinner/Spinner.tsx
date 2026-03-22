/**
 * @file src/components/atoms/Spinner/Spinner.tsx
 * @description Accessible loading spinner atom.
 *
 * Used inside Button (loading state) and anywhere an async operation is pending.
 *
 * @example
 * <Spinner size="sm" />
 * <Spinner aria-label="Berechnung läuft..." />
 */

import { cn } from '@/lib/utils';

export interface SpinnerProps {
  /** Visual size of the spinner. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes. */
  className?: string;
  /** Accessible label for screen readers. @default "Lädt..." */
  'aria-label'?: string;
}

const SIZE_CLASSES = {
  sm: 'h-3 w-3 border-[1.5px]',
  md: 'h-4 w-4 border-2',
  lg: 'h-5 w-5 border-2',
};

/**
 * A circular loading spinner.
 *
 * @param props - SpinnerProps
 * @returns SVG spinner element
 *
 * @example
 * <Spinner size="sm" aria-label="Exportieren..." />
 */
export function Spinner({
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Lädt...',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent',
        SIZE_CLASSES[size],
        className,
      )}
    />
  );
}
