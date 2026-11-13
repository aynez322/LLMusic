import type { RecommendParams, SSEEvent, Track } from '../types/music'

// In dev, '/api' is proxied to the backend by Vite (see vite.config.ts).
// In production the backend serves the frontend, so the same relative path works.
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

/** Plays through the API, which redirects to a freshly signed Deezer URL: the
 *  `preview` field in cached data expires ~15 minutes after it was fetched. */
export function previewUrl(deezerId: number): string {
  return `${BASE}/preview/${deezerId}`
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export function searchTracks(query: string, signal?: AbortSignal): Promise<Track[]> {
  return getJson(`/search?q=${encodeURIComponent(query)}&limit=6`, signal)
}

export function chartTracks(limit = 20): Promise<Track[]> {
  return getJson(`/chart?limit=${limit}`)
}

export interface TrackInfo {
  title: string
  artist: string
  listeners: number
  playcount: number
  tags: string[]
  summary: string
  lastfm_url: string
}

export function trackInfo(title: string, artist: string): Promise<TrackInfo> {
  return getJson(`/track-info?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`)
}

export function streamRecommendations(
  params: RecommendParams,
  onEvent: (event: SSEEvent) => void,
  onError: (err: Error) => void,
): () => void {
  const controller = new AbortController()

  fetch(`${BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deezer_id: params.deezerId ?? null,
      title: params.title ?? '',
      artist: params.artist ?? '',
      discovery: params.discovery,
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          // cancelled mid-chunk: drop what's left, so a late seed can't
          // write its URL or title over the home page
          if (controller.signal.aborted) return
          if (!line.startsWith('data:')) continue
          try {
            onEvent(JSON.parse(line.slice(5).trim()))
          } catch {
            // malformed line — skip
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
