interface SpinnerProps {
  size?: number
  color?: string
}

/** Loading indicator. Keeps spinning under reduced motion: it signals work in progress. */
export function Spinner({ size = 20, color = 'var(--color-cyan)' }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin motion-essential"
      style={{ flexShrink: 0, animationDuration: '1.2s' }}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity={0.2} strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
