import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTopTracks, type TopTrack } from '../../hooks/useTopTracks'

interface TopTracksCarouselProps {
  onSelect: (title: string, artist: string) => void
}

function PopBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 rounded-full bg-bg-raised overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-cyan"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-text-muted text-[10px] tabular-nums w-5 text-right">{value}</span>
    </div>
  )
}

/* ── individual card ──────────────────────────────────────────── */
function TrackCard({ track, index, onClick }: {
  track: TopTrack
  index: number
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.045, 0.6), ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.025 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="group relative flex-shrink-0 w-40 rounded-2xl p-4 text-left overflow-hidden cursor-pointer border border-[var(--color-border)] bg-bg-surface hover:border-accent/60 transition-colors duration-200"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.35)' }}
    >
      {/* vinyl groove rings — decorative, top-right corner */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -top-2 -right-2 opacity-[0.07] w-24 h-24 text-text-primary"
        viewBox="0 0 80 80"
      >
        {[10, 18, 26, 34, 42, 50].map(r => (
          <circle key={r} cx="80" cy="0" r={r} fill="none" stroke="currentColor" strokeWidth="0.7" />
        ))}
      </svg>

      {/* copper accent line on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-accent to-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* rank */}
      <p className="gradient-text text-3xl font-bold leading-none mb-3 select-none">
        {String(track.rank).padStart(2, '0')}
      </p>

      {/* title */}
      <p className="font-display text-text-primary text-[13px] font-semibold leading-snug line-clamp-2 mb-1 group-hover:text-accent transition-colors duration-200">
        {track.title}
      </p>

      {/* artist */}
      <p className="text-text-muted text-[10px] truncate mb-4">
        {track.artist}
      </p>

      {/* popularity bar */}
      <PopBar value={track.popularity} />
    </motion.button>
  )
}

/* ── skeleton ─────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="mt-10">
      <div className="flex items-baseline justify-between mb-4">
        <div className="h-2.5 w-28 bg-bg-raised rounded animate-pulse" />
        <div className="h-2 w-14 bg-bg-raised rounded animate-pulse" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-40 h-36 bg-bg-surface rounded-2xl animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── nav arrow ────────────────────────────────────────────────── */
function NavBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-bg-raised border border-[var(--color-border)] hover:border-accent flex items-center justify-center text-accent text-lg font-light transition-colors shadow-lg ${dir === 'left' ? '-left-4' : '-right-4'}`}
    >
      {dir === 'left' ? '‹' : '›'}
    </motion.button>
  )
}

/* ── main carousel ────────────────────────────────────────────── */
export function TopTracksCarousel({ onSelect }: TopTracksCarouselProps) {
  const { tracks, loading } = useTopTracks(20)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  function updateEdges() {
    const el = scrollRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 328 : -328, behavior: 'smooth' })
  }

  if (loading) return <Skeleton />

  if (!tracks.length) return null

  return (
    <div className="mt-10">
      {/* header */}
      <div className="flex items-baseline justify-between mb-4 px-1">
        <h2 className="font-display text-text-secondary text-sm tracking-[0.12em] uppercase">
          Popular in Dataset
        </h2>
        <span className="text-text-muted text-[10px] tracking-wide">click any to explore</span>
      </div>

      {/* scroll area */}
      <div className="relative">
        {/* left edge fade */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to right, var(--color-bg-base), transparent)',
            opacity: canPrev ? 1 : 0,
          }}
        />
        {/* right edge fade */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10"
          style={{ background: 'linear-gradient(to left, var(--color-bg-base), transparent)' }}
        />

        {/* nav buttons */}
        <AnimatePresence>
          {canPrev && <NavBtn dir="left"  onClick={() => scroll('left')}  key="prev" />}
        </AnimatePresence>
        <AnimatePresence>
          {canNext && <NavBtn dir="right" onClick={() => scroll('right')} key="next" />}
        </AnimatePresence>

        {/* track list */}
        <div
          ref={scrollRef}
          onScroll={updateEdges}
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tracks.map((track, i) => (
            <TrackCard
              key={`${track.rank}-${track.title}`}
              track={track}
              index={i}
              onClick={() => onSelect(track.title, track.artist)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
