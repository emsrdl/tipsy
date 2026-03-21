/**
 * @file src/components/molecules/ToggleSwitch/ToggleSwitch.tsx
 * @description Toggle switch molecule for boolean on/off controls.
 *
 * Used for: dark mode toggle, kitchen/service group selection.
 *
 * @example
 * <ToggleSwitch
 *   checked={isDark}
 *   onChange={toggleColorMode}
 *   label="Dunkel"
 * />
 */

import { cn } from '@/lib/utils'

export interface ToggleSwitchProps {
  /** Current checked state. */
  checked: boolean
  /** Called with the new value when toggled. */
  onChange: (checked: boolean) => void
  /** Visible label text. */
  label: string
  /** Whether the toggle is disabled. */
  disabled?: boolean
  /** Additional CSS classes for the wrapper. */
  className?: string
}

/**
 * Accessible toggle switch with label.
 *
 * @param props - ToggleSwitchProps
 * @returns label wrapping a visually styled checkbox
 *
 * @example
 * <ToggleSwitch checked={isDark} onChange={setDark} label="Dunkelmodus" />
 */
export function ToggleSwitch({ checked, onChange, label, disabled, className }: ToggleSwitchProps) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2', disabled && 'cursor-not-allowed opacity-50', className)}>
      <div className="relative">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        {/* Track */}
        <div
          className={cn(
            'h-5 w-9 rounded-full transition-colors',
            checked ? 'bg-accent' : 'bg-surface-overlay'
          )}
        />
        {/* Thumb */}
        <div
          className={cn(
            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-4'
          )}
        />
      </div>
      <span className="select-none text-sm text-text-primary">{label}</span>
    </label>
  )
}
