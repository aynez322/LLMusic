import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Recommendation } from '../../types/music'
import { RecommendationCard } from './RecommendationCard'
import { TrackDetailModal } from './TrackDetailModal'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  const [selected, setSelected] = useState<Recommendation | null>(null)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-text-primary text-xl">You might also like</h2>
        <p className="text-text-muted text-xs">Play a cover to hear a 30s preview</p>
      </div>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3">
        {recommendations.map((rec, i) => (
          <RecommendationCard
            key={rec.track.deezer_id}
            rec={rec}
            rank={i + 1}
            onClick={() => setSelected(rec)}
          />
        ))}
      </motion.div>

      <TrackDetailModal rec={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
