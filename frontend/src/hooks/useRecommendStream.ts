import { useRef, useState } from 'react'
import { streamRecommendations } from '../api/client'
import type { Recommendation, RecommendParams, StageId, StageState, Track } from '../types/music'

const INITIAL_STAGES: StageState[] = [
  { id: 'resolve',    label: 'Finding your song',              status: 'idle', detail: '' },
  { id: 'candidates', label: 'Gathering what listeners pair it with', status: 'idle', detail: '' },
  { id: 'listening',  label: 'Listening to previews',          status: 'idle', detail: '' },
  { id: 'ranking',    label: 'Ranking & explaining',           status: 'idle', detail: '' },
]

export function useRecommendStream() {
  const [stages, setStages]           = useState<StageState[]>(INITIAL_STAGES)
  const [seed, setSeed]               = useState<Track | null>(null)
  const [results, setResults]         = useState<Recommendation[] | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Track[]>([])
  const [running, setRunning]         = useState(false)
  const stopRef = useRef<(() => void) | null>(null)

  function setStage(id: StageId, patch: Partial<StageState>) {
    setStages(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  function failRunningStage() {
    setStages(prev => prev.map(s => (s.status === 'running' ? { ...s, status: 'error' } : s)))
  }

  /** `onSeed` runs once the backend has resolved the exact seed track. */
  function start(params: RecommendParams, opts: { onSeed?: (seed: Track) => void } = {}) {
    stopRef.current?.()
    setStages(INITIAL_STAGES)
    setSeed(null)
    setResults(null)
    setError(null)
    setSuggestions([])
    setRunning(true)

    stopRef.current = streamRecommendations(
      params,
      (event) => {
        switch (event.type) {
          case 'stage':
            setStage(event.stage, {
              status: event.status === 'start' ? 'running' : 'done',
              detail: event.detail,
            })
            break
          case 'seed':
            setSeed(event.track)
            opts.onSeed?.(event.track)
            break
          case 'results':
            setResults(event.items)
            break
          case 'error':
            failRunningStage()
            setError(event.message)
            setSuggestions(event.suggestions ?? [])
            setRunning(false)
            break
          case 'done':
            setRunning(false)
            break
        }
      },
      (err) => {
        failRunningStage()
        setError(err.message)
        setRunning(false)
      },
    )
  }

  function reset() {
    stopRef.current?.()
    stopRef.current = null
    setStages(INITIAL_STAGES)
    setSeed(null)
    setResults(null)
    setError(null)
    setSuggestions([])
    setRunning(false)
  }

  return { stages, seed, results, error, suggestions, running, start, reset }
}
