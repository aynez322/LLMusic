// Theme colors live in CSS variables (index.css) so the light/dark switch is
// one attribute. Going through color-mix keeps opacity modifiers such as
// `border-accent/40` working; a bare var() would make Tailwind drop them.
const v = (name) =>
  `color-mix(in srgb, var(--color-${name}) calc(<alpha-value> * 100%), transparent)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':    v('bg-base'),
        'bg-surface': v('bg-surface'),
        'bg-raised':  v('bg-raised'),
        border:       v('border'),
        accent:       v('accent'),
        'accent-light': v('accent-light'),
        'accent-fill':       v('accent-fill'),
        'accent-fill-hover': v('accent-fill-hover'),
        'on-accent':  v('on-accent'),
        cyan:         v('cyan'),
        'cyan-soft':  v('cyan-soft'),
        success:      v('success'),
        warning:      v('amber'),
        'text-primary':   v('text-primary'),
        'text-secondary': v('text-secondary'),
        'text-muted':     v('text-muted'),
        'badge-bg':       v('badge-bg'),
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        'bg-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'bg-shift':   'bg-shift 8s ease infinite',
      },
    },
  },
  plugins: [],
}
