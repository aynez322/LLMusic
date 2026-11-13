import { motion } from 'framer-motion'
import type { Track } from '../../types/music'

interface SongNotFoundProps {
  title: string
  artist: string
  message: string
  suggestions: Track[]
  onDismiss: () => void
  onSuggestionSelect: (track: Track) => void
}

export function SongNotFound({ title, artist, message, suggestions, onDismiss, onSuggestionSelect }: SongNotFoundProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-2xl mx-auto mt-6 rounded-2xl border border-[var(--color-border)] bg-bg-surface overflow-hidden"
      style={{ boxShadow: '0 4px 32px rgba(212,105,42,0.08)' }}
    >
      <div className="h-[2px] bg-gradient-to-r from-accent via-accent/60 to-transparent" />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium">{message}</p>
            <p className="text-text-primary font-display font-semibold text-base leading-tight mt-1" style={{ wordBreak: 'break-word' }}>
              {title || 'Unknown title'}
            </p>
            {artist && <p className="text-text-muted text-xs mt-0.5">{artist}</p>}
          </div>
          <button
            onClick={onDismiss}
            className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 text-base leading-none mt-0.5"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {suggestions.length > 0 ? (
          <>
            <p className="text-text-muted text-[10px] uppercase tracking-wider mb-2 mt-4">Did you mean?</p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((t, i) => (
                <motion.button
                  key={t.deezer_id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  onClick={() => onSuggestionSelect(t)}
                  className="flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-accent/50 hover:bg-bg-raised transition-colors text-left"
                >
                  {t.cover && <img src={t.cover} alt="" className="w-8 h-8 rounded object-cover" />}
                  <span className="text-text-primary text-sm truncate">{t.title}</span>
                  <span className="text-text-muted text-xs truncate">{t.artist}</span>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-text-secondary text-xs leading-relaxed">
            Try checking the spelling, or pick a song from the suggestions as you type.
          </p>
        )}
      </div>
    </motion.div>
  )
}
