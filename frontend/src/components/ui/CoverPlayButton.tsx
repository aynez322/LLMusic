import { motion } from 'framer-motion'
import type { Track } from '../../types/music'
import { togglePreview, useIsCurrent, useIsPlaying } from '../../hooks/usePreviewPlayer'
import { Equalizer } from '../player/Equalizer'

export function PlayIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l7-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" />
    </svg>
  )
}

export function PauseIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <rect x="2" y="1.5" width="3" height="9" rx="0.8" />
      <rect x="7" y="1.5" width="3" height="9" rx="0.8" />
    </svg>
  )
}

interface CoverPlayButtonProps {
  track: Track
  size?: number
  /** Shared-element id: covers with the same id animate between each other. */
  layoutId?: string
}

/** Album cover that plays/pauses the track's 30s preview when clicked. */
export function CoverPlayButton({ track, size = 64, layoutId }: CoverPlayButtonProps) {
  const playing = useIsPlaying(track.deezer_id)
  const current = useIsCurrent(track.deezer_id)
  const canPlay = !!track.preview

  return (
    <motion.button
      layoutId={layoutId}
      transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
      type="button"
      disabled={!canPlay}
      onClick={(e) => { e.stopPropagation(); togglePreview(track) }}
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
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
            current ? 'bg-black/40 opacity-100' : 'bg-black/45 opacity-0 group-hover/cover:opacity-100 group-focus-visible/cover:opacity-100'
          }`}
        >
          {/* playing: bars, swapped for a pause button when you point at it */}
          {playing && (
            <Equalizer
              color="#fff"
              className="h-4 group-hover/cover:hidden group-focus-visible/cover:hidden"
            />
          )}
          <span
            className={`w-8 h-8 rounded-full bg-accent-fill text-on-accent items-center justify-center shadow-lg ${
              playing ? 'hidden group-hover/cover:flex group-focus-visible/cover:flex' : 'flex'
            }`}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </span>
        </span>
      )}
      {/* phones can't hover, so show a small persistent play badge instead */}
      {canPlay && !current && (
        <span
          aria-hidden
          className="hidden touch:flex absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white items-center justify-center pointer-events-none"
        >
          <PlayIcon size={9} />
        </span>
      )}
    </motion.button>
  )
}
