import { useCallback, useRef, useState } from 'react'
import { trackInfo, type TrackInfo } from '../api/client'

// shared across modal opens: swiping back to a track shouldn't refetch it
const cache = new Map<string, TrackInfo | null>()

export function useTrackInfo() {
  const [info, setInfo]       = useState<TrackInfo | null>(null)
  const [loading, setLoading] = useState(false)
  // only the latest request may write state; earlier ones can resolve late
  const latest = useRef(0)

  const load = useCallback(async (title: string, artist: string) => {
    const key = `${artist}\u0000${title}`
    const id = ++latest.current
    if (cache.has(key)) {
      setInfo(cache.get(key) ?? null)
      setLoading(false)
      return
    }
    setLoading(true)
    setInfo(null)
    let result: TrackInfo | null
    try {
      result = await trackInfo(title, artist)
      cache.set(key, result)
    } catch {
      result = null
    }
    if (id !== latest.current) return
    setInfo(result)
    setLoading(false)
  }, [])

  return { info, loading, load }
}
