import { motion } from 'framer-motion'
import type { Song } from '../../types/music'
import { Badge } from '../ui/Badge'
import { PopularityRing } from './PopularityRing'
import { FeatureRadar } from './FeatureRadar'

interface SongCardProps {
  song: Song
}

export function SongCard({ song }: SongCardProps) {
  return (
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-bg-surface border border-[var(--color-border)] rounded-2xl p-6 card-glow"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: info + radar */}
        <div className="flex-1 min-w-0">
          <p className="text-text-muted text-[10px] uppercase tracking-widest mb-2">
            Analyzing
          </p>
          <h2 className="gradient-text text-2xl font-bold leading-tight break-words">
            {song.track_name}
          </h2>
          <p className="text-text-secondary text-sm mt-1 truncate">{song.artists}</p>
          <div className="mt-3">
            <Badge genre={song.genre} />
          </div>
          <div className="mt-5">
            <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">
              Audio Profile
            </p>
            <FeatureRadar features={song.features} />
          </div>
        </div>

        {/* Right: popularity */}
        <div className="flex md:items-start justify-center md:justify-end pt-1">
          <PopularityRing title={song.track_name} artist={song.artists} />
        </div>
      </div>
    </motion.div>
  )
}
