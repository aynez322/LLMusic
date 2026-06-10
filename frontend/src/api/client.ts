import type { Recommendation, Song, SSEEvent } from '../types/music'

// In dev, '/api' is proxied to the backend by Vite (see vite.config.ts).
// In production, set VITE_API_BASE to the backend origin, e.g. https://music-rec-api.onrender.com/api
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: res.statusText }))
    throw detail
  }
  return res.json()
}

export async function lookupSong(songTitle: string, artist: string): Promise<Song> {
  const res = await fetch(`${BASE}/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_title: songTitle, artist }),
  })
  return handleResponse<Song>(res)
}

export async function findSimilar(
  songTitle: string,
  artist: string,
  topN = 5,
): Promise<Recommendation[]> {
  const res = await fetch(`${BASE}/similar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_title: songTitle, artist, top_n: topN }),
  })
  return handleResponse<Recommendation[]>(res)
}

export function streamRecommendations(
  songTitle: string,
  artist: string,
  onEvent: (event: SSEEvent) => void,
  onError: (err: Error) => void,
): () => void {
  const controller = new AbortController()

  fetch(`${BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_title: songTitle, artist }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(detail.message ?? 'Stream failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: SSEEvent = JSON.parse(line.slice(6))
              onEvent(event)
            } catch {
              // malformed line — skip
            }
          }
        }
      }
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') return
      onError(err instanceof Error ? err : new Error(String(err)))
    })

  return () => controller.abort()
}
