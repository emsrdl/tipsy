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

import { useState, useRef, type KeyboardEvent } from 'react';
import { GROUP_COLORS } from '@/config/groups';
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

const BADGE_COLOR = {
  left: GROUP_COLORS.service,
  right: GROUP_COLORS.kitchen,
} as const;

interface SliderBadgeProps {
  side: 'left' | 'right';
  displayValue: number;
  editing: 'left' | 'right' | null;
  inputVal: string;
  min: number;
  max: number;
  disabled?: boolean | undefined;
  onStartEdit: (side: 'left' | 'right') => void;
  onInputChange: (val: string) => void;
  onCommit: () => void;
  onKey: (e: KeyboardEvent) => void;
}

function SliderBadge({
  side,
  displayValue,
  editing,
  inputVal,
  min,
  max,
  disabled,
  onStartEdit,
  onInputChange,
  onCommit,
  onKey,
}: SliderBadgeProps) {
  const colorClass = BADGE_COLOR[side];

  if (editing === side) {
    return (
      <input
        name={`slider-${side}`}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={inputVal}
        onChange={(e) => onInputChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={onKey}
        aria-label={side}
        autoFocus
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
      onClick={() => onStartEdit(side)}
      disabled={disabled}
      aria-label={`${displayValue}%`}
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
  const [editing, setEditing] = useState<'left' | 'right' | null>(null);
  const [inputVal, setInputVal] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const percent = ((value - min) / (max - min)) * 100;
  const counterValue = max - value;

  function centerInView() {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function startEdit(side: 'left' | 'right') {
    if (disabled) return;
    centerInView();
    setInputVal(String(side === 'left' ? value : counterValue));
    setEditing(side);
  }

  function commitEdit() {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && editing) {
      const clamped = Math.min(max, Math.max(min, n));
      onChange(editing === 'left' ? clamped : max - clamped);
    }
    setEditing(null);
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(null);
  }

  const badgeProps = {
    editing,
    inputVal,
    min,
    max,
    disabled,
    onStartEdit: startEdit,
    onInputChange: setInputVal,
    onCommit: commitEdit,
    onKey: handleKey,
  };

  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      {(label || counterLabel) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-sm font-medium text-text-primary">{label}</span>
              <SliderBadge side="left" displayValue={value} {...badgeProps} />
            </div>
          )}
          {counterLabel && (
            <div className="flex shrink-0 items-center gap-1.5">
              <SliderBadge side="right" displayValue={counterValue} {...badgeProps} />
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
