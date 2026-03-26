/**
 * @file src/hooks/useThresholdInput.ts
 * @description Controlled-input state for a euro threshold value stored in cents.
 *
 * Handles the string↔cents conversion, comma-as-decimal-separator, and
 * clamping on blur so callers don't repeat this logic.
 *
 * @example
 * const threshold = useThresholdInput(thresholdInCents, setThreshold);
 * <input value={threshold.value} onChange={(e) => threshold.onChange(e.target.value)} onBlur={threshold.onBlur} />
 */

import { useState } from 'react';
import { DEFAULT_FAIRNESS_THRESHOLD } from '@/config/smartSplit';

const MIN_EUROS = 0.5;
const MAX_EUROS = 50;

function parseEuroInput(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

export interface UseThresholdInputReturn {
  /** Current display string (may be a partial/invalid value during editing). */
  value: string;
  /** Call with the raw input string on every change event. */
  onChange: (value: string) => void;
  /** Call on blur to clamp/reset to a valid value. */
  onBlur: () => void;
}

/**
 * Manages a controlled threshold input that stores its canonical value in cents.
 *
 * @param initialCents - Starting value in cents (e.g. 500 = €5.00).
 * @param setThreshold - Callback that persists the new value in cents.
 */
export function useThresholdInput(
  initialCents: number,
  setThreshold: (cents: number) => void,
): UseThresholdInputReturn {
  const [value, setValue] = useState((initialCents / 100).toFixed(2));

  function onChange(raw: string) {
    setValue(raw);
    const parsed = parseEuroInput(raw);
    if (!isNaN(parsed) && parsed >= MIN_EUROS && parsed <= MAX_EUROS) {
      setThreshold(Math.round(parsed * 100));
    }
  }

  function onBlur() {
    const parsed = parseEuroInput(value);
    if (isNaN(parsed) || parsed < MIN_EUROS) {
      setValue((DEFAULT_FAIRNESS_THRESHOLD / 100).toFixed(2));
      setThreshold(DEFAULT_FAIRNESS_THRESHOLD);
    } else {
      const clamped = Math.min(Math.max(parsed, MIN_EUROS), MAX_EUROS);
      setValue(clamped.toFixed(2));
      setThreshold(Math.round(clamped * 100));
    }
  }

  return { value, onChange, onBlur };
}
