import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * MCPHub design system.
 *
 * Dark-first, with full light-mode parity. Every semantic colour is an HSL
 * channel triplet in a CSS variable so Tailwind's `/opacity` modifiers keep
 * working (`bg-surface/60`), while the alpha-native border tokens stay raw.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          hover: 'hsl(var(--surface-hover) / <alpha-value>)',
        },
        foreground: 'hsl(var(--text-primary) / <alpha-value>)',
        muted: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          foreground: 'var(--text-muted)',
        },
        text: {
          primary: 'var(--text-primary-raw)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          from: 'hsl(var(--accent) / <alpha-value>)',
          to: 'hsl(var(--accent-to) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        // Trust Score bands.
        success: 'hsl(var(--success) / <alpha-value>)',
        warn: 'hsl(var(--warn) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        // shadcn/ui compatibility aliases.
        primary: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--surface-hover) / <alpha-value>)',
          foreground: 'hsl(var(--text-primary) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          foreground: 'hsl(var(--text-primary) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          foreground: 'hsl(var(--text-primary) / <alpha-value>)',
        },
      },
      borderColor: {
        DEFAULT: 'var(--border)',
        // `border-border` is the shadcn/ui convention; keep it working.
        border: 'var(--border)',
        hover: 'var(--border-hover)',
        subtle: 'var(--border)',
      },
      ringColor: {
        DEFAULT: 'hsl(var(--accent))',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.75rem, 6vw, 4.5rem)', { lineHeight: '1.04', letterSpacing: '-0.035em' }],
      },
      maxWidth: {
        prose: '68ch',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.16), 0 8px 24px -12px rgb(0 0 0 / 0.4)',
        glow: '0 0 0 1px hsl(var(--accent) / 0.35), 0 8px 32px -8px hsl(var(--accent) / 0.35)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
