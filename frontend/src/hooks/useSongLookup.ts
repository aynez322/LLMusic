import { useState } from 'react'
import { lookupSong } from '../api/client'
import type { LookupError, Song } from '../types/music'

export function useSongLookup() {
  const [song, setSong]       = useState<Song | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<LookupError | null>(null)

  async function lookup(title: string, artist: string): Promise<Song | null> {
    setLoading(true)
    setError(null)
    try {
      const result = await lookupSong(title, artist)
      setSong(result)
      return result
    } catch (e) {
      setError(e as LookupError)
      setSong(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setSong(null)
    setError(null)
  }

  return { song, loading, error, lookup, reset }
}
