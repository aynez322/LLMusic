import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions'
import type { Track } from '../../types/music'

interface SearchBarProps {
  /** A suggestion was picked: recommend from that exact track. */
  onPick: (track: Track) => void
  /** Free-text submit without picking a suggestion. */
  onSubmit: (title: string, artist: string) => void
  discovery: number
  onDiscoveryChange: (value: number) => void
  loading?: boolean
}

function discoveryLabel(v: number): string {
  if (v < 0.25) return 'Familiar hits'
  if (v < 0.75) return 'Balanced'
  return 'Deep cuts'
}

export function SearchBar({ onPick, onSubmit, discovery, onDiscoveryChange, loading = false }: SearchBarProps) {
  const [title, setTitle]   = useState('')
  const [artist, setArtist] = useState('')
  const [shake, setShake]   = useState(false)
  const [open, setOpen]     = useState(false)
  const [active, setActive] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const query = `${title} ${artist}`.trim()
  const { items } = useSearchSuggestions(open ? query : '')

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function pick(track: Track) {
    setTitle(track.title)
    setArtist(track.artist)
    setOpen(false)
    onPick(track)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (open && active >= 0 && items[active]) {
      pick(items[active])
      return
    }
    setOpen(false)
    if (!title.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    // nothing picked: the backend resolves the typed text to the best match
    onSubmit(title.trim(), artist.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % items.length) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => (a <= 0 ? items.length - 1 : a - 1)) }
  }

  const inputClass =
    'w-full bg-bg-raised border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-text-primary ' +
    'placeholder:text-text-muted text-sm focus:outline-none focus:border-accent transition-colors'

  return (
    <div className="w-full" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="song-title" className="block text-xs text-text-muted mb-1.5 font-medium tracking-wide uppercase">
                Song
              </label>
              <input
                id="song-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setOpen(true); setActive(-1) }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Reckoner"
                autoComplete="off"
                className={inputClass}
              />
            </div>

            <div className="flex-1">
              <label htmlFor="song-artist" className="block text-xs text-text-muted mb-1.5 font-medium tracking-wide uppercase">
                Artist
              </label>
              <input
                id="song-artist"
                type="text"
                value={artist}
                onChange={(e) => { setArtist(e.target.value); setOpen(true); setActive(-1) }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Radiohead"
                autoComplete="off"
                className={inputClass}
              />
            </div>

            <div className="sm:self-end">
              <Button type="submit" loading={loading} shake={shake} className="w-full sm:w-auto">
                Find Similar
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {open && items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 left-0 right-0 mt-1.5 bg-bg-surface border border-[var(--color-border)] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 8px 32px rgba(212,105,42,0.18)' }}
                role="listbox"
              >
                {items.map((track, i) => (
                  <button
                    key={track.deezer_id}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => { e.preventDefault(); pick(track) }}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left border-b border-[var(--color-border)] last:border-0 ${
                      i === active ? 'bg-bg-raised' : ''
                    }`}
                  >
                    {track.cover
                      ? <img src={track.cover} alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
                      : <span className="w-9 h-9 rounded-md bg-bg-raised flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-text-primary text-sm font-medium truncate">{track.title}</div>
                      <div className="text-text-muted text-xs truncate mt-0.5">
                        {track.artist}{track.album && <span className="opacity-70"> · {track.album}</span>}
                      </div>
                    </div>
                    <span className={`text-text-muted text-xs flex-shrink-0 ${i === active ? 'opacity-100' : 'opacity-0'}`}>↵</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Discovery dial */}
        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="discovery" className="text-xs text-text-muted font-medium tracking-wide uppercase whitespace-nowrap">
            Discovery
          </label>
          <input
            id="discovery"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={discovery}
            onChange={(e) => onDiscoveryChange(Number(e.target.value))}
            className="flex-1 max-w-xs accent-[var(--color-accent)]"
            aria-valuetext={discoveryLabel(discovery)}
          />
          <span className="text-xs text-text-secondary w-24">{discoveryLabel(discovery)}</span>
        </div>
      </form>
    </div>
  )
}
