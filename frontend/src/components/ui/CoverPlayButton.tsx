import { motion } from 'framer-motion'
import type { Track } from '../../types/music'
import { togglePreview, useIsPlaying } from '../../hooks/usePreviewPlayer'

interface CoverPlayButtonProps {
  track: Track
  size?: number
  /** Shared-element id: covers with the same id animate between each other. */
  layoutId?: string
}

/** Album cover that plays/pauses the track's 30s preview when clicked. */
export function CoverPlayButton({ track, size = 64, layoutId }: CoverPlayButtonProps) {
  const playing = useIsPlaying(track.deezer_id)
  const canPlay = !!track.preview

  return (
    <motion.button
      layoutId={layoutId}
      transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
      type="button"
      disabled={!canPlay}
      onClick={(e) => { e.stopPropagation(); togglePreview(track.deezer_id, track.preview) }}
      aria-label={playing ? `Pause ${track.title}` : `Play preview of ${track.title}`}
      title={canPlay ? (playing ? 'Pause preview' : 'Play 30s preview') : 'No preview available'}
      className="group/cover relative flex-shrink-0 overflow-hidden border border-[var(--color-border)] bg-bg-raised disabled:cursor-default"
      style={{ width: size, height: size, borderRadius: 12 }}
    >
      {track.cover && (
        <img src={track.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
      )}
      {canPlay && (
        <span
          className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity duration-150 ${
            playing ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100 group-focus-visible/cover:opacity-100'
          }`}
        >
          <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shadow-lg">
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                <rect x="2" y="1.5" width="3" height="9" rx="0.8" />
                <rect x="7" y="1.5" width="3" height="9" rx="0.8" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l7-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" />
              </svg>
            )}
          </span>
        </span>
      )}
      {/* phones can't hover, so show a small persistent play badge instead */}
      {canPlay && !playing && (
        <span
          aria-hidden
          className="hidden touch:flex absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white items-center justify-center pointer-events-none"
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l7-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" />
          </svg>
        </span>
      )}
      {playing && (
        <span className="absolute bottom-1 left-1 right-1 flex items-end justify-center gap-[2px] h-3 pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              className="w-[3px] bg-white/90 rounded-sm animate-pulse"
              style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      )}
    </motion.button>
  )
}
