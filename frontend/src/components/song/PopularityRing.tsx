import { useEffect, useId, useState } from 'react'
import { animate, motion } from 'framer-motion'
import { useLastfmPopularity } from '../../hooks/useLastfmPopularity'

interface PopularityRingProps {
  title: string
  artist: string
  size?: 'sm' | 'lg'
}

const CONFIG = {
  lg: { dim: 96, r: 38, sw: 5, scoreFontSize: 20, subFontSize: 9 },
  sm: { dim: 58, r: 23, sw: 4, scoreFontSize: 13, subFontSize: 0  },
}

export function PopularityRing({ title, artist, size = 'lg' }: PopularityRingProps) {
  const { data, loading } = useLastfmPopularity(title, artist)
  const score = data?.score ?? 0

  const rawId     = useId()
  const gradId    = `rg${rawId.replace(/[^a-z0-9]/gi, '')}`

  const { dim, r, sw, scoreFontSize, subFontSize } = CONFIG[size]
  const C      = 2 * Math.PI * r
  const center = dim / 2
  const offset = C * (1 - score / 100)

  // counting number — driven by framer-motion animate(), not React state ticks
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (!score) return
    const ctrl = animate(0, score, {
      duration: 1.2,
      ease:     'easeOut',
      onUpdate: (v) => setDisplayed(Math.round(v)),
    })
    return () => ctrl.stop()
  }, [score])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-cyan)"   />
          </linearGradient>
        </defs>

        {/* background track */}
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={sw}
        />

        {/* loading dash ring */}
        {loading && (
          <circle
            cx={center} cy={center} r={r}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={sw}
            strokeDasharray="5 7"
            strokeOpacity={0.35}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${center}px ${center}px` }}
            className="animate-pulse-glow"
          />
        )}

        {/* gradient arc — animates from empty to filled */}
        {score > 0 && (
          <motion.circle
            cx={center} cy={center} r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.05 }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${center}px ${center}px` }}
          />
        )}

        {/* counting score */}
        <text
          x={center}
          y={size === 'lg' ? center - 4 : center}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text-primary)"
          fontSize={scoreFontSize}
          fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {loading ? '–' : displayed}
        </text>

        {/* /100 label (large only) */}
        {size === 'lg' && !loading && (
          <text
            x={center}
            y={center + scoreFontSize}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-text-muted)"
            fontSize={subFontSize}
            fontFamily="Inter, system-ui, sans-serif"
          >
            / 100
          </text>
        )}
      </svg>

      {size === 'lg' && (
        <span className="text-text-muted text-[10px] uppercase tracking-wider">
          {loading ? 'Fetching…' : 'Popularity'}
        </span>
      )}
    </div>
  )
}
