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
      screens: { '2xl': '1240px' },
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
        // Primary actions are solid foreground-on-background, not a brand
        // colour: it reads as confident rather than decorative.
        primary: {
          DEFAULT: 'hsl(var(--text-primary) / <alpha-value>)',
          foreground: 'hsl(var(--background) / <alpha-value>)',
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
        display: [
          'clamp(2.9rem, 7vw, 5.25rem)',
          { lineHeight: '0.98', letterSpacing: '-0.042em', fontWeight: '600' },
        ],
        'section-title': [
          'clamp(1.75rem, 3vw, 2.5rem)',
          { lineHeight: '1.08', letterSpacing: '-0.032em' },
        ],
        // Big homepage section statements, one step below the display size.
        statement: [
          'clamp(2.1rem, 4.4vw, 3.5rem)',
          { lineHeight: '1.04', letterSpacing: '-0.04em', fontWeight: '600' },
        ],
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
        card: '0 1px 2px 0 rgb(0 0 0 / 0.14), 0 12px 32px -16px rgb(0 0 0 / 0.5)',
        'card-hover': '0 1px 2px 0 rgb(0 0 0 / 0.18), 0 16px 40px -20px rgb(0 0 0 / 0.55)',
        glow: '0 0 0 1px var(--border-hover), 0 8px 24px -12px rgb(0 0 0 / 0.5)',
        'glow-sm': '0 0 24px -6px hsl(var(--accent) / 0.5)',
        ring: '0 0 28px -8px currentColor',
        // Layered, low-contrast depth for the hero's product window.
        window:
          '0 0 0 1px var(--border), 0 2px 4px -2px rgb(0 0 0 / 0.08), 0 24px 48px -16px rgb(0 0 0 / 0.22), 0 64px 120px -40px rgb(0 0 0 / 0.3)',
        // A whisper of lift for bento tiles: separation without heaviness.
        tile: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 1px 2px 0 rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        // Infinite logo marquee: the track holds two copies, so -50% loops seamlessly.
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        // A pulse of light travelling along an SVG path (stroke-dashoffset).
        beam: {
          from: { strokeDashoffset: '420' },
          to: { strokeDashoffset: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        // A slow drift across the accent gradient, so the hero never looks
        // like a static screenshot without ever drawing attention to itself.
        'gradient-drift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.15', transform: 'scale(1.6)' },
        },
      },
      animation: {
        marquee: 'marquee var(--marquee-duration, 60s) linear infinite',
        beam: 'beam 3.2s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        'fade-up': 'fade-up 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 400ms ease-out both',
        shimmer: 'shimmer 1.8s infinite',
        'gradient-drift': 'gradient-drift 9s ease-in-out infinite',
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 160ms ease-out',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
