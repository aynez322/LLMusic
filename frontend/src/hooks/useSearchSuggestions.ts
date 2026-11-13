import { useEffect, useState } from 'react'
import { searchTracks } from '../api/client'
import type { Track } from '../types/music'

export function useSearchSuggestions(query: string) {
  const [items, setItems] = useState<Track[]>([])
  const active = query.trim().length >= 2

  useEffect(() => {
    if (!active) return

    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchTracks(query, controller.signal)
        .then(setItems)
        .catch(() => { if (!controller.signal.aborted) setItems([]) })
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, active])

  return { items: active ? items : [] }
}
