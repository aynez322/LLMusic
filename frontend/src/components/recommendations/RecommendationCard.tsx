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

const REASON_STYLE: Record<ReasonKind, { icon: string; color: string; label: string }> = {
  listeners: { icon: '👥', color: 'var(--color-accent)', label: 'Listeners' },
  artist:    { icon: '🔗', color: 'var(--color-accent)', label: 'Related artist' },
  sound:     { icon: '🎧', color: 'var(--color-cyan)',   label: 'Sound' },
  tags:      { icon: '#',  color: 'var(--color-amber)',  label: 'Tags' },
}

function ReasonLine({ reason }: { reason: Reason }) {
  const style = REASON_STYLE[reason.kind] ?? REASON_STYLE.tags
  return (
    <li className="flex items-start gap-2 text-xs text-text-secondary leading-snug">
      <span aria-label={style.label} className="w-4 flex-shrink-0 text-center" style={{ color: style.color }}>
        {style.icon}
      </span>
      <span>{reason.text}</span>
    </li>
  )
}

function MatchBar({ score }: { score: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, score)) * 100)
  return (
    <div className="w-20" title="Overall match: listener evidence + how close it sounds">
      <div className="flex justify-between items-center mb-1">
        <span className="text-text-muted text-[10px] uppercase tracking-wider">Match</span>
        <span className="text-[11px] font-semibold tabular-nums text-text-secondary">{pct}</span>
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
      onClick={onClick}
      className="group relative bg-bg-surface border border-[var(--color-border)] rounded-2xl p-4 card-glow hover:border-accent/40 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <CoverPlayButton track={track} size={72} />
          <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-bg-base border border-accent/40 flex items-center justify-center text-accent text-[11px] font-bold">
            {rank}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-text-primary font-semibold text-sm leading-snug break-words">{track.title}</h3>
              <p className="text-text-muted text-xs mt-0.5 truncate">{track.artist}</p>
            </div>
            <MatchBar score={rec.score} />
          </div>

          {rec.reasons.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {rec.reasons.map((r, i) => <ReasonLine key={i} reason={r} />)}
            </ul>
          )}

          <div className="mt-3">
            <StreamingLinks title={track.title} artist={track.artist} deezerLink={track.link} size="sm" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
