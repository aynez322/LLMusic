import { motion, AnimatePresence } from 'framer-motion'

interface SuggestionListProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function SuggestionList({ suggestions, onSelect }: SuggestionListProps) {
  return (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden mt-3"
        >
          <p className="text-text-muted text-xs mb-2">Did you mean one of these?</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSelect(s)}
                className="px-3 py-1.5 rounded-lg bg-bg-raised border border-[var(--color-border)] text-text-secondary text-xs hover:border-accent hover:text-text-primary transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
