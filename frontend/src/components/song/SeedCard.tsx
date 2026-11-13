import { motion } from 'framer-motion'
import type { Track } from '../../types/music'
import { CoverPlayButton } from '../ui/CoverPlayButton'
import { StreamingLinks } from '../ui/StreamingLinks'

export function SeedCard({ track }: { track: Track }) {
  return (
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-bg-surface border border-[var(--color-border)] rounded-2xl p-6 card-glow h-full"
    >
      <p className="text-text-muted text-[10px] uppercase tracking-widest mb-4">Because you like</p>
      <div className="flex gap-5 items-center">
        <CoverPlayButton track={track} size={112} />
        <div className="min-w-0">
          <h2 className="gradient-text text-2xl font-bold leading-tight break-words">{track.title}</h2>
          <p className="text-text-secondary text-sm mt-1 truncate">{track.artist}</p>
          {track.album && <p className="text-text-muted text-xs mt-1 truncate">on {track.album}</p>}
          <div className="mt-4">
            <StreamingLinks title={track.title} artist={track.artist} deezerLink={track.link} size="sm" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
