export interface Track {
  deezer_id: number
  title: string
  artist: string
  artist_id: number
  album: string
  cover: string
  preview: string
  link: string
  rank: number
  isrc: string
}

export type ReasonKind = 'listeners' | 'artist' | 'sound' | 'tags'

export interface Reason {
  kind: ReasonKind
  text: string
}

export interface Recommendation {
  track: Track
  score: number
  sound_similarity: number | null
  listener_score: number
  reasons: Reason[]
}

export interface RecommendParams {
  deezerId?: number
  title?: string
  artist?: string
  discovery: number
}

export type StageId = 'resolve' | 'candidates' | 'listening' | 'ranking'
export type StageStatus = 'idle' | 'running' | 'done' | 'error'

export interface StageState {
  id: StageId
  label: string
  status: StageStatus
  detail: string
}

export type SSEEvent =
  | { type: 'stage'; stage: StageId; status: 'start' | 'done'; detail: string }
  | { type: 'seed'; track: Track }
  | { type: 'results'; items: Recommendation[] }
  | { type: 'error'; message: string; suggestions: Track[] }
  | { type: 'done' }
