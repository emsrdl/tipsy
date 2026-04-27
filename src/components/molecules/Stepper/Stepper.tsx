/**
 * @file src/components/molecules/Stepper/Stepper.tsx
 * @description Stepper molecule — touch-optimized +/- counter for integer values.
 *
 * Designed for mobile-first use: 48px minimum touch targets on both buttons,
 * large center display showing the current value.
 *
 * Used for:
 * - Employee hours (0.5 step)
 * - Denomination quantities (1 step)
 *
 * @example
 * <Stepper value={8} onChange={setHours} min={0} max={24} step={0.5} unit="h" />
 * <Stepper value={3} onChange={setQty} min={0} aria-label="Anzahl €10" />
 */

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/atoms/Icon/Icon';

export interface StepperProps {
  /** Current value. */
  value: number;
  /** Called with the new value on +/- press. */
  onChange: (value: number) => void;
  /** Minimum allowed value. @default 0 */
  min?: number;
  /** Maximum allowed value. @default 999 */
  max?: number;
  /** Increment/decrement step. @default 1 */
  step?: number;
  /** Unit label shown after the value (e.g. "h"). */
  unit?: string;
  /** Accessible label for the component. */
  'aria-label'?: string;
  /** Whether to disable both buttons. */
  disabled?: boolean;
  /** Additional CSS classes for the wrapper. */
  className?: string;
  /** Display size variant. @default "md" */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = {
  sm: {
    button: 'h-10 w-10',
    value: 'text-base min-w-[2.5rem]',
    wrapper: 'gap-1',
  },
  md: {
    button: 'h-12 w-12',
    value: 'text-lg min-w-[3rem]',
    wrapper: 'gap-2',
  },
  lg: {
    button: 'h-14 w-14',
    value: 'text-xl min-w-[3.5rem]',
    wrapper: 'gap-2',
  },
};

/**
 * Touch-optimized integer stepper with +/- buttons.
 *
 * @param props - StepperProps
 * @returns div with decrement button, value display, and increment button
 *
 * @example
 * <Stepper value={8} onChange={setHours} step={0.5} unit="h" />
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  'aria-label': ariaLabel,
  disabled = false,
  className,
  size = 'md',
}: StepperProps) {
  const { t } = useTranslation('common');
  const sizes = SIZE[size];

  function decrement() {
    const next = Math.round((value - step) * 100) / 100;
    if (next >= min) onChange(next);
  }

  function increment() {
    const next = Math.round((value + step) * 100) / 100;
    if (next <= max) onChange(next);
  }

  const displayValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex items-center', sizes.wrapper, className)}
    >
      {/* Decrement */}
      <button
        type="button"
        aria-label={t('stepper.decrement')}
        onClick={decrement}
        disabled={disabled || value <= min}
        className={cn(
          sizes.button,
          'ripple flex items-center justify-center rounded-full',
          'border-2 border-border bg-surface transition-all',
          'text-text-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'active:bg-surface-overlay',
          '[&:not(:disabled)]:hover:border-accent [&:not(:disabled)]:hover:text-accent',
        )}
      >
        <Icon name="minus" size={size === 'sm' ? 14 : 18} />
      </button>

      {/* Value display */}
      <div
        className={cn(
          sizes.value,
          'flex select-none items-center justify-center gap-0.5 font-semibold text-text-primary',
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        <span>{displayValue}</span>
        {unit && <span className="text-sm font-normal text-text-secondary">{unit}</span>}
      </div>

      {/* Increment */}
      <button
        type="button"
        aria-label={t('stepper.increment')}
        onClick={increment}
        disabled={disabled || value >= max}
        className={cn(
          sizes.button,
          'ripple flex items-center justify-center rounded-full',
          'bg-accent text-accent-foreground transition-all',
          'shadow-elevation-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'active:scale-95',
        )}
      >
        <Icon name="plus" size={size === 'sm' ? 14 : 18} />
      </button>
    </div>
  );
}
