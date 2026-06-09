import { useState, useCallback } from 'react'

export interface TrackInfo {
  title: string
  artist: string
  album: string
  album_art: string
  duration: string
  listeners: number
  playcount: number
  score: number
  tags: string[]
  summary: string
  feats: string
  lastfm_url: string
}

export function useTrackInfo() {
  const [info, setInfo] = useState<TrackInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (title: string, artist: string) => {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const r = await window.fetch(
        `/api/track-info?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
      )
      if (r.ok) {
        setInfo(await r.json())
      } else {
        setError('Track info not available')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  return { info, loading, error, load }
}
