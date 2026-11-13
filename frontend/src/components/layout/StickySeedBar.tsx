import { AnimatePresence, motion } from 'framer-motion'
import type { Track } from '../../types/music'

interface StickySeedBarProps {
  seed: Track | null
  /** Show only while the full search form is scrolled out of view. */
  visible: boolean
  onNewSearch: () => void
}

/** Slim bar pinned to the top on the results page: which song the list is for,
 *  and a way back to the search without scrolling all the way up. */
export function StickySeedBar({ seed, visible, onNewSearch }: StickySeedBarProps) {
  return (
    <AnimatePresence>
      {seed && visible && (
        <motion.div
          key="sticky-seed"
          initial={{ y: '-100%' }}
          animate={{ y: 0, transition: { type: 'spring', damping: 32, stiffness: 320 } }}
          exit={{ y: '-100%', transition: { duration: 0.15, ease: 'easeIn' } }}
          className="fixed inset-x-0 top-0 z-30 border-b border-[var(--color-border)] bg-bg-surface/90 backdrop-blur-md"
        >
          {/* right padding keeps clear of the fixed theme toggle until the
              centred column is narrow enough to leave room for it */}
          <div className="max-w-5xl mx-auto px-4 sm:pr-16 min-[1160px]:pr-4 py-2 flex items-center gap-3">
            {seed.cover
              ? <img src={seed.cover} alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
              : <span className="w-9 h-9 rounded-md bg-bg-raised flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">
                <span className="text-text-secondary">Similar to </span>
                <span className="text-text-primary font-medium">{seed.title}</span>
              </p>
              <p className="text-text-muted text-xs truncate">{seed.artist}</p>
            </div>
            <button
              type="button"
              onClick={onNewSearch}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] hover:border-accent text-text-secondary hover:text-accent text-sm transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5 14 14" />
              </svg>
              New search
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
