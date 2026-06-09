import { useRef, useState } from 'react'
import { streamRecommendations } from '../api/client'
import type { AgentId, AgentState } from '../types/music'

const INITIAL_AGENTS: AgentState[] = [
  { id: 'song_analyzer',        label: 'Song Analyzer',        status: 'idle' },
  { id: 'music_researcher',     label: 'Music Researcher',     status: 'idle' },
  { id: 'explainability_agent', label: 'Explainability Agent', status: 'idle' },
]

export function useRecommendStream() {
  const [agents, setAgents]     = useState<AgentState[]>(INITIAL_AGENTS)
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const stopRef = useRef<(() => void) | null>(null)

  function setAgentStatus(id: AgentId, status: AgentState['status']) {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  function start(title: string, artist: string) {
    setStreaming(true)
    setMarkdown(null)
    setError(null)
    setAgents(INITIAL_AGENTS)

    const stop = streamRecommendations(
      title,
      artist,
      (event) => {
        switch (event.type) {
          case 'agent_start':
            if (event.agent) setAgentStatus(event.agent, 'running')
            break
          case 'agent_done':
            if (event.agent) setAgentStatus(event.agent, 'done')
            break
          case 'result':
            if (event.data) setMarkdown(event.data)
            break
          case 'error':
            setError(event.message ?? 'Pipeline error')
            setStreaming(false)
            break
          case 'done':
            setStreaming(false)
            break
        }
      },
      (err) => {
        setError(err.message)
        setStreaming(false)
      },
    )

    stopRef.current = stop
  }

  function stop() {
    stopRef.current?.()
    setStreaming(false)
  }

  function reset() {
    stop()
    setAgents(INITIAL_AGENTS)
    setMarkdown(null)
    setError(null)
  }

  return { agents, markdown, streaming, error, start, stop, reset }
}
