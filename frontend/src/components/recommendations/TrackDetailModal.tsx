import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion'
import type { Recommendation } from '../../types/music'
import { useTrackInfo } from '../../hooks/useTrackInfo'
import { useDialog } from '../../hooks/useDialog'
import { useMediaQuery } from '../../lib/media'
import { StreamingLinks } from '../ui/StreamingLinks'
import { CoverPlayButton } from '../ui/CoverPlayButton'

interface TrackDetailModalProps {
  recs: Recommendation[]
  /** Which recommendation is open; null = closed. */
  index: number | null
  /** The track the dialog was opened from; its cover grows out of the card. */
  originIndex?: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`
  return String(n)
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-muted text-xs mb-0.5">{label}</p>
      <p className="text-text-primary text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

// Phones: a sheet that rises from the bottom. Larger screens: a centred card.
const SHEET = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring' as const, damping: 34, stiffness: 340 } },
  exit:    { y: '100%', transition: { duration: 0.22, ease: 'easeIn' as const } },
}
// No scale/slide here: the cover flies in from its card (shared layoutId),
// and a moving panel would make it land off-target.
const CARD = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

// next/previous track slides in from the side it was swiped towards.
// dir 0 = not browsing (dialog closing): fade only, so the cover can fly home.
const SLIDE = {
  enter:  (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.18, ease: 'easeOut' as const } },
  exit:   (dir: number) => dir === 0
    ? { opacity: 0, transition: { duration: 0.15 } }
    : { x: dir * -48, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' as const } },
}

export function TrackDetailModal({ recs, index, originIndex = null, onIndexChange, onClose }: TrackDetailModalProps) {
  const rec = index !== null ? recs[index] ?? null : null
  const { info, loading, load } = useTrackInfo()
  const panelRef = useRef<HTMLDivElement>(null)
  const isSheet = useMediaQuery('(max-width: 639px)')
  const dragControls = useDragControls()
  const [dir, setDir] = useState(0)

  useDialog(!!rec, panelRef, onClose)

  useEffect(() => {
    if (rec) load(rec.track.title, rec.track.artist)
  }, [rec, load])

  const go = useCallback((step: 1 | -1) => {
    if (index === null) return
    const next = index + step
    if (next < 0 || next >= recs.length) return
    setDir(step)
    onIndexChange(next)
  }, [index, recs.length, onIndexChange])

  useEffect(() => {
    if (!rec) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft')  go(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [rec, go])

  // horizontal finger swipe anywhere on the content; vertical stays native scroll
  function onPanEnd(e: PointerEvent, { offset, velocity }: PanInfo) {
    if (e.pointerType !== 'touch') return
    const horizontal = Math.abs(offset.x) > Math.abs(offset.y) * 1.5
    if (!horizontal) return
    if (offset.x < -64 || velocity.x < -500) go(1)
    else if (offset.x > 64 || velocity.x > 500) go(-1)
  }

  // drag the sheet down past ~a third of a thumb's reach, or flick it, to close
  function onDragEnd(_: unknown, { offset, velocity }: PanInfo) {
    if (offset.y > 110 || velocity.y > 600) onClose()
  }

  const startDrag = (e: React.PointerEvent) => { if (isSheet) dragControls.start(e) }
  const panelMotion = isSheet ? SHEET : CARD

  return (
    <AnimatePresence>
      {rec && index !== null && (
        <motion.div
          key="modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50"
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />

          <div className="relative h-full flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={`${rec.track.title} by ${rec.track.artist}`}
              {...panelMotion}
              drag={isSheet ? 'y' : false}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.04, bottom: 0.9 }}
              onDragEnd={onDragEnd}
              className="relative w-full sm:max-w-lg max-h-[88dvh] sm:max-h-[90vh] flex flex-col bg-bg-surface rounded-t-2xl sm:rounded-2xl overflow-hidden pointer-events-auto focus:outline-none"
              style={{ boxShadow: '0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px var(--color-border)' }}
            >
              <div className="h-[2px] flex-shrink-0 bg-gradient-to-r from-accent via-accent/70 to-cyan/50" />

              {/* grab handle: phones only, and the start of the drag-to-close area */}
              {isSheet && (
                <div
                  onPointerDown={startDrag}
                  className="flex-shrink-0 flex justify-center pt-2.5 pb-1 cursor-grab"
                  style={{ touchAction: 'none' }}
                  aria-hidden
                >
                  <span className="w-10 h-1 rounded-full bg-text-muted/50" />
                </div>
              )}

              <motion.div onPanEnd={onPanEnd} className="flex-1 min-h-0 flex flex-col">
                {/* propagate: closing the dialog also "exits" the current track, which
                    is what hands the shared cover back to its card */}
                <AnimatePresence
                  mode="wait"
                  initial={false}
                  custom={dir}
                  propagate
                  onExitComplete={() => setDir(0)}
                >
                  <motion.div
                    key={rec.track.deezer_id}
                    custom={dir}
                    variants={SLIDE}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex-1 min-h-0 flex flex-col"
                  >
                    {/* header doubles as a drag handle on phones */}
                    <div
                      onPointerDown={startDrag}
                      className="flex-shrink-0 flex gap-5 px-6 pt-4 sm:pt-6 pb-4"
                      style={isSheet ? { touchAction: 'none' } : undefined}
                    >
                      <CoverPlayButton
                        track={rec.track}
                        size={88}
                        // only the opened track flies (browsing to others would pull
                        // their covers out of the list behind); phones use the sheet
                        layoutId={!isSheet && index === originIndex ? `cover-${rec.track.deezer_id}` : undefined}
                      />
                      <div className="flex-1 min-w-0 pr-8">
                        <h2 className="font-display gradient-text text-xl font-bold break-words" style={{ lineHeight: 1.22 }}>
                          {rec.track.title}
                        </h2>
                        <p className="text-text-secondary text-sm mt-1 truncate">{rec.track.artist}</p>
                        {rec.track.album && (
                          <p className="text-text-muted text-xs mt-2 truncate">
                            <span className="opacity-60">on</span> <span className="text-text-secondary">{rec.track.album}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
                      {!loading && (info?.tags ?? []).length > 0 && (
                        <div className="px-6 pb-3 flex flex-wrap gap-1.5">
                          {info!.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-0.5 rounded-full border border-[var(--color-border)] bg-bg-raised text-text-secondary text-xs font-medium capitalize">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="h-px mx-6 bg-[var(--color-border)]" />

                      <div className="px-6 py-4">
                        <h3 className="text-text-secondary text-sm font-medium mb-2">Why it's recommended</h3>
                        <ul className="space-y-1.5">
                          {rec.reasons.map((r, i) => (
                            <li key={i} className="text-text-secondary text-sm leading-relaxed">• {r.text}</li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap gap-x-6 gap-y-3 mt-4">
                          <Stat label="Match" value={`${Math.round(rec.score * 100)}`} />
                          {rec.sound_similarity !== null && (
                            <Stat label="Sound similarity" value={rec.sound_similarity.toFixed(2)} />
                          )}
                          {!loading && info && info.listeners > 0 && <Stat label="Listeners" value={fmt(info.listeners)} />}
                          {!loading && info && info.playcount > 0 && <Stat label="Plays" value={fmt(info.playcount)} />}
                        </div>
                      </div>

                      {!loading && info?.summary && (
                        <div className="px-6 pb-4">
                          <p className="text-text-secondary text-sm leading-relaxed">{info.summary}</p>
                        </div>
                      )}

                      <div className="px-6 py-4 border-t border-[var(--color-border)]">
                        <h3 className="text-text-secondary text-sm font-medium mb-3">Listen on</h3>
                        <StreamingLinks title={rec.track.title} artist={rec.track.artist} deezerLink={rec.track.link} size="sm" />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* browse without leaving the dialog; swipe does the same on phones */}
              <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--color-border)] bg-bg-surface">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={index === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-accent disabled:opacity-35 disabled:hover:text-text-secondary transition-colors"
                >
                  <span aria-hidden>‹</span> Previous
                </button>
                <span className="text-text-muted text-xs tabular-nums" aria-live="polite">
                  {index + 1} of {recs.length}
                </span>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={index === recs.length - 1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-accent disabled:opacity-35 disabled:hover:text-text-secondary transition-colors"
                >
                  Next <span aria-hidden>›</span>
                </button>
              </div>

              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-bg-raised border border-[var(--color-border)] text-text-secondary hover:text-text-primary hover:border-accent/50 transition-all duration-150 text-xs"
                style={isSheet ? { top: 22 } : undefined}
              >
                ✕
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
