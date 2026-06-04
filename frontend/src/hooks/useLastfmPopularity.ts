import { useEffect, useState } from 'react'

interface PopularityData {
  score: number
  listeners: number
  playcount: number
}

export function useLastfmPopularity(title: string, artist: string) {
  const [data, setData]       = useState<PopularityData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!title || !artist) return

    let cancelled = false
    setLoading(true)
    setData(null)

    fetch(
      `/api/popularity?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [title, artist])

  return { data, loading }
}
