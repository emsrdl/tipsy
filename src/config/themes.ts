/**
 * @file src/config/themes.ts
 * @description Theme definitions for Tipsy and Katzentempel.
 *
 * Single source of truth for all theme colors — surfaces, text, borders,
 * status, and accents. No hex value lives in CSS or components; CSS variables
 * are generated from this module at build time and injected into index.html.
 *
 * ThemeContext additionally overrides accent vars at runtime when the user
 * picks a different accent color (Tipsy theme only).
 *
 * @see vite.config.ts → tipsy:theme-palette plugin for CSS generation
 * @see src/context/ThemeContext.tsx for runtime accent injection
 * @see src/types/theme.ts for the Theme, ThemePalette, and AccentColor interfaces
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
    palette: {
      light: {
        surface: '#ffffff',
        surfaceRaised: '#f8fafc',
        surfaceOverlay: '#f1f5f9',
        textPrimary: '#0f172a',
        textSecondary: '#64748b',
        textInverse: '#ffffff',
        border: '#e2e8f0',
        borderStrong: '#cbd5e1',
        statusError: '#ef4444',
        statusSuccess: '#22c55e',
        statusWarning: '#f59e0b',
      },
      dark: {
        surface: '#0f172a',
        surfaceRaised: '#1e293b',
        surfaceOverlay: '#334155',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        textInverse: '#0f172a',
        border: '#334155',
        borderStrong: '#475569',
        statusError: '#f87171',
        statusSuccess: '#4ade80',
        statusWarning: '#fbbf24',
      },
    },
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
    palette: {
      light: {
        surface: '#f9fafb',
        surfaceRaised: '#f3f4f6',
        surfaceOverlay: '#e5e7eb',
        textPrimary: '#1b2415',
        textSecondary: '#4a6340',
        textInverse: '#ffffff',
        border: '#d1d5db',
        borderStrong: '#9ca3af',
        statusError: '#dc2626',
        statusSuccess: '#16a34a',
        statusWarning: '#d97706',
      },
      dark: {
        surface: '#111827',
        surfaceRaised: '#1f2937',
        surfaceOverlay: '#374151',
        textPrimary: '#f3f4f6',
        textSecondary: '#d1d5db',
        textInverse: '#111827',
        border: '#4b5563',
        borderStrong: '#6b7280',
        statusError: '#f87171',
        statusSuccess: '#4ade80',
        statusWarning: '#fbbf24',
      },
    },
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
