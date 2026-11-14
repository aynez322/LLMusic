import { useState } from 'react'
import { AnimatedList } from '@/components/magicui/animated-list'
import { prefersReducedMotion } from '../../lib/media'
import type { Recommendation } from '../../types/music'
import { RecommendationCard } from './RecommendationCard'
import { TrackDetailModal } from './TrackDetailModal'

// ms between cards: ten cards land in about a second and a half
const REVEAL_DELAY = 150

export function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [origin, setOrigin]     = useState<number | null>(null)

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <h2 className="font-display text-text-primary text-xl">You might also like</h2>
        <p className="text-text-muted text-xs">Play a cover to hear a 30s preview</p>
      </div>
      {/* Magic UI's animated list, growing downward so #1 stays on top */}
      <AnimatedList
        newestOnTop={false}
        delay={prefersReducedMotion() ? 0 : REVEAL_DELAY}
        className="gap-3"
      >
        {recommendations.map((rec, i) => (
          <RecommendationCard
            key={rec.track.deezer_id}
            rec={rec}
            rank={i + 1}
            onClick={() => { setOrigin(i); setSelected(i) }}
          />
        ))}
      </AnimatedList>

      <TrackDetailModal
        recs={recommendations}
        index={selected}
        originIndex={origin}
        // browsing away ends the shared-cover link: only the opened track flies home
        onIndexChange={(i) => { setOrigin(null); setSelected(i) }}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
