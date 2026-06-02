import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Recommendation } from '../../types/music'
import { Badge } from '../ui/Badge'
import { SimilarityBar } from './SimilarityBar'
import { PopularityRing } from '../song/PopularityRing'
interface RecommendationCardProps {
  rec: Recommendation
  rank: number
  explanation?: string
  onClick?: () => void
}

export const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export function RecommendationCard({ rec, rank, explanation, onClick }: RecommendationCardProps) {
  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group relative bg-bg-surface border border-[var(--color-border)] rounded-2xl p-5 card-glow hover:card-glow-hover hover:border-accent/30 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* rank badge */}
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xs font-bold">
          {rank}
        </span>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-start gap-1.5">
            <h3 className="flex-1 text-text-primary font-semibold text-sm leading-snug break-words">
              {rec.track_name}
            </h3>
            <span className="flex-shrink-0 text-accent text-sm opacity-0 group-hover:opacity-70 transition-opacity duration-150 mt-0.5 leading-none">↗</span>
          </div>
          <p className="text-text-muted text-xs mt-0.5 truncate">{rec.artists}</p>

          <div className="mt-2">
            <Badge genre={rec.genre} />
          </div>

          <div className="mt-3">
            <SimilarityBar score={rec.similarity_score} />
          </div>

          {explanation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-text-secondary text-xs leading-relaxed border-t border-[var(--color-border)] pt-3"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  strong: ({ children }) => (
                    <strong className="text-text-primary font-semibold">{children}</strong>
                  ),
                }}
              >
                {explanation}
              </ReactMarkdown>
            </motion.div>
          )}
        </div>

        {/* popularity ring */}
        <div className="flex-shrink-0 self-center">
          <PopularityRing title={rec.track_name} artist={rec.artists} size="sm" />
        </div>
      </div>
    </motion.div>
  )
}
