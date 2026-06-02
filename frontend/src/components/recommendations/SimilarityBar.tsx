import { motion } from 'framer-motion'

interface SimilarityBarProps {
  score: number
}

function barColor(score: number): string {
  if (score >= 0.95) return 'var(--color-success)'
  if (score >= 0.85) return 'var(--color-amber)'
  return 'var(--color-cyan)'
}

export function SimilarityBar({ score }: SimilarityBarProps) {
  const pct   = Math.round(score * 100)
  const color = barColor(score)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-text-muted text-[10px] uppercase tracking-wider">Similarity</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-bg-raised rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
