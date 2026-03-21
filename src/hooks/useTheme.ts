/**
 * @file src/hooks/useTheme.ts
 * @description Hook for accessing and controlling the active theme.
 *
 * @see src/context/ThemeContext.tsx for the provider and full value shape
 *
 * @example
 * const { theme, accentColor, colorMode, toggleColorMode } = useTheme()
 */

export { useThemeContext as useTheme } from '@/context/ThemeContext'
