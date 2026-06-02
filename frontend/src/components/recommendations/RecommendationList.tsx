import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Recommendation } from '../../types/music'
import { RecommendationCard } from './RecommendationCard'
import { TrackDetailModal } from './TrackDetailModal'

interface RecommendationListProps {
  recommendations: Recommendation[]
  explanations?: Record<number, string>
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

export function RecommendationList({
  recommendations,
  explanations = {},
}: RecommendationListProps) {
  const [selected, setSelected] = useState<Recommendation | null>(null)

  return (
    <div>
      <p className="text-text-muted text-[10px] uppercase tracking-widest mb-4 font-medium">
        Similar Songs
      </p>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3"
      >
        {recommendations.map((rec, i) => (
          <RecommendationCard
            key={`${rec.track_name}-${i}`}
            rec={rec}
            rank={i + 1}
            explanation={explanations[i + 1]}
            onClick={() => setSelected(rec)}
          />
        ))}
      </motion.div>

      <TrackDetailModal rec={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
