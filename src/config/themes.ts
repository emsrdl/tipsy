/**
 * @file src/config/themes.ts
 * @description Theme definitions for Tipsy and Katzentempel.
 *
 * This is the single source of truth for theme colors. All hex values
 * live here — never hardcoded in components or CSS.
 *
 * ThemeContext reads this config and injects CSS custom properties onto
 * document.documentElement at runtime for the selected accent color.
 * The base theme palettes (surfaces, borders, text) are applied via
 * CSS selectors in globals.css.
 *
 * @see src/styles/globals.css for CSS custom property definitions
 * @see src/context/ThemeContext.tsx for runtime injection logic
 * @see src/types/theme.ts for the Theme and AccentColor interfaces
 *
 * @example
 * import { THEMES } from '@/config/themes'
 * const tipsy = THEMES.tipsy
 * const defaultAccent = tipsy.accentColors.find(c => c.id === tipsy.defaultAccentId)
 */

import type { Theme } from '@/types/theme';

/**
 * All theme definitions keyed by ThemeId.
 * Import and use this record rather than constructing theme objects inline.
 */
export const THEMES: Record<string, Theme> = {
  tipsy: {
    id: 'tipsy',
    labelKey: 'theme.tipsy',
    logoVariant: 'tipsy',
    supportsDarkMode: true,
    hasAccentPicker: true,
    defaultAccentId: 'blue',
    accentColors: [
      {
        id: 'blue',
        labelKey: 'theme.accent.blue',
        hex: '#3B82F6',
        hoverHex: '#2563EB',
        subtleHex: '#DBEAFE',
        subtleDarkHex: '#1D3A6E',
      },
      {
        id: 'purple',
        labelKey: 'theme.accent.purple',
        hex: '#8B5CF6',
        hoverHex: '#7C3AED',
        subtleHex: '#EDE9FE',
        subtleDarkHex: '#3B1F7A',
      },
      {
        id: 'pink',
        labelKey: 'theme.accent.pink',
        hex: '#EC4899',
        hoverHex: '#DB2777',
        subtleHex: '#FCE7F3',
        subtleDarkHex: '#6B1642',
      },
      {
        id: 'orange',
        labelKey: 'theme.accent.orange',
        hex: '#F59E0B',
        hoverHex: '#D97706',
        subtleHex: '#FEF3C7',
        subtleDarkHex: '#6B3E05',
      },
      {
        id: 'green',
        labelKey: 'theme.accent.green',
        hex: '#10B981',
        hoverHex: '#059669',
        subtleHex: '#D1FAE5',
        subtleDarkHex: '#064E35',
      },
    ],
  },

  katzentempel: {
    id: 'katzentempel',
    labelKey: 'theme.katzentempel',
    logoVariant: 'katzentempel',
    supportsDarkMode: true,
    hasAccentPicker: false,
    defaultAccentId: 'green',
    accentColors: [
      {
        id: 'green',
        labelKey: 'theme.accent.green',
        hex: '#6BA644',
        hoverHex: '#5A9038',
        subtleHex: '#D4EACA',
        subtleDarkHex: '#2A4A1A',
      },
    ],
  },
};

/**
 * Ordered list of theme ids for use in selectors and loops.
 * @example THEME_IDS.map(id => THEMES[id])
 */
export const THEME_IDS = ['tipsy', 'katzentempel'] as const;
