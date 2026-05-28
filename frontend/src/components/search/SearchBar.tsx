import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions'
import type { SuggestItem } from '../../hooks/useSearchSuggestions'

interface SearchBarProps {
  onSubmit: (songTitle: string, artist: string) => void
  loading?: boolean
}

export function SearchBar({ onSubmit, loading = false }: SearchBarProps) {
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist]       = useState('')
  const [shake, setShake]         = useState(false)
  const [open, setOpen]           = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { items: typeahead } = useSearchSuggestions(open ? songTitle : '')

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(false)
    if (!songTitle.trim() || !artist.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    onSubmit(songTitle.trim(), artist.trim())
  }

  const handleTypeaheadSelect = (item: SuggestItem) => {
    setSongTitle(item.title)
    setArtist(item.artist)
    setOpen(false)
    onSubmit(item.title, item.artist)
  }

  return (
    <div className="w-full" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Song title + typeahead */}
          <div className="flex-1 relative">
            <label className="block text-xs text-text-muted mb-1.5 font-medium tracking-wide uppercase">
              Song Title
            </label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => { setSongTitle(e.target.value); setOpen(true) }}
              onFocus={() => { if (songTitle.length >= 2) setOpen(true) }}
              onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
              placeholder="e.g. Bohemian Rhapsody"
              autoComplete="off"
              className="w-full bg-bg-raised border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent transition-colors"
            />

            <AnimatePresence>
              {open && typeahead.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 left-0 right-0 mt-1.5 bg-bg-surface border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xl"
                  style={{ boxShadow: '0 8px 32px rgba(212,105,42,0.18)' }}
                >
                  {typeahead.map((item, i) => (
                    <button
                      key={`${item.title}-${i}`}
                      type="button"
                      onMouseDown={() => handleTypeaheadSelect(item)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-raised transition-colors text-left group border-b border-[var(--color-border)] last:border-0"
                    >
                      <span className="text-accent text-sm opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">♪</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-text-primary text-xs font-medium truncate">{item.title}</div>
                        <div className="text-text-muted text-[10px] truncate mt-0.5">{item.artist}</div>
                      </div>
                      <span className="text-text-muted text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">↵</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Artist */}
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1.5 font-medium tracking-wide uppercase">
              Artist
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Queen"
              className="w-full bg-bg-raised border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="sm:self-end">
            <Button type="submit" loading={loading} shake={shake} className="w-full sm:w-auto mt-[22px]">
              Find Similar
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
