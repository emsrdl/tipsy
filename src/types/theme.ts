/**
 * @file src/types/theme.ts
 * @description Types for the Tipsy theming system.
 *
 * Two themes exist: "tipsy" (with 5 selectable accent colors)
 * and "katzentempel" (single fixed primary color).
 *
 * @see src/config/themes.ts for theme definitions
 * @see src/context/ThemeContext.tsx for runtime theme state
 */

/** Available theme identifiers. */
export type ThemeId = 'tipsy' | 'katzentempel';

/** Dark/light mode. */
export type ColorMode = 'light' | 'dark';

/**
 * Per-mode color tokens — surfaces, text, borders, status.
 * Accent colors are not part of the palette; they live in `Theme.accentColors`
 * and are injected at runtime by ThemeContext.
 */
export interface ThemePalette {
  surface: string;
  surfaceRaised: string;
  surfaceOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  statusError: string;
  statusSuccess: string;
  statusWarning: string;
}

/**
 * A selectable accent color within the Tipsy theme.
 * Hover and subtle variants are precomputed — no runtime color math.
 *
 * @example
 * const blue: AccentColor = {
 *   id: 'blue',
 *   labelKey: 'theme.accent.blue',
 *   hex: '#3B82F6',
 *   hoverHex: '#2563EB',
 *   subtleHex: '#DBEAFE',
 *   subtleDarkHex: '#1D3A6E',
 * }
 */
export interface AccentColor {
  /** Unique identifier, used as CSS variable key. */
  id: string;
  /** i18n key for the label. @see src/locales/de/common.json */
  labelKey: string;
  /** Base hex value. */
  hex: string;
  /** Darkened hex for hover states (~10% darker). */
  hoverHex: string;
  /** Light background tint for subtle use (light mode). */
  subtleHex: string;
  /** Dark background tint for subtle use (dark mode). */
  subtleDarkHex: string;
}

/**
 * Full theme definition.
 * Katzentempel has exactly one accent color (the primary green).
 * Tipsy has five selectable accent colors.
 *
 * @example
 * const myTheme: Theme = THEMES.tipsy
 */
export interface Theme {
  /** @see ThemeId */
  id: ThemeId;
  /** i18n key for the display name. */
  labelKey: string;
  /** Which Logo variant to render. */
  logoVariant: 'tipsy' | 'katzentempel';
  /** Whether this theme supports dark mode (both do). */
  supportsDarkMode: boolean;
  /** Whether this theme has a color picker (only Tipsy). */
  hasAccentPicker: boolean;
  /** Available accent colors. Katzentempel has exactly one. */
  accentColors: AccentColor[];
  /** The default accent color id. */
  defaultAccentId: string;
  /** Surface/text/border/status colors per mode. */
  palette: Record<ColorMode, ThemePalette>;
}
