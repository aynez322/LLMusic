// Bars of different speeds and phases so they never move in lockstep.
const BARS = [
  { duration: 0.9,  delay: -0.2 },
  { duration: 0.65, delay: -0.5 },
  { duration: 1.05, delay: -0.1 },
  { duration: 0.75, delay: -0.35 },
]

/** Bouncing "now playing" bars. Under reduced motion they sit still. */
export function Equalizer({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <span aria-hidden className={`flex items-end gap-[2px] ${className}`}>
      {BARS.map((b, i) => (
        <span
          key={i}
          className="w-[3px] h-full rounded-sm origin-bottom animate-eq"
          style={{ backgroundColor: color, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        />
      ))}
    </span>
  )
}
