/**
 * @file src/components/molecules/Stepper/Stepper.tsx
 * @description Stepper molecule — touch-optimized +/- counter for numeric values.
 *
 * Designed for mobile-first use: 48px minimum touch targets on both buttons,
 * large center display showing the current value.
 *
 * Long-pressing the minus button (600ms) resets the value to `min` (default 0),
 * with a visual shrink+red feedback while charging. Tapping the center value
 * opens an inline number input for direct manual entry.
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
import { useLongPress } from '@/hooks/useLongPress';
import { useInlineEdit } from '@/hooks/useInlineEdit';

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
  sm: { button: 'h-10 w-10', value: 'text-base min-w-[2.5rem]', input: 'text-base w-12', wrapper: 'gap-1' },
  md: { button: 'h-12 w-12', value: 'text-lg min-w-[3rem]',    input: 'text-lg w-14',   wrapper: 'gap-2' },
  lg: { button: 'h-14 w-14', value: 'text-xl min-w-[3.5rem]',  input: 'text-xl w-16',   wrapper: 'gap-2' },
};

/** Float-precision-safe rounding to 2 decimal places. */
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Touch-optimized stepper with +/- buttons.
 *
 * Long-pressing minus resets to `min`; tapping the value opens a direct-entry input.
 *
 * @param props - StepperProps
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

  const displayValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);

  const { handlers: decrementHandlers, pressing } = useLongPress(
    () => { const next = round2(value - step); if (next >= min) onChange(next); },
    () => onChange(min),
  );

  const { editing, startEdit, inputProps } = useInlineEdit((draft) => {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(round2(Math.round(clamped / step) * step));
    }
  });

  function increment() {
    const next = round2(value + step);
    if (next <= max) onChange(next);
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex items-center', sizes.wrapper, className)}
    >
      {/* Decrement — long press (600ms) resets to min */}
      <button
        type="button"
        aria-label={t('stepper.decrement')}
        title={t('stepper.resetHint')}
        {...decrementHandlers}
        disabled={disabled || value <= min}
        className={cn(
          sizes.button,
          'ripple flex items-center justify-center rounded-full',
          'border-2 border-border bg-surface transition-all duration-150',
          'text-text-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'active:bg-surface-overlay',
          'not-disabled:hover:border-accent not-disabled:hover:text-accent',
          pressing && 'scale-90 border-status-error text-status-error',
        )}
      >
        <Icon name="minus" size={size === 'sm' ? 14 : 18} />
      </button>

      {/* Value display / inline input */}
      {editing ? (
        <input
          type="number"
          inputMode={step < 1 ? 'decimal' : 'numeric'}
          {...inputProps}
          min={min}
          max={max}
          step={step}
          className={cn(
            sizes.input,
            'rounded border border-accent bg-surface text-center font-semibold text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-accent/50',
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          )}
          aria-label={t('stepper.editValue')}
        />
      ) : (
        <button
          type="button"
          onClick={() => startEdit(displayValue)}
          disabled={disabled}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${displayValue}${unit ? ` ${unit}` : ''} — ${t('stepper.editValue')}`}
          className={cn(
            sizes.value,
            'flex items-center justify-center gap-0.5 rounded px-1',
            'font-semibold text-text-primary transition-colors select-none',
            'not-disabled:hover:bg-surface-overlay not-disabled:hover:text-accent',
          )}
        >
          <span>{displayValue}</span>
          {unit && <span className="text-sm font-normal text-text-secondary">{unit}</span>}
        </button>
      )}

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
