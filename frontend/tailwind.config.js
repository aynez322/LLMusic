/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':    'var(--color-bg-base)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-raised':  'var(--color-bg-raised)',
        border:       'var(--color-border)',
        accent:       'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        cyan:         'var(--color-cyan)',
        'cyan-soft':  'var(--color-cyan-soft)',
        success:      'var(--color-success)',
        warning:      'var(--color-amber)',
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
        'badge-bg':       'var(--color-badge-bg)',
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
