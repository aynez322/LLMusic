import { useCallback, useState } from 'react'
import { trackInfo, type TrackInfo } from '../api/client'

export function useTrackInfo() {
  const [info, setInfo]       = useState<TrackInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (title: string, artist: string) => {
    setLoading(true)
    setInfo(null)
    try {
      setInfo(await trackInfo(title, artist))
    } catch {
      setInfo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return { info, loading, load }
}
