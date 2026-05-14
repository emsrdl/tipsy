/**
 * @file src/context/ThemeContext.tsx
 * @description React context for theme and color mode management.
 *
 * Manages:
 * - Active theme (tipsy | katzentempel)
 * - Active accent color (within Tipsy theme)
 * - Color mode (light | dark)
 *
 * On change, injects CSS custom properties onto document.documentElement
 * and updates data-theme / data-mode attributes on <html>.
 * Persists selections to localStorage.
 *
 * @see src/config/themes.ts for theme definitions
 * @see src/styles/globals.css for CSS variable definitions
 * @see src/hooks/useTheme.ts for the consumer hook
 *
 * @example
 * // Wrap the app:
 * <ThemeProvider><App /></ThemeProvider>
 *
 * // Consume in a component:
 * const { theme, accentColor, colorMode, setAccentColor, toggleColorMode } = useTheme()
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { THEMES, THEME_IDS } from '@/config/themes';
import { LS_THEME_KEY, LS_ACCENT_KEY, LS_MODE_KEY } from '@/config/storageKeys';
import type { ThemeId, ColorMode, AccentColor, Theme, ThemePalette } from '@/types/theme';
import { env } from '@/config/env';

export interface ThemeContextValue {
  /** Current active theme object. */
  theme: Theme;
  /** Current active accent color. */
  accentColor: AccentColor;
  /** Current color mode. */
  colorMode: ColorMode;
  /** Switch to a different theme by id. */
  setTheme: (id: ThemeId) => void;
  /** Change the accent color (Tipsy theme only; no-op for Katzentempel). */
  setAccentColor: (accentId: string) => void;
  /** Toggle between light and dark mode. */
  toggleColorMode: () => void;
  /** Set color mode explicitly. */
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

/** Pre-computed map from ThemePalette key → CSS custom property name. */
const PALETTE_CSS_VARS: Record<keyof ThemePalette, string> = {
  surface: '--color-surface',
  surfaceRaised: '--color-surface-raised',
  surfaceOverlay: '--color-surface-overlay',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  textInverse: '--color-text-inverse',
  border: '--color-border',
  borderStrong: '--color-border-strong',
  statusError: '--color-status-error',
  statusSuccess: '--color-status-success',
  statusWarning: '--color-status-warning',
};

/**
 * Injects palette CSS custom properties inline on `document.documentElement`.
 * Inline styles have higher specificity than the build-time PALETTE_CSS selector
 * rules, so they take effect immediately on mode/theme changes without a page reload.
 */
function injectPaletteVars(theme: Theme, mode: ColorMode): void {
  const palette = theme.palette[mode];
  const root = document.documentElement;
  for (const key of Object.keys(PALETTE_CSS_VARS) as (keyof ThemePalette)[]) {
    root.style.setProperty(PALETTE_CSS_VARS[key], palette[key]);
  }
}

/**
 * Injects accent CSS custom properties inline on `document.documentElement`.
 * Same rationale as injectPaletteVars — bypasses the static CSS cascade.
 */
function injectAccentVars(accent: AccentColor, mode: ColorMode): void {
  const subtle = mode === 'dark' ? accent.subtleDarkHex : accent.subtleHex;
  document.documentElement.style.setProperty('--color-accent', accent.hex);
  document.documentElement.style.setProperty('--color-accent-hover', accent.hoverHex);
  document.documentElement.style.setProperty('--color-accent-subtle', subtle);
}

/** Sync the PWA status-bar tint to the given color. */
function syncStatusBarColor(color: string): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta && meta.content !== color) meta.content = color;
}

function getInitialColorMode(): ColorMode {
  const stored = localStorage.getItem(LS_MODE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialThemeId(): ThemeId {
  const stored = localStorage.getItem(LS_THEME_KEY) as ThemeId | null;
  return stored && THEME_IDS.includes(stored) ? stored : env.DEFAULT_THEME;
}

/**
 * Provides theme state and controls to the component tree.
 * Must wrap the entire app (in main.tsx).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<ThemeId>(getInitialThemeId);
  const [accentId, setAccentId] = useState<string>(() => {
    return localStorage.getItem(LS_ACCENT_KEY) ?? THEMES[themeId].defaultAccentId;
  });
  const [colorMode, setColorModeState] = useState<ColorMode>(getInitialColorMode);

  const theme = THEMES[themeId];
  const accentColor = theme.accentColors.find((c) => c.id === accentId) ?? theme.accentColors[0]!;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.setAttribute('data-mode', colorMode);
    injectPaletteVars(theme, colorMode);
    syncStatusBarColor(theme.palette[colorMode].surface);
  }, [themeId, theme, colorMode]);

  useEffect(() => {
    injectAccentVars(accentColor, colorMode);
  }, [accentColor, colorMode]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem(LS_THEME_KEY, id);
    const newDefault = THEMES[id].defaultAccentId;
    setAccentId(newDefault);
    localStorage.setItem(LS_ACCENT_KEY, newDefault);
  }, []);

  const setAccentColor = useCallback((id: string) => {
    setAccentId(id);
    localStorage.setItem(LS_ACCENT_KEY, id);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem(LS_MODE_KEY, mode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light');
  }, [colorMode, setColorMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentColor,
        colorMode,
        setTheme,
        setAccentColor,
        toggleColorMode,
        setColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Internal hook used by useTheme.ts.
 * Direct use is fine inside the context file only.
 */
export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used inside ThemeProvider');
  return ctx;
}
