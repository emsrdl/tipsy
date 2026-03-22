/**
 * @file src/components/molecules/Slider/Slider.tsx
 * @description Slider molecule — Material Design range slider for percentage inputs.
 *
 * Touch-optimized with a 24px thumb target and visual track progress.
 * Used for the kitchen/service split configuration.
 *
 * @example
 * <Slider
 *   value={30}
 *   onChange={(v) => setSplit({ kitchenPercent: v, servicePercent: 100 - v })}
 *   label="Küche"
 *   counterLabel="Service"
 * />
 */

import { cn } from '@/lib/utils';

export interface SliderProps {
  /** Current value (0–100). */
  value: number;
  /** Called with the new integer value on change. */
  onChange: (value: number) => void;
  /** Minimum value. @default 0 */
  min?: number;
  /** Maximum value. @default 100 */
  max?: number;
  /** Label for the left side (lower values). */
  label?: string;
  /** Label for the right side (higher values) — shown as complement. */
  counterLabel?: string;
  /** Whether the slider is disabled. */
  disabled?: boolean;
  /** Accessible label for the range input. */
  'aria-label'?: string;
  /** Additional CSS classes for the wrapper. */
  className?: string;
}

/**
 * Material-style range slider with visual percentage labels.
 *
 * @param props - SliderProps
 * @returns div with labels and range input
 *
 * @example
 * <Slider value={30} onChange={setKitchen} label="Küche" counterLabel="Service" />
 */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  label,
  counterLabel,
  disabled,
  'aria-label': ariaLabel,
  className,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  const counterValue = max - value;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Labels */}
      {(label || counterLabel) && (
        <div className="flex items-center justify-between">
          {label && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-text-primary">{label}</span>
              <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-full bg-accent px-2 text-sm font-bold text-accent-foreground">
                {value}%
              </span>
            </div>
          )}
          {counterLabel && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-full bg-surface-overlay px-2 text-sm font-bold text-text-primary">
                {counterValue}%
              </span>
              <span className="text-sm font-medium text-text-primary">{counterLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Slider track */}
      <div className="relative flex items-center py-2">
        {/* Filled track */}
        <div
          className="absolute left-0 h-1 rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
        {/* Empty track */}
        <div
          className="absolute right-0 h-1 rounded-full bg-surface-overlay"
          style={{ width: `${100 - percent}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel ?? label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="relative z-10 h-8 w-full cursor-pointer opacity-0"
          style={{ touchAction: 'none' }}
        />

        {/* Custom thumb */}
        <div
          className="pointer-events-none absolute z-20 h-6 w-6 rounded-full border-2 border-surface bg-accent shadow-elevation-2 transition-transform"
          style={{ left: `calc(${percent}% - 12px)` }}
        />
      </div>
    </div>
  );
}
