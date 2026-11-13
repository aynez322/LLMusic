import { useEffect, useState } from 'react'
import { chartTracks } from '../api/client'
import type { Track } from '../types/music'

export function useTopTracks(limit = 20) {
  const [tracks, setTracks]   = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chartTracks(limit)
      .then(setTracks)
      .catch(() => setTracks([]))
      .finally(() => setLoading(false))
  }, [limit])

  return { tracks, loading }
}
