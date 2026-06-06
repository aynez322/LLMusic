import { useEffect, useRef, useState } from 'react'

export interface SuggestItem {
  title: string
  artist: string
}

export function useSearchSuggestions(query: string) {
  const [items, setItems]     = useState<SuggestItem[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    if (query.trim().length < 2) {
      setItems([])
      return
    }

    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(query)}&limit=5`)
        if (r.ok) setItems(await r.json())
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 320)

    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query])

  return { items, loading }
}
