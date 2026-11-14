import { AnimatePresence, motion } from 'framer-motion'
import {
  seek, setVolume, step, stopPreview, toggleMute, togglePreview, usePlayer, usePreviewTime,
} from '../../hooks/usePreviewPlayer'
import { PauseIcon, PlayIcon } from '../ui/CoverPlayButton'
import { Equalizer } from './Equalizer'

function clock(s: number): string {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

function SkipIcon({ back = false }: { back?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden
      style={back ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M3 2.6v10.8a.6.6 0 0 0 .92.5l7.6-5.4a.6.6 0 0 0 0-1L3.92 2.1A.6.6 0 0 0 3 2.6Z" />
      <rect x="12" y="2.5" width="2" height="11" rx="0.8" />
    </svg>
  )
}

/** Speaker with 0–2 sound waves, or a cross when silent. */
function VolumeIcon({ level }: { level: number }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z" fill="currentColor" />
      {level === 0 && <path d="M11 6.2l3.4 3.6M14.4 6.2 11 9.8" />}
      {level > 0 && <path d="M10.6 6.1a2.7 2.7 0 0 1 0 3.8" />}
      {level >= 0.5 && <path d="M12.4 4.3a5.2 5.2 0 0 1 0 7.4" />}
    </svg>
  )
}

/** Mute button + level slider. Not on phones: they use the hardware buttons
 *  (and iOS ignores volume set from a page). */
function Volume({ volume, muted }: { volume: number; muted: boolean }) {
  const level = muted ? 0 : volume
  return (
    <div className="hidden sm:flex sm:order-2 items-center gap-1 flex-shrink-0">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={level === 0 ? 'Unmute' : 'Mute'}
        className={iconBtn}
      >
        <VolumeIcon level={level} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={level}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volume"
        aria-valuetext={`${Math.round(level * 100)}%`}
        className="range-slider w-24"
        style={{ '--fill': `${level * 100}%` } as React.CSSProperties}
      />
    </div>
  )
}

/** Progress for the loaded preview. Split out so only it re-renders each frame. */
function Progress() {
  const { current, duration } = usePreviewTime()
  const fraction = duration ? current / duration : 0
  return (
    <>
      {/* phones: a hairline along the top edge */}
      <div className="sm:hidden absolute top-0 inset-x-0 h-[2px] bg-bg-raised" aria-hidden>
        <div className="h-full bg-gradient-to-r from-accent to-cyan" style={{ width: `${fraction * 100}%` }} />
      </div>
      {/* larger screens: a seekable bar with times */}
      <div className="hidden sm:flex sm:order-1 flex-1 min-w-0 items-center gap-3">
        <span className="text-text-muted text-xs tabular-nums w-8 text-right">{clock(current)}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={fraction}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          aria-valuetext={`${clock(current)} of ${clock(duration)}`}
          className="range-slider flex-1 min-w-0"
          style={{ '--fill': `${fraction * 100}%` } as React.CSSProperties}
        />
        <span className="text-text-muted text-xs tabular-nums w-8">{clock(duration || 30)}</span>
      </div>
    </>
  )
}

const iconBtn =
  'w-9 h-9 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary ' +
  'disabled:opacity-35 disabled:hover:text-text-secondary transition-colors'

/** Bottom bar for the preview that's loaded: play/pause, skip through the list, seek. */
export function MiniPlayer() {
  const { track, playing, failed, volume, muted, hasPrev, hasNext } = usePlayer()

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          key="mini-player"
          role="region"
          aria-label="Preview player"
          initial={{ y: '100%' }}
          animate={{ y: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } }}
          exit={{ y: '100%', transition: { duration: 0.2, ease: 'easeIn' } }}
          className="sticky bottom-0 z-40 border-t border-[var(--color-border)] bg-bg-surface/90 backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="relative max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3 sm:gap-5">
            <Progress />

            <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none sm:w-64">
              <div className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden bg-bg-raised">
                {track.cover && <img src={track.cover} alt="" className="w-full h-full object-cover" />}
                {playing && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <Equalizer color="#fff" className="h-3.5" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{track.title}</p>
                <p className={`text-xs truncate ${failed ? 'text-warning' : 'text-text-secondary'}`}>
                  {failed ? 'Preview unavailable' : track.artist}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 sm:order-first">
              <button type="button" onClick={() => step(-1)} disabled={!hasPrev} aria-label="Previous track" className={`${iconBtn} hidden sm:flex`}>
                <SkipIcon back />
              </button>
              <button
                type="button"
                onClick={() => togglePreview(track)}
                aria-label={playing ? 'Pause' : 'Play'}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-accent-fill hover:bg-accent-fill-hover text-on-accent transition-colors"
              >
                {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
              </button>
              <button type="button" onClick={() => step(1)} disabled={!hasNext} aria-label="Next track" className={iconBtn}>
                <SkipIcon />
              </button>
            </div>

            <Volume volume={volume} muted={muted} />

            <button type="button" onClick={stopPreview} aria-label="Close player" className={`${iconBtn} flex-shrink-0 text-xs sm:order-3`}>
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
