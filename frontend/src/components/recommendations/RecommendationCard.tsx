import { motion } from 'framer-motion'
import type { Reason, ReasonKind, Recommendation } from '../../types/music'
import { CoverPlayButton } from '../ui/CoverPlayButton'
import { StreamingLinks } from '../ui/StreamingLinks'

interface RecommendationCardProps {
  rec: Recommendation
  rank: number
  onClick?: () => void
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

/* 14px line icons, drawn on a 16-unit grid to match the type weight */
const ICON_PATHS: Record<ReasonKind, string> = {
  // two listeners
  listeners: 'M6 7.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM1.75 13c0-2.35 1.9-4 4.25-4s4.25 1.65 4.25 4M11 7.25a1.9 1.9 0 1 0 0-3.8M12.25 9.2c1.2.45 2 1.5 2 3.05',
  // linked artists
  artist:    'M6.5 9.5l3-3M7 4.75l1.2-1.2a2.5 2.5 0 0 1 3.55 3.55l-1.2 1.2M9 11.25l-1.2 1.2a2.5 2.5 0 0 1-3.55-3.55l1.2-1.2',
  // headphones
  sound:     'M2.5 11V8.5a5.5 5.5 0 0 1 11 0V11M2.5 10h1.75v3.5H3.25a.75.75 0 0 1-.75-.75V10ZM13.5 10h-1.75v3.5h1a.75.75 0 0 0 .75-.75V10Z',
  // tag
  tags:      'M2.5 2.5h5l6 6-5 5-6-6v-5ZM5.25 5.25h.01',
}

const REASON_COLOR: Record<ReasonKind, string> = {
  listeners: 'var(--color-accent)',
  artist:    'var(--color-accent)',
  sound:     'var(--color-cyan)',
  tags:      'var(--color-amber)',
}

function ReasonLine({ reason }: { reason: Reason }) {
  const kind = reason.kind in ICON_PATHS ? reason.kind : 'tags'
  return (
    <li className="flex items-start gap-2 text-sm text-text-secondary leading-snug">
      <svg
        viewBox="0 0 16 16" width="14" height="14" aria-hidden
        className="mt-[3px] flex-shrink-0"
        fill="none" stroke={REASON_COLOR[kind]} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d={ICON_PATHS[kind]} />
      </svg>
      <span>{reason.text}</span>
    </li>
  )
}

function MatchBar({ score }: { score: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, score)) * 100)
  return (
    <div className="w-20" title="Overall match: listener evidence + how close it sounds">
      <div className="flex justify-between items-center mb-1">
        <span className="text-text-muted text-xs">Match</span>
        <span className="text-xs font-semibold tabular-nums text-text-primary">{pct}</span>
      </div>
      <div className="h-1.5 bg-bg-raised rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-cyan"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export function RecommendationCard({ rec, rank, onClick }: RecommendationCardProps) {
  const { track } = rec
  return (
    <motion.div
      variants={cardVariant}
      className="group relative bg-bg-surface border border-[var(--color-border)] rounded-2xl p-4 card-glow hover:border-accent/40 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* z-10: sits above the title button's card-wide hit area */}
        <div className="relative z-10">
          <CoverPlayButton track={track} size={72} layoutId={`cover-${track.deezer_id}`} />
          <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-bg-base border border-accent/40 flex items-center justify-center text-accent text-[11px] font-bold">
            {rank}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-text-primary font-semibold text-base leading-snug break-words">
                {/* The title is the card's real button; its ::after stretches over the
                    whole card so a click anywhere opens details, while the cover and
                    streaming links (z-10) keep their own clicks. */}
                <button
                  type="button"
                  onClick={onClick}
                  aria-haspopup="dialog"
                  className="text-left focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--color-accent)]"
                >
                  {track.title}
                </button>
              </h3>
              <p className="text-text-secondary text-sm mt-0.5 truncate">{track.artist}</p>
            </div>
            <MatchBar score={rec.score} />
          </div>

          {rec.reasons.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {rec.reasons.map((r, i) => <ReasonLine key={i} reason={r} />)}
            </ul>
          )}

          <div className="mt-3 relative z-10 w-fit">
            <StreamingLinks title={track.title} artist={track.artist} deezerLink={track.link} size="sm" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
