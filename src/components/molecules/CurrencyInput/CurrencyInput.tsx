/**
 * @file src/components/molecules/CurrencyInput/CurrencyInput.tsx
 * @description CurrencyInput molecule — numeric input with quantity control for denominations.
 *
 * Accepts non-negative integer quantities. Shows stepper buttons (+/-).
 * Used in the DenominationItem molecule.
 *
 * @example
 * <CurrencyInput
 *   value={quantity}
 *   onChange={(qty) => setQuantity(qty)}
 *   aria-label="Anzahl €10 Scheine"
 * />
 */

import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { Icon } from '@/components/atoms/Icon/Icon'

export interface CurrencyInputProps {
  /** Current quantity value (non-negative integer). */
  value: number
  /** Called with the new quantity when it changes. */
  onChange: (value: number) => void
  /** Accessible label for screen readers. */
  'aria-label'?: string
  /** Whether the input is disabled. */
  disabled?: boolean
}

/**
 * Quantity input with +/- steppers for denomination counting.
 *
 * @param props - CurrencyInputProps
 * @returns div with decrement button, number input, and increment button
 *
 * @example
 * <CurrencyInput value={3} onChange={setQty} aria-label="Anzahl €5" />
 */
export function CurrencyInput({ value, onChange, 'aria-label': ariaLabel, disabled }: CurrencyInputProps) {
  function handleChange(raw: string) {
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed)
    else if (raw === '') onChange(0)
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled ?? value <= 0}
        aria-label="Verringern"
      >
        <Icon name="chevron-left" size={14} />
      </Button>

      <Input
        type="number"
        inputMode="numeric"
        min={0}
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className="h-8 w-16 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Erhöhen"
      >
        <Icon name="chevron-right" size={14} />
      </Button>
    </div>
  )
}
