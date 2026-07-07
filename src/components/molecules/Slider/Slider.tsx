/**
 * @file src/components/molecules/Slider/Slider.tsx
 * @description Slider molecule — Material Design range slider for percentage inputs.
 *
 * Touch-optimized with a 24px thumb target and visual track progress.
 * Badges are tappable to enter exact values directly.
 * Used for the kitchen/service split configuration.
 *
 * @example
 * <Slider
 *   value={60}
 *   onChange={(v) => setSplit({ servicePercent: v, kitchenPercent: 100 - v })}
 *   label="Service"
 *   counterLabel="Kitchen"
 * />
 */

import { useRef } from 'react';
import { GROUP_COLORS } from '@/config/groups';
import { cn } from '@/lib/utils';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import type { InlineEditInputProps } from '@/hooks/useInlineEdit';

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

const BADGE_COLOR = {
  left: GROUP_COLORS.service,
  right: GROUP_COLORS.kitchen,
} as const;

interface SliderBadgeProps {
  side: 'left' | 'right';
  label?: string;
  displayValue: number;
  min: number;
  max: number;
  disabled?: boolean | undefined;
  editing: boolean;
  inputProps: InlineEditInputProps;
  onStartEdit: () => void;
}

function SliderBadge({
  side,
  label,
  displayValue,
  min,
  max,
  disabled,
  editing,
  inputProps,
  onStartEdit,
}: SliderBadgeProps) {
  const colorClass = BADGE_COLOR[side];

  if (editing) {
    return (
      <input
        name={`slider-${side}`}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        aria-label={label ?? side}
        {...inputProps}
        className={cn(
          'h-7 w-14 rounded-full px-2 text-center text-sm font-bold tabular-nums focus:outline-none',
          colorClass,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onStartEdit}
      disabled={disabled}
      aria-label={label ? `${label}: ${displayValue}%` : `${displayValue}%`}
      className={cn(
        'inline-flex h-7 w-14 items-center justify-center rounded-full text-sm font-bold tabular-nums transition-transform',
        'not-disabled:active:scale-95',
        colorClass,
      )}
    >
      {displayValue}%
    </button>
  );
}

/**
 * Material-style range slider with tappable percentage badges.
 *
 * Badges switch to a number input on tap for precise entry.
 * Slider uses step=5 for comfortable touch control.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const percent = ((value - min) / (max - min)) * 100;
  const counterValue = max - value;

  function centerInView() {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const leftEdit = useInlineEdit((draft) => {
    const n = parseInt(draft, 10);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
  });

  const rightEdit = useInlineEdit((draft) => {
    const n = parseInt(draft, 10);
    if (!isNaN(n)) onChange(max - Math.min(max, Math.max(min, n)));
  });

  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      {(label || counterLabel) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-sm font-medium text-text-primary">{label}</span>
              <SliderBadge
                side="left"
                label={label}
                displayValue={value}
                min={min}
                max={max}
                disabled={disabled}
                editing={leftEdit.editing}
                inputProps={leftEdit.inputProps}
                onStartEdit={() => { centerInView(); leftEdit.startEdit(String(value)); }}
              />
            </div>
          )}
          {counterLabel && (
            <div className="flex shrink-0 items-center gap-1.5">
              <SliderBadge
                side="right"
                label={counterLabel}
                displayValue={counterValue}
                min={min}
                max={max}
                disabled={disabled}
                editing={rightEdit.editing}
                inputProps={rightEdit.inputProps}
                onStartEdit={() => { centerInView(); rightEdit.startEdit(String(counterValue)); }}
              />
              <span className="text-sm font-medium text-text-primary">{counterLabel}</span>
            </div>
          )}
        </div>
      )}

      <div className="relative flex items-center py-2">
        <div
          className="absolute left-0 h-1 rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute right-0 h-1 rounded-full bg-surface-overlay"
          style={{ width: `${100 - percent}%` }}
        />

        <input
          name="split-ratio"
          type="range"
          min={min}
          max={max}
          step={5}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel ?? label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onPointerDown={centerInView}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="relative z-10 h-10 w-full cursor-pointer opacity-0"
          style={{ touchAction: 'none' }}
        />

        <div
          className="pointer-events-none absolute z-20 h-6 w-6 rounded-full border-2 border-surface bg-accent shadow-elevation-2 transition-all"
          style={{ left: `calc(${percent}% - 12px)` }}
        />
      </div>
    </div>
  );
}
