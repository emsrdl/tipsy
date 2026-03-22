/**
 * @file src/components/molecules/CurrencyInput/CurrencyInput.tsx
 * @description CurrencyInput molecule — touch-optimized quantity stepper for denominations.
 *
 * Touch-first: 48px × 48px +/- buttons, large value display. No keyboard needed.
 * Wraps the Stepper molecule configured for integer denomination quantities.
 *
 * @example
 * <CurrencyInput
 *   value={quantity}
 *   onChange={(qty) => setQuantity(qty)}
 *   aria-label="Anzahl €10 Scheine"
 * />
 */

import { Stepper } from '../Stepper/Stepper';

export interface CurrencyInputProps {
  /** Current quantity value (non-negative integer). */
  value: number;
  /** Called with the new quantity when it changes. */
  onChange: (value: number) => void;
  /** Accessible label for screen readers. */
  'aria-label'?: string;
  /** Whether the input is disabled. */
  disabled?: boolean;
}

/**
 * Quantity stepper for denomination counting. Touch-optimized 48px buttons.
 *
 * @param props - CurrencyInputProps
 * @returns Stepper with integer step, min 0
 *
 * @example
 * <CurrencyInput value={3} onChange={setQty} aria-label="Anzahl €5" />
 */
export function CurrencyInput({
  value,
  onChange,
  'aria-label': ariaLabel,
  disabled,
}: CurrencyInputProps) {
  return (
    <Stepper
      value={value}
      onChange={onChange}
      min={0}
      max={999}
      step={1}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
      size="md"
    />
  );
}
