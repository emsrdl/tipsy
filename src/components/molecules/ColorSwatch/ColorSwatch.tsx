/**
 * @file src/components/molecules/ColorSwatch/ColorSwatch.tsx
 * @description ColorSwatch molecule — a clickable color circle for the accent picker.
 *
 * Used in ThemeSwitcher to select among the 5 Tipsy accent colors.
 *
 * @example
 * <ColorSwatch
 *   colorId="blue"
 *   hex="#3B82F6"
 *   label="Blau"
 *   selected={accentId === 'blue'}
 *   onClick={() => setAccentColor('blue')}
 * />
 */

import { type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface ColorSwatchProps {
  /** Unique color id (used as key). */
  colorId: string;
  /** Hex color value for the swatch background. */
  hex: string;
  /** Accessible label. */
  label: string;
  /** Whether this swatch is currently selected. */
  selected: boolean;
  /** Called with the colorId when clicked. */
  onClick: (colorId: string) => void;
}

/**
 * Clickable color circle for accent color selection.
 *
 * @param props - ColorSwatchProps
 * @returns button element
 *
 * @example
 * <ColorSwatch colorId="purple" hex="#8B5CF6" label="Lila" selected onClick={setAccent} />
 */
export function ColorSwatch({ colorId, hex, label, selected, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      onClick={() => onClick(colorId)}
      className={cn(
        'h-7 w-7 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        selected ? 'scale-110 ring-2 ring-offset-2' : 'hover:scale-105',
      )}
      style={{ backgroundColor: hex, '--tw-ring-color': hex } as CSSProperties}
    />
  );
}
