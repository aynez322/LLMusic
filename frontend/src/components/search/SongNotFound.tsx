import { motion } from 'framer-motion'

interface SongNotFoundProps {
  title: string
  artist: string
  suggestions: string[]
  onDismiss: () => void
  onSuggestionSelect: (title: string) => void
}

export function SongNotFound({
  title,
  artist,
  suggestions,
  onDismiss,
  onSuggestionSelect,
}: SongNotFoundProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-2xl mx-auto mt-6 rounded-2xl border border-[var(--color-border)] bg-bg-surface overflow-hidden"
      style={{ boxShadow: '0 4px 32px rgba(212,105,42,0.08)' }}
    >
      {/* copper top edge */}
      <div className="h-[2px] bg-gradient-to-r from-accent via-accent/60 to-transparent" />

      <div className="p-6">
        {/* header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* vinyl record icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center relative">
              <div className="w-3 h-3 rounded-full bg-accent/30 border border-accent/50" />
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 40 40">
                {[14, 17, 20].map(r => (
                  <circle key={r} cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="0.8" />
                ))}
              </svg>
            </div>
            <div>
              <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium">
                Not in dataset
              </p>
              <p className="text-text-primary font-display font-semibold text-base leading-tight mt-0.5" style={{ wordBreak: 'break-word' }}>
                {title || 'Unknown title'}
              </p>
              {artist && (
                <p className="text-text-muted text-xs mt-0.5">{artist}</p>
              )}
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 text-base leading-none mt-0.5"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* explanation */}
        <p className="text-text-secondary text-xs leading-relaxed mb-4 pl-[52px]">
          This song wasn't found in the ~600K track dataset. It may be a very recent release or use a slightly different title — try adjusting your query.
        </p>

        {/* suggestions */}
        {suggestions.length > 0 && (
          <div className="pl-[52px]">
            <p className="text-text-muted text-[10px] uppercase tracking-wider mb-2">
              Did you mean?
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  onClick={() => onSuggestionSelect(s)}
                  className="px-3 py-1.5 rounded-lg bg-bg-raised border border-[var(--color-border)] text-text-secondary text-xs hover:border-accent hover:text-accent transition-all duration-150 cursor-pointer"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
