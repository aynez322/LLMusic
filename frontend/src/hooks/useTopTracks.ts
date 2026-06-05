import { useEffect, useState } from 'react'

export interface TopTrack {
  rank: number
  title: string
  artist: string
  genre: string
  popularity: number   // 0–100 from the dataset
}

export function useTopTracks(limit = 20) {
  const [tracks, setTracks]   = useState<TopTrack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/top-tracks?limit=${limit}`)
      .then(r => (r.ok ? r.json() : []))
      .then(setTracks)
      .catch(() => setTracks([]))
      .finally(() => setLoading(false))
  }, [limit])

  return { tracks, loading }
}
