import { useState } from 'react'
import { findSimilar } from '../api/client'
import type { Recommendation } from '../types/music'

export function useSimilarSongs() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null)
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  async function search(title: string, artist: string): Promise<Recommendation[] | null> {
    setLoading(true)
    setError(null)
    setRecommendations(null)
    try {
      const result = await findSimilar(title, artist)
      setRecommendations(result)
      return result
    } catch (e) {
      setError((e as Error).message ?? 'Search failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setRecommendations(null)
    setError(null)
  }

  return { recommendations, loading, error, search, reset }
}
