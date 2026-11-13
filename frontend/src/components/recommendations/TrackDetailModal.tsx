import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Recommendation } from '../../types/music'
import { useTrackInfo } from '../../hooks/useTrackInfo'
import { StreamingLinks } from '../ui/StreamingLinks'
import { CoverPlayButton } from '../ui/CoverPlayButton'

interface TrackDetailModalProps {
  rec: Recommendation | null
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
      <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-text-primary text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export function TrackDetailModal({ rec, onClose }: TrackDetailModalProps) {
  const { info, loading, load } = useTrackInfo()

  useEffect(() => {
    if (rec) load(rec.track.title, rec.track.artist)
  }, [rec, load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {rec && (
        <motion.div
          key="modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={`${rec.track.title} by ${rec.track.artist}`}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

          <div className="relative h-full flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.93, y: 32 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 20, transition: { duration: 0.18 } }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-bg-surface rounded-2xl overflow-hidden pointer-events-auto"
              style={{ boxShadow: '0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px var(--color-border)' }}
            >
              <div className="h-[2px] bg-gradient-to-r from-accent via-accent/70 to-cyan/50" />

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 2px)' }}>
                <div className="flex gap-5 p-6 pb-4">
                  <CoverPlayButton track={rec.track} size={88} />
                  <div className="flex-1 min-w-0 pr-6">
                    <h2 className="font-display gradient-text text-xl font-bold break-words" style={{ lineHeight: 1.22 }}>
                      {rec.track.title}
                    </h2>
                    <p className="text-text-secondary text-sm mt-1 truncate">{rec.track.artist}</p>
                    {rec.track.album && (
                      <p className="text-text-muted text-[11px] mt-2 truncate">
                        <span className="opacity-60">on</span> <span className="text-text-secondary">{rec.track.album}</span>
                      </p>
                    )}
                  </div>
                </div>

                {!loading && (info?.tags ?? []).length > 0 && (
                  <div className="px-6 pb-3 flex flex-wrap gap-1.5">
                    {info!.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-0.5 rounded-full border border-[var(--color-border)] bg-bg-raised text-text-muted text-[10px] font-medium capitalize">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="h-px mx-6 bg-[var(--color-border)]" />

                <div className="px-6 py-4">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider mb-2">Why it's recommended</p>
                  <ul className="space-y-1.5">
                    {rec.reasons.map((r, i) => (
                      <li key={i} className="text-text-secondary text-xs leading-relaxed">• {r.text}</li>
                    ))}
                  </ul>
                  <div className="flex gap-6 mt-4">
                    <Stat label="Match" value={`${Math.round(rec.score * 100)}`} />
                    {rec.sound_similarity !== null && (
                      <Stat label="Sound similarity" value={rec.sound_similarity.toFixed(2)} />
                    )}
                    {!loading && info && info.listeners > 0 && <Stat label="Listeners" value={fmt(info.listeners)} />}
                    {!loading && info && info.playcount > 0 && <Stat label="Plays" value={fmt(info.playcount)} />}
                  </div>
                </div>

                {loading && (
                  <div className="px-6 pb-4 space-y-2">
                    {[72, 88, 54].map((w, i) => (
                      <div key={i} className="h-2 bg-bg-raised rounded animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }} />
                    ))}
                  </div>
                )}

                {!loading && info?.summary && (
                  <div className="px-6 pb-4">
                    <p className="text-text-secondary text-xs leading-relaxed">{info.summary}</p>
                  </div>
                )}

                <div className="px-6 py-4 border-t border-[var(--color-border)]">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider mb-3">Listen on</p>
                  <StreamingLinks title={rec.track.title} artist={rec.track.artist} deezerLink={rec.track.link} size="sm" />
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-bg-raised border border-[var(--color-border)] text-text-muted hover:text-text-primary hover:border-accent/50 transition-all duration-150 text-[11px]"
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
