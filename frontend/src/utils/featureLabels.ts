import type { AudioFeatures } from '../types/music'

export const FEATURE_LABELS: { key: keyof AudioFeatures; label: string; short: string }[] = [
  { key: 'energy',            label: 'Energy',        short: 'Energy'   },
  { key: 'danceability',      label: 'Danceability',  short: 'Dance'    },
  { key: 'valence',           label: 'Positivity',    short: 'Vibe'     },
  { key: 'acousticness',      label: 'Acousticness',  short: 'Acoustic' },
  { key: 'instrumentalness',  label: 'Instrumental',  short: 'Instrum.' },
  { key: 'liveness',          label: 'Liveness',      short: 'Live'     },
  { key: 'speechiness',       label: 'Speechiness',   short: 'Speech'   },
  { key: 'loudness',          label: 'Loudness',      short: 'Loud'     },
  { key: 'tempo',             label: 'Tempo',         short: 'Tempo'    },
]

export function normalizeFeature(key: keyof AudioFeatures, value: number): number {
  if (key === 'loudness') return Math.min(1, Math.max(0, (value + 60) / 60))
  if (key === 'tempo')    return Math.min(1, Math.max(0, value / 220))
  return Math.min(1, Math.max(0, value))
}

const GENRE_COLOR_MAP: [string, string][] = [
  ['hip-hop',    '#F97316'],
  ['hip_hop',    '#F97316'],
  ['k-pop',      '#EC4899'],
  ['kpop',       '#EC4899'],
  ['r&b',        '#8B5CF6'],
  ['rnb',        '#8B5CF6'],
  ['soul',       '#8B5CF6'],
  ['classical',  '#6366F1'],
  ['electronic', '#06B6D4'],
  ['ambient',    '#A78BFA'],
  ['reggae',     '#10B981'],
  ['country',    '#84CC16'],
  ['folk',       '#22C55E'],
  ['blues',      '#3B82F6'],
  ['jazz',       '#F59E0B'],
  ['ska',        '#F59E0B'],
  ['metal',      '#71717A'],
  ['latin',      '#EF4444'],
  ['world',      '#F97316'],
  ['rock',       '#EF4444'],
  ['pop',        '#EC4899'],
]

export function getGenreColor(genre: string): string {
  const g = genre.toLowerCase()
  for (const [key, color] of GENRE_COLOR_MAP) {
    if (g.includes(key)) return color
  }
  return '#9090BB'
}

export function extractExplanations(markdown: string): Record<number, string> {
  const result: Record<number, string> = {}
  const sections = markdown.split(/(?=### \d+\.)/)
  for (const section of sections) {
    const headingMatch = section.match(/### (\d+)\./)
    if (!headingMatch) continue
    const rank = parseInt(headingMatch[1], 10)
    // skip heading line + genre line, collect the rest
    const lines = section.split('\n').slice(2)
    const text = lines.join('\n').trim()
    if (text) result[rank] = text
  }
  return result
}
