import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTopTracks } from '../../hooks/useTopTracks'
import { scrollBehavior } from '../../lib/media'
import type { Track } from '../../types/music'

interface TopTracksCarouselProps {
  onSelect: (track: Track) => void
}

/* ── individual card ──────────────────────────────────────────── */
function TrackCard({ track, index, onClick }: {
  track: Track
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
      className="group relative flex-shrink-0 snap-start w-40 rounded-2xl p-4 text-left overflow-hidden cursor-pointer border border-[var(--color-border)] bg-bg-surface hover:border-accent/60 transition-colors duration-200"
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

      {/* cover + position */}
      <div className="relative mb-3">
        {track.cover
          ? <img src={track.cover} alt="" loading="lazy" className="w-full aspect-square rounded-xl object-cover" />
          : <div className="w-full aspect-square rounded-xl bg-bg-raised" />}
        <span className="absolute bottom-1.5 left-1.5 px-1.5 rounded-md bg-black/60 text-white text-[10px] font-bold tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* title */}
      <p className="font-display text-text-primary text-[13px] font-semibold leading-snug line-clamp-2 mb-1 group-hover:text-accent transition-colors duration-200">
        {track.title}
      </p>

      {/* artist */}
      <p className="text-text-muted text-xs truncate">
        {track.artist}
      </p>
    </motion.button>
  )
}

/* ── skeleton ─────────────────────────────────────────────────── */
function edgeMask(left: boolean, right: boolean): string {
  return `linear-gradient(to right, transparent 0, #000 ${left ? 32 : 0}px, #000 calc(100% - ${right ? 48 : 0}px), transparent 100%)`
}

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
            className="flex-shrink-0 w-40 h-60 bg-bg-surface rounded-2xl animate-pulse"
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
      aria-label={dir === 'left' ? 'Scroll back' : 'Scroll forward'}
      className={`touch:hidden absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-bg-raised border border-[var(--color-border)] hover:border-accent flex items-center justify-center text-accent text-lg font-light transition-colors shadow-lg ${dir === 'left' ? 'left-1 lg:-left-4' : 'right-1 lg:-right-4'}`}
    >
      <span aria-hidden>{dir === 'left' ? '‹' : '›'}</span>
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
    const el = scrollRef.current
    if (!el) return
    // most of a screenful; snap settles it on a card edge
    const step = Math.max(el.clientWidth * 0.8, 172)
    el.scrollBy({ left: dir === 'right' ? step : -step, behavior: scrollBehavior() })
  }

  // edges depend on content width, which is only known once tracks render
  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [tracks])

  if (loading) return <Skeleton />

  if (!tracks.length) return null

  return (
    <div className="mt-10">
      {/* header */}
      <div className="flex items-baseline justify-between mb-4 px-1">
        <h2 className="font-display text-text-primary text-xl">
          Trending now
        </h2>
        <span className="text-text-muted text-xs">Pick one to start from it</span>
      </div>

      {/* scroll area: bleeds to the screen edges on phones (cancels main's px-4) */}
      <div className="relative -mx-4 sm:mx-0">
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
          className="flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory px-4 scroll-px-4 sm:px-0 sm:scroll-px-0 pt-4 pb-6 -mt-2 -mb-3"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            // fade the cards themselves at a scrollable edge, so it works over
            // the background video (a page-coloured overlay would show as a block)
            maskImage: edgeMask(canPrev, canNext),
            WebkitMaskImage: edgeMask(canPrev, canNext),
          }}
        >
          {tracks.map((track, i) => (
            <TrackCard
              key={track.deezer_id}
              track={track}
              index={i}
              onClick={() => onSelect(track)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
