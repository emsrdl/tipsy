/**
 * @file tailwind.config.ts
 * @description Tailwind CSS configuration.
 *
 * All colors reference CSS custom properties (no hardcoded hex values).
 * CSS variables are defined in src/styles/globals.css and toggled via
 * data-theme / data-mode attributes on <html> by ThemeContext.
 *
 * Border radius default is 12px (rounded-[12px]) per design spec.
 *
 * @see src/styles/globals.css for CSS variable definitions per theme
 * @see src/context/ThemeContext.tsx for runtime theme switching
 */
import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class', '[data-mode="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        full: '9999px',
      },
      colors: {
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
          foreground: 'var(--color-accent-foreground)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
          overlay: 'var(--color-surface-overlay)',
        },
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-inverse': 'var(--color-text-inverse)',
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        status: {
          error: 'var(--color-status-error)',
          success: 'var(--color-status-success)',
          warning: 'var(--color-status-warning)',
        },
        // shadcn compatibility aliases
        background: 'var(--color-surface)',
        foreground: 'var(--color-text-primary)',
        primary: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-surface-raised)',
          foreground: 'var(--color-text-secondary)',
        },
        muted: {
          DEFAULT: 'var(--color-surface-overlay)',
          foreground: 'var(--color-text-secondary)',
        },
        destructive: {
          DEFAULT: 'var(--color-status-error)',
          foreground: 'var(--color-text-inverse)',
        },
        input: 'var(--color-border)',
        ring: 'var(--color-accent)',
        card: {
          DEFAULT: 'var(--color-surface-raised)',
          foreground: 'var(--color-text-primary)',
        },
        popover: {
          DEFAULT: 'var(--color-surface-raised)',
          foreground: 'var(--color-text-primary)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
