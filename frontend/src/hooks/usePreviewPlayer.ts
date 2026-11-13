import { useSyncExternalStore } from 'react'

// One shared <audio> element for the whole app, so starting a preview stops
// whichever one was playing before.
const audio = typeof Audio !== 'undefined' ? new Audio() : null
let playingId: number | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(l => l())
}

if (audio) {
  audio.volume = 0.8
  audio.addEventListener('ended', () => { playingId = null; emit() })
  audio.addEventListener('error', () => { playingId = null; emit() })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function togglePreview(id: number, url: string) {
  if (!audio || !url) return
  if (playingId === id) {
    audio.pause()
    playingId = null
  } else {
    audio.src = url
    audio.play().catch(() => { playingId = null; emit() })
    playingId = id
  }
  emit()
}

export function stopPreview() {
  audio?.pause()
  playingId = null
  emit()
}

/** Whether the preview for `id` is the one currently playing. */
export function useIsPlaying(id: number): boolean {
  return useSyncExternalStore(subscribe, () => playingId === id)
}
