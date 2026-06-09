import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Recommendation } from '../../types/music'
import { useTrackInfo } from '../../hooks/useTrackInfo'
import { StreamingLinks } from '../ui/StreamingLinks'
import { Badge } from '../ui/Badge'

interface TrackDetailModalProps {
  rec: Recommendation | null
  onClose: () => void
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`
  return String(n)
}

function VinylPlaceholder() {
  return (
    <div className="w-full h-full bg-bg-raised flex items-center justify-center">
      <svg className="w-12 h-12 text-accent/15" viewBox="0 0 48 48">
        {[5, 10, 15, 20, 23].map(r => (
          <circle key={r} cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="0.7" />
        ))}
        <circle cx="24" cy="24" r="3" fill="currentColor" fillOpacity="0.2" />
      </svg>
    </div>
  )
}

export function TrackDetailModal({ rec, onClose }: TrackDetailModalProps) {
  const { info, loading, load } = useTrackInfo()

  useEffect(() => {
    if (rec) load(rec.track_name, rec.artists)
  }, [rec, load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {rec && (
        /* Single keyed motion root so AnimatePresence can animate exit */
        <motion.div
          key="modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Centering */}
          <div className="relative h-full flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.93, y: 32 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 20, transition: { duration: 0.18 } }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-bg-surface rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px var(--color-border)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Copper → teal top edge */}
              <div className="h-[2px] bg-gradient-to-r from-accent via-accent/70 to-cyan/50 flex-shrink-0" />

              {/* Scrollable body */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 2px)' }}>

                {/* ── Header (always visible) ── */}
                <div className="flex gap-5 p-6 pb-4">
                  {/* Album art */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-[var(--color-border)]">
                    {loading ? (
                      <div className="w-full h-full bg-bg-raised animate-pulse" />
                    ) : info?.album_art ? (
                      <img
                        src={info.album_art}
                        alt="Album art"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <VinylPlaceholder />
                    )}
                  </div>

                  {/* Title block */}
                  <div className="flex-1 min-w-0 pr-6">
                    <h2
                      className="font-display gradient-text text-xl font-bold leading-tight break-words"
                      style={{ lineHeight: 1.22 }}
                    >
                      {rec.track_name}
                    </h2>
                    <p className="text-text-secondary text-sm mt-1 truncate">{rec.artists}</p>

                    {/* Genre badge — always from rec, never null */}
                    <div className="mt-2">
                      <Badge genre={rec.genre} />
                    </div>

                    {/* Album info when available */}
                    {!loading && info?.album && (
                      <p className="text-text-muted text-[10px] mt-2 truncate">
                        <span className="opacity-55">on</span>{' '}
                        <span className="text-text-secondary">{info.album}</span>
                        {info.duration && (
                          <span className="opacity-45"> · {info.duration}</span>
                        )}
                      </p>
                    )}
                    {!loading && info && !info.album && (
                      <p className="text-text-muted text-[10px] mt-2">Single</p>
                    )}

                    {/* Featured artists */}
                    {!loading && info?.feats && (
                      <p className="text-text-muted text-[10px] mt-1">
                        feat. <span className="text-text-secondary">{info.feats}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {!loading && (info?.tags ?? []).length > 0 && (
                  <div className="px-6 pb-3 flex flex-wrap gap-1.5">
                    {info!.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full border border-[var(--color-border)] bg-bg-raised text-text-muted text-[10px] font-medium capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="h-px mx-6 bg-[var(--color-border)]" />

                {/* ── Info body ── */}
                {loading && (
                  <div className="px-6 py-4 space-y-2">
                    {[72, 88, 54].map((w, i) => (
                      <div
                        key={i}
                        className="h-2 bg-bg-raised rounded animate-pulse"
                        style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </div>
                )}

                {!loading && info?.summary && (
                  <div className="px-6 py-4">
                    <p className="text-text-secondary text-xs leading-relaxed">{info.summary}</p>
                  </div>
                )}

                {!loading && info && !info.summary && <div className="h-3" />}

                {/* No Last.fm data fallback — still useful because streaming links always follow */}
                {!loading && !info && (
                  <div className="px-6 py-4">
                    <p className="text-text-muted text-[10px] italic">
                      Additional track info not available from Last.fm.
                    </p>
                  </div>
                )}

                {/* Listener / play stats */}
                {!loading && info && (info.listeners > 0 || info.playcount > 0) && (
                  <div className="px-6 pb-4 flex gap-5">
                    {info.listeners > 0 && (
                      <div>
                        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">
                          Listeners
                        </p>
                        <p className="text-text-primary text-sm font-semibold tabular-nums">
                          {fmt(info.listeners)}
                        </p>
                      </div>
                    )}
                    {info.playcount > 0 && (
                      <div>
                        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">
                          Plays
                        </p>
                        <p className="text-text-primary text-sm font-semibold tabular-nums">
                          {fmt(info.playcount)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Streaming footer (always visible) ── */}
                <div className="px-6 py-4 border-t border-[var(--color-border)]">
                  <p className="text-text-muted text-[10px] uppercase tracking-wider mb-3">
                    Listen On
                  </p>
                  <StreamingLinks title={rec.track_name} artist={rec.artists} size="sm" />
                </div>
              </div>

              {/* Close button */}
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
