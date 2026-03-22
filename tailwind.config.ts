/**
 * @file tailwind.config.ts
 * @description Tailwind CSS — Material Design tokens.
 *
 * All colors reference CSS custom properties (no hardcoded hex values).
 * Material Design elevation shadows, 8px grid spacing, and touch-target
 * sizing (48px minimum) are included.
 *
 * @see src/styles/globals.css for CSS variable definitions
 * @see src/context/ThemeContext.tsx for runtime theme switching
 */
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

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
        '2xl': '28px',
        full: '9999px',
      },
      boxShadow: {
        // Material Design elevation system
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'elevation-2': '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.10)',
        'elevation-4': '0 6px 10px rgba(0,0,0,0.14), 0 1px 18px rgba(0,0,0,0.08)',
        'elevation-8': '0 12px 17px rgba(0,0,0,0.14), 0 5px 22px rgba(0,0,0,0.08)',
      },
      spacing: {
        '18': '4.5rem', // 72px
        '14': '3.5rem', // 56px — AppBar / bottom nav
        '13': '3.25rem', // 52px
        '12': '3rem', // 48px — Material min touch target
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
} satisfies Config;
