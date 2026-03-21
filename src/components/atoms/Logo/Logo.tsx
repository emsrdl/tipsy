/**
 * @file src/components/atoms/Logo/Logo.tsx
 * @description Logo atom — renders the theme-aware app logo.
 *
 * Renders the Tipsy cocktail SVG or the Katzentempel cat SVG based on
 * the active theme. Falls back to Tipsy logo when theme is unknown.
 *
 * @see src/hooks/useTheme.ts for the active theme
 *
 * @example
 * // Automatic (theme-aware):
 * <Logo />
 *
 * // Explicit:
 * <Logo variant="katzentempel" size={32} />
 */

import { useTheme } from '@/hooks/useTheme'

export interface LogoProps {
  /** Override theme detection and force a specific logo. */
  variant?: 'tipsy' | 'katzentempel'
  /** Size in pixels for both width and height. @default 32 */
  size?: number
  /** Additional CSS classes. */
  className?: string
}

/** Tipsy cocktail SVG icon */
function TipsyLogo({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Cocktail glass */}
      <path d="M6 4L16 18L26 4H6Z" fill="currentColor" opacity="0.2" />
      <path d="M6 4L16 18L26 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="16" y1="18" x2="16" y2="26" stroke="currentColor" strokeWidth="2" />
      <line x1="11" y1="26" x2="21" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Straw */}
      <line x1="20" y1="8" x2="24" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Cherry */}
      <circle cx="24" cy="4" r="2" fill="var(--color-accent)" />
    </svg>
  )
}

/** Katzentempel cat SVG icon */
function KatzentempelLogo({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Cat head */}
      <circle cx="16" cy="18" r="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
      {/* Left ear */}
      <path d="M8 12L6 4L12 10Z" fill="currentColor" />
      {/* Right ear */}
      <path d="M24 12L26 4L20 10Z" fill="currentColor" />
      {/* Eyes */}
      <circle cx="13" cy="17" r="1.5" fill="currentColor" />
      <circle cx="19" cy="17" r="1.5" fill="currentColor" />
      {/* Nose */}
      <path d="M15 20L16 21L17 20" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Whiskers */}
      <line x1="7" y1="19" x2="12" y2="20" stroke="currentColor" strokeWidth="1" />
      <line x1="20" y1="20" x2="25" y2="19" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

/**
 * Theme-aware logo. Reads the active theme from ThemeContext unless overridden.
 *
 * @param props - LogoProps
 * @returns SVG logo element
 *
 * @example
 * <Logo size={24} />
 */
export function Logo({ variant, size = 32, className }: LogoProps) {
  const { theme } = useTheme()
  const resolved = variant ?? theme.logoVariant

  return (
    <span className={className}>
      {resolved === 'katzentempel' ? (
        <KatzentempelLogo size={size} />
      ) : (
        <TipsyLogo size={size} />
      )}
    </span>
  )
}
