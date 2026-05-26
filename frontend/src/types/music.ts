export interface AudioFeatures {
  danceability: number
  energy: number
  loudness: number
  speechiness: number
  acousticness: number
  instrumentalness: number
  liveness: number
  valence: number
  tempo: number
}

export interface Song {
  track_name: string
  artists: string
  genre: string
  popularity: number
  features: AudioFeatures
}

export interface Recommendation {
  track_name: string
  artists: string
  genre: string
  popularity: number
  similarity_score: number
}

export type AgentId = 'song_analyzer' | 'music_researcher' | 'explainability_agent'
export type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export interface AgentState {
  id: AgentId
  label: string
  status: AgentStatus
}

export type SSEEventType =
  | 'agent_start'
  | 'agent_done'
  | 'agent_error'
  | 'result'
  | 'error'
  | 'done'

export interface SSEEvent {
  type: SSEEventType
  agent?: AgentId
  data?: string
  message?: string
  suggestions?: string[]
  recommendations?: Recommendation[]
}

export interface LookupError {
  error: string
  suggestions?: string[]
}
